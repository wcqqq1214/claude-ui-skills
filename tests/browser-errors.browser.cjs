const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const { captureNativeBrowserErrors } = require('./browser-errors.cjs');
const { runSuite } = require('./run-browser.cjs');

async function probe(kind) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
  try {
    const page = await browser.newPage(), errors = [];
    await captureNativeBrowserErrors(page, errors);
    // Inline startup scripts run before goto resolves. No Vite or application
    // logging participates in this check, including after a second navigation.
    const scripts = {
      clean: '',
      resize: `let changed = false; const target = document.querySelector('div');
        new ResizeObserver(() => { if (!changed) { changed = true; target.style.width = '110px'; } }).observe(target);`,
      error: `throw new Error('startup failure');`,
      rejection: `Promise.reject('startup rejection');`,
    };
    for (let visit = 0; visit < 2; visit++) {
      errors.length = 0;
      await page.goto('data:text/html,' + encodeURIComponent(`<div style="width:100px;height:20px"></div><script>
        window.probeEvent = null;
        for (const type of ['error', 'unhandledrejection']) window.addEventListener(type, event => {
          window.probeEvent = { type, prevented: event.defaultPrevented, hasError: !!event.error };
        });
        ${scripts[kind]}
      </script>`));
      if (kind === 'clean') await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      else {
        await page.waitForFunction(() => window.probeEvent !== null);
        const event = await page.evaluate(() => window.probeEvent);
        assert.equal(event.prevented, false, 'capture must not suppress browser errors');
        if (kind === 'resize') assert.equal(event.hasError, false, 'exercise the native event Playwright can miss');
        assert.ok(errors.length, 'startup error must reach the test process');
      }
      if (visit === 1) assert.deepEqual(errors, [], 'unhandled browser errors fail the suite');
    }
  } finally { await browser.close(); }
}

async function main() {
  for (const [kind, diagnostic] of [
    ['clean', null], ['resize', 'ResizeObserver loop'], ['error', 'startup failure'], ['rejection', 'startup rejection'],
  ]) {
    const lines = [];
    const result = await runSuite(__filename, {
      env: { ...process.env, CUI_NATIVE_ERROR_PROBE: kind }, timeoutMs: 30_000, log: line => lines.push(line),
    });
    assert.equal(result.code, diagnostic ? 1 : 0, lines.join('\n'));
    assert.equal(result.passed, !diagnostic, lines.join('\n'));
    if (diagnostic) {
      assert.ok(lines.some(line => line.includes('unhandled browser errors fail the suite')), lines.join('\n'));
      assert.ok(lines.some(line => line.includes(diagnostic)), lines.join('\n'));
    }
  }
  console.log('Native ResizeObserver errors, startup exceptions and promise rejections fail static browser suites; clean pages pass.');
}

(process.env.CUI_NATIVE_ERROR_PROBE ? probe(process.env.CUI_NATIVE_ERROR_PROBE) : main())
  .catch(error => { console.error(error); process.exitCode = 1; });
