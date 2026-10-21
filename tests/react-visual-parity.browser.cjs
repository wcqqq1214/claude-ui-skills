const assert = require('node:assert/strict');
const { withDevBrowser } = require('./dev-browser.cjs');
const { testStreamParagraphGeometry, testWorkspaceReadoutTheme, testPinnedTextWeight } = require('./visual-parity-checks.cjs');

const checks = { stream: testStreamParagraphGeometry, readout: testWorkspaceReadoutTheme, pinned: testPinnedTextWeight };
const requested = process.argv.slice(2), selected = requested.length ? requested : Object.keys(checks);
for (const name of selected) assert.ok(checks[name], `Unknown visual parity check: ${name}`);
withDevBrowser(async ({ browser, base }) => {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const name of selected) {
      await checks[name](page, base);
      assert.deepEqual(errors, [], `${name}: no browser errors`);
      console.log(`React visual parity: ${name} passed in StrictMode off/on.`);
    }
}).catch(error => { console.error(error); process.exitCode = 1; });
