const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const { testStreamParagraphGeometry, testWorkspaceReadoutTheme, testPinnedTextWeight } = require('./visual-parity-checks.cjs');

(async () => {
  const checks = { stream: testStreamParagraphGeometry, readout: testWorkspaceReadoutTheme, pinned: testPinnedTextWeight };
  const requested = process.argv.slice(2), selected = requested.length ? requested : Object.keys(checks);
  for (const name of selected) assert.ok(checks[name], `Unknown visual parity check: ${name}`);
  const { createServer } = await import('vite');
  const server = await createServer({ root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false } }); await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const name of selected) {
      await checks[name](page, base);
      assert.deepEqual(errors, [], `${name}: no browser errors`);
      console.log(`React visual parity: ${name} passed in StrictMode off/on.`);
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
