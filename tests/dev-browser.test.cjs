const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

// Exercise the real helper in a child process with local Vite/Playwright stand-ins.
// Fail each owned lifetime boundary without opening Chrome or a listening socket.
test('development browser lifetime releases partial startup and preserves the first failure', () => {
  const root = mkdtempSync(join(tmpdir(), 'cui-dev-browser-'));
  try {
    mkdirSync(join(root, 'tests'));
    mkdirSync(join(root, 'node_modules/vite'), { recursive: true });
    mkdirSync(join(root, 'node_modules/playwright-core'), { recursive: true });
    copyFileSync(join(__dirname, 'dev-browser.cjs'), join(root, 'tests/dev-browser.cjs'));
    writeFileSync(join(root, 'node_modules/vite/package.json'), JSON.stringify({ type: 'module', exports: './index.js' }));
    writeFileSync(join(root, 'node_modules/vite/index.js'), `
      import assert from 'node:assert/strict';
      export async function createServer(options) {
        assert.equal(options.root, process.cwd());
        assert.deepEqual(options.server, { host: '127.0.0.1', port: 0, open: false });
        step('create');
        return { listen: async () => step('listen'), close: async () => step('server-close'),
          httpServer: { address: () => ({ port: 43123 }) } };
      }
    `);
    const playwright = `exports.chromium = { launch: async options => {
      require('node:assert/strict').deepEqual(options, { executablePath: 'test-chrome', headless: true });
      step('launch'); return { close: async () => step('browser-close') };
    } };`;
    writeFileSync(join(root, 'node_modules/playwright-core/index.js'), playwright);
    const alternate = join(root, 'alternate-playwright.cjs');
    writeFileSync(alternate, playwright);
    writeFileSync(join(root, 'probe.cjs'), `
      globalThis.calls = [];
      globalThis.step = name => { calls.push(name); if (process.env.FAIL_AT.split(',').includes(name)) throw new Error(name); };
      require('./tests/dev-browser.cjs').withDevBrowser(async ({ browser, base }) => {
        require('node:assert/strict').equal(base, 'http://127.0.0.1:43123');
        require('node:assert/strict').equal(typeof browser.close, 'function');
        step('run'); return 42;
      }).then(result => console.log(JSON.stringify({ calls, result })), error => {
        console.log(JSON.stringify({ calls, error: error.message })); process.exitCode = 1;
      });
    `);
    const cases = [
      ['', ['create', 'listen', 'launch', 'run', 'browser-close', 'server-close']],
      ['create', ['create']],
      ['listen', ['create', 'listen', 'server-close']],
      ['launch', ['create', 'listen', 'launch', 'server-close']],
      ['run', ['create', 'listen', 'launch', 'run', 'browser-close', 'server-close']],
      ['browser-close', ['create', 'listen', 'launch', 'run', 'browser-close', 'server-close']],
      ['server-close', ['create', 'listen', 'launch', 'run', 'browser-close', 'server-close']],
      ['run,browser-close,server-close', ['create', 'listen', 'launch', 'run', 'browser-close', 'server-close']],
    ];
    for (const module of ['', alternate]) for (const [failure, calls] of cases) {
      const child = spawnSync(process.execPath, [join(root, 'probe.cjs')], {
        cwd: root, encoding: 'utf8', env: { ...process.env, PLAYWRIGHT_MODULE: module, CHROME_BIN: 'test-chrome', FAIL_AT: failure },
      });
      assert.equal(child.status, failure ? 1 : 0, `${module || 'default'}/${failure || 'success'}: ${child.stderr}`);
      assert.deepEqual(JSON.parse(child.stdout), failure ? { calls, error: failure.split(',')[0] } : { calls, result: 42 });
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
