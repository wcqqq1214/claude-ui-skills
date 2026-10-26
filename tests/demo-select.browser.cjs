const assert = require('node:assert/strict');
const { withDevBrowser } = require('./dev-browser.cjs');
const { setChoice, setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
withDevBrowser(async ({ browser, base }) => {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    for (const strict of ['off', 'on']) {
      await page.goto(`${base}/tests/fixtures/demo-select/?strict=${strict}`);
      const trigger = page.getByRole('combobox', { name: 'Theme' });
      const list = page.getByRole('listbox');
      const outside = page.getByRole('textbox', { name: 'Outside focus' });
      await trigger.press('ArrowDown');
      assert.equal(await list.isVisible(), true);
      assert.equal(await trigger.evaluate(node => node === document.activeElement), true);
      await trigger.press('End'); await trigger.press('Escape');
      assert.equal(await trigger.getAttribute('data-value'), 'light', 'Escape cancels navigation');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      await trigger.press('ArrowUp'); await trigger.press('End'); await trigger.press('Enter');
      assert.equal(await trigger.getAttribute('data-value'), 'system');
      await trigger.press('Home'); await trigger.press('ArrowDown'); await trigger.press(' ');
      assert.equal(await trigger.getAttribute('data-value'), 'dark');
      assert.equal(await page.locator('[data-changes]').textContent(), '2');
      await trigger.press('l'); await trigger.press('Enter');
      assert.equal(await trigger.getAttribute('data-value'), 'light', 'typeahead finds the option');
      await trigger.click(); await trigger.press('Tab');
      assert.equal(await outside.evaluate(node => node === document.activeElement), true, 'Tab leaves the picker naturally');
      await trigger.click(); await outside.click();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false', 'outside click dismisses without stealing focus');
      await setChoice(page, trigger, 'dark');
      assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'pointer selection retains trigger focus');
      const beforeRepeat = await page.locator('[data-changes]').textContent();
      await setChoice(page, trigger, 'dark');
      assert.equal(await page.locator('[data-changes]').textContent(), beforeRepeat, 'reselecting does not emit a change');
      await trigger.click(); await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      await list.waitFor({ state: 'hidden' });
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      for (const control of ['Toggle visibility', 'Toggle active']) {
        await trigger.click();
        await trigger.evaluate(node => { window.retainedPicker = node; });
        // DOM click preserves the open state until the actual lifecycle cleanup.
        await page.getByRole('button', { name: control, exact: true }).evaluate(node => node.click());
        await outside.focus();
        await page.getByRole('button', { name: control, exact: true }).evaluate(node => node.click());
        await trigger.waitFor({ state: 'visible' });
        assert.equal(await trigger.evaluate(node => node === window.retainedPicker), true);
        assert.equal(await trigger.getAttribute('aria-expanded'), 'false', `${control}: old menu stays dismissed`);
        assert.equal(await outside.evaluate(node => node === document.activeElement), true);
        await setChoice(page, trigger, 'system');
      }
      await trigger.click();
      const calls = await page.locator('[data-changes]').textContent();
      await page.getByRole('button', { name: 'Toggle mount', exact: true }).evaluate(node => node.click());
      assert.equal(await page.locator('[data-changes]').textContent(), calls, 'unmount is silent');
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
          for (const target of [page.locator('.demo-speed-select')]) {
            await target.click();
            const menu = await page.getByRole('listbox').boundingBox();
            const text = await target.evaluate(node => {
              const list = document.getElementById(node.getAttribute('aria-controls'));
              return [node, ...list.querySelectorAll('[role=option]')].map(item => {
                const style = getComputedStyle(item), label = item.querySelector('span');
                return { size: parseFloat(style.fontSize), weight: Number(style.fontWeight), clipped: label.scrollWidth > label.clientWidth };
              });
            });
            assert.ok(text.every(item => item.size >= 14 && item.weight >= 400 && !item.clipped), `${width}/${locale}/${theme}: picker text stays legible and untruncated`);
            assert.ok(menu.x >= 0 && menu.x + menu.width <= width, `${width}/${locale}/${theme}: menu stays in viewport`);
            await target.press('Escape');
          }
        }
      }
      await setTheme(page, 'system');
      const themeButton = page.locator('.demo-theme-toggle');
      for (const [key, expected] of [['Enter', 'light'], ['Space', 'dark'], ['Enter', 'system']]) {
        await themeButton.press(key);
        assert.equal(await themeButton.getAttribute('data-preference'), expected, 'keyboard follows original theme cycle');
        assert.equal(await themeButton.evaluate(node => node === document.activeElement), true);
      }
      const speed = page.locator('.demo-speed-select');
      await setChoice(page, speed, '0.2');
      assert.equal(await page.locator('.cui-switch > span').evaluate(node => getComputedStyle(node).transitionDuration), '0.6s');
      await speed.click(); await chooseChapter(page, 'type'); await chooseChapter(page, 'controls');
      assert.equal(await speed.getAttribute('aria-expanded'), 'false', 'chapter return never reopens old picker');
      assert.equal(await speed.getAttribute('data-value'), '0.2', 'chapter return retains chosen playback');
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
      await touch.locator('.demo-speed-select').tap();
      await touch.getByRole('option', { name: '慢速（0.2×）', exact: true }).tap();
      assert.equal(await touch.locator('.demo-speed-select').getAttribute('data-value'), '0.2');
    } finally { await touch.close(); }
    assert.deepEqual(errors, []);
    console.log('Demo pickers: keyboard, focus, pointer selection, locales/themes, narrow layouts, StrictMode, Activity and silent unmount passed.');
  } finally { await page.close(); }
});
