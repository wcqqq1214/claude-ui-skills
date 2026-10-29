const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, dirname } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { parseOptions, runSuite } = require('./run-browser.cjs');

async function fixture(source, run) {
  const directory = await mkdtemp(join(tmpdir(), 'browser-runner-test-'));
  try { const file = join(directory, 'fixture.cjs'); await writeFile(file, source); await run(file); }
  finally { await rm(directory, { recursive: true, force: true }); }
}

test('browser CLI rejects invalid concurrency/time limits and retains name filters', () => {
  assert.deepEqual(parseOptions(['gallery', '--jobs=3', '--timeout=120']), { jobs: 3, timeoutMs: 120_000, filters: ['gallery'] });
  assert.equal(parseOptions(['--timeout=0']).timeoutMs, 0);
  for (const argument of ['--jobs=0', '--jobs=1.5', '--jobs=Infinity', '--jobs=2=3', '--timeout=-1', '--timeout=', '--timeout=2147484', '--unknown']) {
    assert.throws(() => parseOptions([argument]), /Invalid|Unknown/);
  }
});

test('suite output streams before exit, heartbeat reports progress, and failures retain diagnostics', async () => {
  await fixture("console.log('ready'); setTimeout(() => { console.error('diagnostic'); process.exitCode = 7; }, 300);", async file => {
    const lines = []; let complete = false, notifyReady;
    const ready = new Promise(resolve => { notifyReady = resolve; });
    const running = runSuite(file, { timeoutMs: 5000, heartbeatMs: 50, log: line => { lines.push(line); if (line.endsWith('] ready')) notifyReady(); } }).then(result => { complete = true; return result; });
    await Promise.race([ready, running.then(() => { throw new Error('suite exited without live ready output'); })]);
    assert.equal(complete, false, 'output must be available while the suite is running');
    const result = await running;
    assert.equal(result.code, 7); assert.equal(result.passed, false);
    assert.ok(lines.some(line => line.startsWith('RUNNING ')));
    assert.ok(lines.some(line => line.includes('stderr] diagnostic')));
  });
});

test('success and spawn failures settle without leaving timers running', async () => {
  await fixture("console.log('SKIP optional physical gesture');", async file => {
    const lines = [];
    assert.equal((await runSuite(file, { timeoutMs: 0, log: line => lines.push(line) })).passed, true);
    assert.ok(lines.some(line => line.includes('SKIP optional physical gesture')));
    for (const executable of [join(file, 'missing-node'), join(dirname(file), 'missing-node')]) {
      const result = await runSuite(file, { executable, log: () => {} });
      assert.equal(result.passed, false); assert.ok(result.error);
    }
  });
});

test('timeout kills a stubborn suite and its separately grouped descendant', { skip: process.platform === 'win32' }, async () => {
  await fixture(`const {spawn}=require('node:child_process');
    process.on('SIGTERM',()=>{});
    const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{}); setInterval(()=>{},1000)"],{stdio:'inherit',detached:true});
    console.log('descendant='+child.pid); setInterval(()=>{},1000);`, async file => {
    let pid;
    const result = await runSuite(file, { timeoutMs: 1000, log: line => { const match = line.match(/descendant=(\d+)/); if (match) pid = Number(match[1]); } });
    assert.equal(result.reason, 'timeout'); assert.equal(result.passed, false); assert.ok(pid);
    let alive = true;
    for (let attempt = 0; attempt < 30 && alive; attempt++) {
      try { process.kill(pid, 0); await delay(50); } catch (error) { assert.equal(error.code, 'ESRCH'); alive = false; }
    }
    assert.equal(alive, false, 'descendant must be released too');
  });
});

test('abort interrupts an active suite even when timeout is disabled', async () => {
  await fixture("console.log('ready'); setInterval(()=>{},1000);", async file => {
    const controller = new AbortController();
    let ready = false;
    const fallback = setTimeout(() => controller.abort(), 5000);
    try {
      const result = await runSuite(file, { timeoutMs: 0, signal: controller.signal, log: line => { if (line.endsWith('] ready')) { ready = true; controller.abort(); } } });
      assert.equal(ready, true); assert.equal(result.reason, 'interrupted'); assert.equal(result.passed, false);
    } finally { clearTimeout(fallback); }
  });
});

test('an exited suite with inherited pipes still respects the timeout', { skip: process.platform === 'win32' }, async () => {
  await fixture(`const {spawn}=require('node:child_process');
    const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit',detached:true});
    console.log('descendant='+child.pid); process.exit(0);`, async file => {
    let pid, guard;
    const running = runSuite(file, { timeoutMs: 300, log: line => { const match = line.match(/descendant=(\d+)/); if (match) pid = Number(match[1]); } });
    try {
      const result = await Promise.race([running, new Promise((_, reject) => { guard = setTimeout(() => reject(new Error('inherited pipes blocked timeout completion')), 6000); })]);
      assert.equal(result.reason, 'timeout'); assert.equal(result.passed, false); assert.ok(pid);
    } finally {
      clearTimeout(guard);
      // A child reparented before timeout has no discoverable suite ancestry.
      if (pid) { try { process.kill(-pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; } }
      await running;
    }
  });
});
