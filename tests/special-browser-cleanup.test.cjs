const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

// Run the actual suite entry points with fake owned resources. Feedback's
// pre-browser controller checks still use the real module and assertions.
test('special browser suites release partial startup and preserve assertion failures', () => {
  const root = mkdtempSync(join(tmpdir(), 'cui-special-cleanup-'));
  try {
    for (const dir of ['tests', 'dist', 'node_modules/vite', 'node_modules/playwright-core']) {
      mkdirSync(join(root, dir), { recursive: true });
    }
    for (const file of ['production.browser.cjs', 'react-ssr.browser.cjs', 'react-feedback.browser.cjs', 'demo-helpers.cjs', 'browser-errors.cjs', 'status-notice-lifecycle-checks.cjs']) {
      copyFileSync(join(__dirname, file), join(root, 'tests', file));
    }
    writeFileSync(join(root, 'dist/index.html'), '');
    writeFileSync(join(root, 'node_modules/vite/package.json'), JSON.stringify({ type: 'module', exports: './index.js' }));
    writeFileSync(join(root, 'node_modules/vite/index.js'), `
      export async function createServer() {
        step('create');
        return {
          listen: async () => step('listen'), close: async () => step('server-close'),
          httpServer: { address: () => ({ port: 43123 }) },
          ssrLoadModule: async id => {
            step('controller');
            const { createServer } = await import(${JSON.stringify(pathToFileURL(require.resolve('vite')).href)});
            const server = await createServer({ root: ${JSON.stringify(resolve(__dirname, '..'))}, configFile: false, server: { middlewareMode: true }, logLevel: 'silent' });
            try { return await server.ssrLoadModule(id); } finally { await server.close(); }
          },
        };
      }
    `);
    writeFileSync(join(root, 'node_modules/playwright-core/index.js'), `
      exports.chromium = { launch: async () => {
        step('launch');
        return { close: async () => step('browser-close'),
          newPage: async () => step('assertion'), newContext: async () => step('assertion') };
      } };
    `);
    writeFileSync(join(root, 'probe.cjs'), `
      const calls = [], failures = process.env.FAIL_AT.split(',');
      globalThis.step = name => { calls.push(name); if (failures.includes(name)) throw Error('injected ' + name); };
      const http = require('node:http'), { EventEmitter } = require('node:events');
      if (process.env.SUITE === 'production') http.createServer = () => {
        step('create');
        const server = new EventEmitter();
        server.address = () => ({ port: 43123 });
        server.listen = (_port, _host, done) => {
          try { step('listen'); done(); } catch (error) { server.emit('error', error); }
        };
        server.close = done => {
          try { step('server-close'); done(); } catch (error) { done(error); }
        };
        return server;
      };
      console.error = error => { console.log(JSON.stringify({ error: error.message, calls })); };
      require('./tests/' + process.env.SUITE + '.browser.cjs');
    `);
    for (const suite of ['production', 'react-ssr', 'react-feedback']) {
      const controller = suite === 'react-feedback' ? ['controller'] : [];
      const full = ['create', 'listen', ...controller, 'launch', 'assertion', 'browser-close', 'server-close'];
      const cases = [
        ['create', ['create']],
        ['listen', ['create', 'listen', 'server-close']],
        ['listen,server-close', ['create', 'listen', 'server-close']],
        ['launch', ['create', 'listen', ...controller, 'launch', 'server-close']],
        ['launch,server-close', ['create', 'listen', ...controller, 'launch', 'server-close']],
        ...['assertion', 'assertion,browser-close', 'assertion,server-close', 'assertion,browser-close,server-close'].map(failure => [failure, full]),
        ...(controller.length ? [['controller,server-close', ['create', 'listen', 'controller', 'server-close']]] : []),
      ];
      for (const [failure, calls] of cases) {
        const child = spawnSync(process.execPath, [join(root, 'probe.cjs')], {
          cwd: root, encoding: 'utf8', timeout: 15000,
          env: { ...process.env, PLAYWRIGHT_MODULE: '', FAIL_AT: failure, SUITE: suite },
        });
        assert.ifError(child.error);
        assert.equal(child.status, 1, `${suite}/${failure}: ${child.stderr}`);
        assert.deepEqual(JSON.parse(child.stdout), { error: 'injected ' + failure.split(',')[0], calls }, `${suite}/${failure}`);
      }
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
