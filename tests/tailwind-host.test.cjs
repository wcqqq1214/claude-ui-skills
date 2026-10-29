const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

test('Tailwind example dependency ranges and Node engine match the tested host', () => {
  const host = require('../package.json');
  const example = require('../examples/tailwind-host/package.json');
  assert.deepEqual(example.dependencies, host.dependencies, 'the consumer needs the same React runtime dependencies');
  // Playwright belongs to the repository's browser runner, not the consumer build.
  const buildDependencies = Object.fromEntries(Object.entries(host.devDependencies).filter(([name]) => name !== 'playwright-core'));
  assert.deepEqual(example.devDependencies, buildDependencies, 'update all consumer build dependencies and the tested host together');
  assert.deepEqual(example.engines, host.engines, 'the example must declare the tested Node engine range');
});

test('Tailwind host lifetime cleans every resource and preserves the first failure', () => {
  const root = mkdtempSync(join(tmpdir(), 'cui-host-lifetime-'));
  try {
    for (const directory of ['tests', 'examples/tailwind-host', 'src', 'node_modules/vite', 'node_modules/playwright-core', 'node_modules/typescript/bin']) {
      mkdirSync(join(root, directory), { recursive: true });
    }
    copyFileSync(join(__dirname, 'tailwind-host.browser.cjs'), join(root, 'tests/tailwind-host.browser.cjs'));
    writeFileSync(join(root, 'node_modules/typescript/bin/tsc'), '');
    writeFileSync(join(root, 'node_modules/vite/package.json'), JSON.stringify({ type: 'module', exports: './index.js' }));
    writeFileSync(join(root, 'node_modules/vite/index.js'), `
      export async function build() { step('build'); }
      export async function preview() {
        step('preview');
        return { httpServer: { address: () => ({ port: 43123 }), close: done => {
          try { step('server-close'); done(); } catch (error) { done(error); }
        } } };
      }
    `);
    writeFileSync(join(root, 'node_modules/playwright-core/index.js'), `
      exports.chromium = { launch: async () => {
        step('launch'); return { close: async () => step('browser-close') };
      } };
    `);
    writeFileSync(join(root, 'probe.cjs'), `
      const fs = require('node:fs/promises'), assert = require('node:assert/strict');
      const calls = []; let target;
      globalThis.step = name => { calls.push(name); if (process.env.FAIL_AT.split(',').includes(name)) throw new Error(name); };
      const create = fs.mkdtemp, remove = fs.rm;
      fs.mkdtemp = async (...args) => { target = await create(...args); return target; };
      fs.rm = async (...args) => { step('remove'); return remove(...args); };
      require('./tests/tailwind-host.browser.cjs').withTailwindHost(async ({ browser, base }) => {
        assert.equal(base, 'http://127.0.0.1:43123');
        assert.equal(typeof browser.close, 'function');
        step('run'); return 42;
      }).then(result => ({ result }), error => ({ error: error.message })).then(async result => {
        const removed = !require('node:fs').existsSync(target);
        // Clean up the deliberately injected directory-removal failure too.
        await remove(target, { recursive: true, force: true });
        console.log(JSON.stringify({ ...result, calls, removed }));
      }).catch(error => { console.error(error); process.exitCode = 1; });
    `);
    const full = ['build', 'preview', 'launch', 'run', 'browser-close', 'server-close', 'remove'];
    const cases = [
      ['', full],
      ['build', ['build', 'remove']],
      ['preview', ['build', 'preview', 'remove']],
      ['launch', ['build', 'preview', 'launch', 'server-close', 'remove']],
      ...['run', 'browser-close', 'server-close', 'remove', 'run,browser-close,server-close', 'browser-close,server-close,remove'].map(failure => [failure, full]),
    ];
    for (const [failure, calls] of cases) {
      const child = spawnSync(process.execPath, [join(root, 'probe.cjs')], {
        cwd: root, encoding: 'utf8', timeout: 15000,
        env: { ...process.env, PLAYWRIGHT_MODULE: '', FAIL_AT: failure },
      });
      assert.equal(child.status, 0, `${failure || 'success'}: ${child.stderr}`);
      assert.deepEqual(JSON.parse(child.stdout), {
        ...(failure ? { error: failure.split(',')[0] } : { result: 42 }),
        calls, removed: !failure.split(',').includes('remove'),
      });
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
