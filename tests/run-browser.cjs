#!/usr/bin/env node
'use strict';
const { spawn, execFileSync } = require('node:child_process');
const { existsSync, readdirSync } = require('node:fs');
const { basename, join } = require('node:path');
const { createInterface } = require('node:readline');

function parseOptions(args) {
  const options = { jobs: 1, timeoutMs: 600_000, filters: [] };
  for (const arg of args) {
    if (arg.startsWith('--jobs=') || arg.startsWith('--timeout=')) {
      const separator = arg.indexOf('=');
      const key = arg.slice(0, separator), raw = arg.slice(separator + 1);
      const value = Number(raw);
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < (key === '--jobs' ? 1 : 0) || (key === '--timeout' && value > 2_147_483)) {
        throw new Error(`Invalid ${key}: ${raw}`);
      }
      if (key === '--jobs') options.jobs = value;
      else options.timeoutMs = value * 1000;
    } else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else options.filters.push(arg);
  }
  return options;
}

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  return [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].find(existsSync);
}

// Playwright starts browsers in separate groups. Capture descendant-owned groups
// before terminating the suite, and retain them if their parent exits first.
function killTree(child, signal, groups, log) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    killer.on('error', () => child.kill(signal));
  } else {
    groups.add(child.pid);
    try {
      const rows = execFileSync('ps', ['-A', '-o', 'pid=,ppid=,pgid='], { encoding: 'utf8', timeout: 1000 }).trim().split('\n').map(line => line.trim().split(/\s+/).map(Number));
      const owned = new Set([child.pid]);
      let previous;
      do {
        previous = owned.size;
        for (const [pid, parent] of rows) if (owned.has(parent)) owned.add(pid);
      } while (owned.size !== previous);
      for (const [pid, , group] of rows) if (owned.has(pid) && owned.has(group)) groups.add(group);
    } catch (error) { log(`Cleanup warning: cannot enumerate browser groups: ${error.message}`); }
    for (const group of groups) {
      try { process.kill(-group, signal); } catch (error) { if (error.code !== 'ESRCH') log(`Cleanup warning: ${error.message}`); }
    }
  }
}

function runSuite(file, { env = process.env, timeoutMs = 600_000, heartbeatMs = 30_000, signal, log = console.log, executable = process.execPath } = {}) {
  return new Promise(resolve => {
    const name = basename(file), started = Date.now();
    log(`START ${name} ${new Date(started).toISOString()}`);
    let child;
    try { child = spawn(executable, [file], { env, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (error) {
      log(`FAIL ${name}: ${error.message}`);
      resolve({ file, code: null, error, seconds: (Date.now() - started) / 1000, passed: false });
      return;
    }
    let reason, launchError, forceKill;
    const groups = new Set();
    const seconds = () => (Date.now() - started) / 1000;
    for (const [stream, suffix] of [[child.stdout, ''], [child.stderr, ' stderr']]) {
      createInterface({ input: stream }).on('line', line => log(`[${name}${suffix}] ${line}`));
    }
    const stop = why => {
      if (reason) return;
      reason = why;
      log(`${why.toUpperCase()} ${name} (${seconds().toFixed(1)}s)`);
      killTree(child, 'SIGTERM', groups, log);
      forceKill = setTimeout(() => {
        killTree(child, 'SIGKILL', groups, log);
        // An already-exited parent can leave pipes open in an orphaned child.
        // Its ancestry is no longer discoverable; don't let it block the runner.
        log(`[${name}] Closing output pipes after the cleanup grace period; reparented descendants may need manual cleanup.`);
        child.stdout.destroy(); child.stderr.destroy();
      }, 2000);
    };
    const abort = () => stop('interrupted');
    const timeout = timeoutMs ? setTimeout(() => stop('timeout'), timeoutMs) : undefined;
    const heartbeat = setInterval(() => log(`RUNNING ${name} (${seconds().toFixed(1)}s)`), heartbeatMs);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    child.on('error', error => { launchError = error; log(`[${name} stderr] ${error.message}`); });
    child.on('close', (code, exitSignal) => {
      clearTimeout(timeout); clearInterval(heartbeat); clearTimeout(forceKill);
      signal?.removeEventListener('abort', abort);
      if (reason) killTree(child, 'SIGKILL', groups, log);
      const result = { file, code, signal: exitSignal, reason, error: launchError, seconds: seconds() };
      result.passed = code === 0 && !reason && !launchError;
      log(`${result.passed ? 'ok  ' : 'FAIL'} ${name} (${result.seconds.toFixed(1)}s)${reason ? `: ${reason}` : ''}${exitSignal ? `: ${exitSignal}` : ''}`);
      resolve(result);
    });
  });
}

async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    console.log('Usage: npm run test:browser -- [name filters] [--jobs=N] [--timeout=seconds]\nDefaults: one suite at a time, 600 seconds per suite; --timeout=0 disables the limit.\nOutput streams live; running suites report elapsed time every 30 seconds.');
    return 0;
  }
  const { jobs, timeoutMs, filters } = parseOptions(args);
  const chrome = findChrome();
  let playwright = process.env.PLAYWRIGHT_MODULE;
  if (!playwright) { try { playwright = require.resolve('playwright-core'); } catch { /* Report below. */ } }
  if (!chrome) throw new Error('No Chrome found. Set CHROME_BIN to a Chrome or Chromium executable.');
  if (!playwright) throw new Error('playwright-core is missing. Run npm ci, or set PLAYWRIGHT_MODULE.');
  const queue = readdirSync(__dirname).filter(file => file.endsWith('.browser.cjs') && (!filters.length || filters.some(name => file.includes(name)))).sort();
  if (!queue.length) throw new Error('No browser tests match ' + filters.join(', '));
  const controller = new AbortController(), results = [];
  let interrupted;
  const onInterrupt = signal => { interrupted ??= signal; controller.abort(); };
  const onInt = () => onInterrupt('SIGINT'), onTerm = () => onInterrupt('SIGTERM');
  process.on('SIGINT', onInt); process.on('SIGTERM', onTerm);
  try {
    await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
      while (queue.length && !controller.signal.aborted) {
        results.push(await runSuite(join(__dirname, queue.shift()), {
          env: { ...process.env, CHROME_BIN: chrome, PLAYWRIGHT_MODULE: playwright }, timeoutMs, signal: controller.signal,
        }));
      }
    }));
  } finally { process.off('SIGINT', onInt); process.off('SIGTERM', onTerm); }
  console.log(`\n${results.filter(result => result.passed).length}/${results.length} browser test files passed`);
  if (interrupted) { console.log(`Interrupted; ${queue.length} suite(s) not started.`); return interrupted === 'SIGINT' ? 130 : 143; }
  return results.every(result => result.passed) ? 0 : 1;
}

module.exports = { parseOptions, runSuite };
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 1; });
