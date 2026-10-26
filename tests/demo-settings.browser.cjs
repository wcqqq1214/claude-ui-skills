const assert = require('node:assert/strict');
const { withDevBrowser } = require('./dev-browser.cjs');
const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
withDevBrowser(async ({ browser, base }) => {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    for (const strict of ['off', 'on']) {
      await page.goto(`${base}/tests/fixtures/demo-settings/?strict=${strict}`);
      const speed = page.locator('.demo-slow'), outside = page.getByRole('textbox', { name: 'Outside focus' });
      const duration = () => page.locator('.cui-switch > span').evaluate(node => getComputedStyle(node).transitionDuration);
      assert.equal(await speed.getAttribute('aria-pressed'), 'true');
      assert.equal(await duration(), '0.6s', 'default 0.2× slows the original 120ms transition fivefold');
      await speed.press('Enter');
      assert.equal(await speed.getAttribute('aria-pressed'), 'false');
      assert.equal(await duration(), '0.12s', 'normal playback restores the original transition');
      await speed.press('Space');
      assert.equal(await speed.getAttribute('aria-pressed'), 'true');
      await speed.click();
      for (const control of ['Toggle visibility', 'Toggle active']) {
        await speed.evaluate(node => { window.retainedSpeed = node; });
        await page.getByRole('button', { name: control, exact: true }).evaluate(node => node.click());
        if (control === 'Toggle active') {
          assert.equal(await speed.isDisabled(), true);
          await speed.evaluate(node => node.click());
        }
        await outside.focus();
        await page.getByRole('button', { name: control, exact: true }).evaluate(node => node.click());
        await speed.waitFor({ state: 'visible' });
        assert.equal(await speed.evaluate(node => node === window.retainedSpeed), true);
        assert.equal(await speed.getAttribute('aria-pressed'), 'false', 'retained chapter keeps normal speed');
        assert.equal(await outside.evaluate(node => node === document.activeElement), true);
      }
      await page.getByRole('button', { name: 'Toggle mount', exact: true }).evaluate(node => node.click());
      assert.equal(await speed.count(), 0);
      assert.equal(await outside.evaluate(node => node === document.activeElement), true);
      await page.goto(`${base}/tests/fixtures/react-visual-parity/demo.html?strict=${strict}&lang=en#controls`);
      for (const width of [320, 390, 1280]) for (const locale of ['en', 'zh-Hans']) {
        await page.setViewportSize({ width, height: 900 }); await setLanguage(page, locale);
        for (const theme of ['light', 'dark', 'system']) {
          await setTheme(page, theme);
          const themeButton = page.locator('.demo-theme-toggle');
          const box = await themeButton.boundingBox();
          assert.equal(box.width, 32, 'original theme button stays compact');
          assert.equal(box.height, 32);
          assert.equal(await themeButton.locator('svg').count(), 1);
          assert.equal(await themeButton.getAttribute('aria-haspopup'), null, 'theme cycles without a dropdown');
          const slow = page.locator('.demo-slow'), rect = await slow.boundingBox();
          assert.ok(rect.x >= 0 && rect.x + rect.width <= width, `${width}/${locale}/${theme}: speed button fits`);
          assert.equal(await slow.getAttribute('aria-pressed'), 'true');
          assert.ok((await slow.innerText()).includes('0.2×'));
        }
      }
      await setTheme(page, 'system');
      const themeButton = page.locator('.demo-theme-toggle');
      for (const [key, expected] of [['Enter', 'light'], ['Space', 'dark'], ['Enter', 'system']]) {
        await themeButton.press(key);
        assert.equal(await themeButton.getAttribute('data-preference'), expected, 'keyboard follows original theme cycle');
        assert.equal(await themeButton.evaluate(node => node === document.activeElement), true);
      }
      await page.locator('.demo-slow').click();
      await chooseChapter(page, 'type'); await chooseChapter(page, 'controls');
      assert.equal(await page.locator('.demo-slow').getAttribute('aria-pressed'), 'false', 'chapter return retains chosen playback');
    }
    const touch = await browser.newPage({ viewport: { width: 320, height: 740 }, hasTouch: true, isMobile: true });
    try {
      await touch.goto(`${base}/?lang=zh-Hans#controls`);
      const theme = touch.locator('.demo-theme-toggle');
      assert.equal(await theme.getAttribute('data-preference'), 'system');
      await theme.tap();
      assert.equal(await theme.getAttribute('data-preference'), 'light');
      await theme.tap();
      assert.equal(await theme.getAttribute('data-preference'), 'dark');
      const slow = touch.locator('.demo-slow');
      assert.equal(await slow.getAttribute('aria-pressed'), 'true');
      await slow.tap();
      assert.equal(await slow.getAttribute('aria-pressed'), 'false');
      await slow.tap();
      assert.equal(await slow.getAttribute('aria-pressed'), 'true');
    } finally { await touch.close(); }
    assert.deepEqual(errors, []);
    console.log('Demo settings: original icon buttons, 0.2× default, keyboard/touch, locales/themes, narrow layouts, StrictMode and retained Activity state passed.');
  } finally { await page.close(); }
});
