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
      const standard = page.getByRole('radiogroup', { name: 'View format', exact: true });
      const compact = page.getByRole('radiogroup', { name: 'Compact view format', exact: true });
      await standard.getByRole('radio', { name: 'Preview', exact: true }).press('End');
      await compact.getByRole('radio', { name: 'Code', exact: true }).press('Home');
      assert.equal(await standard.getByRole('radio', { name: 'Details & notes' }).getAttribute('aria-checked'), 'true');
      assert.equal(await compact.getByRole('radio', { name: 'Preview', exact: true }).getAttribute('aria-checked'), 'true');
      await standard.evaluate(node => { window.retainedSegment = node; });
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
        assert.equal(await standard.evaluate(node => node === window.retainedSegment), true, 'segmented example retains its DOM on reconnect');
        assert.equal(await standard.getByRole('radio', { name: 'Details & notes' }).getAttribute('aria-checked'), 'true');
        assert.equal(await compact.getByRole('radio', { name: 'Preview', exact: true }).getAttribute('aria-checked'), 'true', 'sizes retain independent selections');
        await page.waitForFunction(() => [...document.querySelectorAll('.demo-segmented-examples [role="radiogroup"]')].every(group => {
          const selected = group.querySelector('[aria-checked="true"]').getBoundingClientRect();
          const indicator = group.querySelector('[data-part="indicator"]').getBoundingClientRect();
          return Math.abs(selected.left - indicator.left) <= 1 && Math.abs(selected.width - indicator.width) <= 1;
        }));
      }
      await page.getByRole('button', { name: 'Toggle mount', exact: true }).evaluate(node => node.click());
      assert.equal(await speed.count(), 0);
      assert.equal(await outside.evaluate(node => node === document.activeElement), true);
      await page.goto(`${base}/tests/fixtures/react-visual-parity/demo.html?strict=${strict}&lang=en#controls`);
      await page.getByRole('heading', { name: 'Controls', exact: true }).waitFor();
      assert.equal(await page.locator('nav a').count(), 13);
      assert.equal(await page.locator('nav a[aria-current]').getAttribute('href'), '#controls', 'Controls URL selects its navigation entry');
      const merged = page.getByRole('radiogroup', { name: 'View format', exact: true });
      await merged.getByRole('radio', { name: 'Code', exact: true }).click();
      await chooseChapter(page, 'type');
      await page.goBack();
      await page.getByRole('heading', { name: 'Controls', exact: true }).waitFor();
      assert.equal(await merged.getByRole('radio', { name: 'Code', exact: true }).getAttribute('aria-checked'), 'true', 'history to Controls retains selection');
      await page.goForward();
      await page.getByRole('heading', { name: 'Typography', exact: true }).waitFor();
      await page.evaluate(() => { location.hash = 'controls'; });
      await page.getByRole('heading', { name: 'Controls', exact: true }).waitFor();
      assert.equal(await merged.getByRole('radio', { name: 'Code', exact: true }).getAttribute('aria-checked'), 'true', 'hashchange to Controls retains selection');
      for (const locale of ['en', 'zh-Hans']) {
        await setLanguage(page, locale);
        const notes = page.getByRole('button', { name: locale === 'en' ? 'Implementation notes' : '实现说明', exact: true });
        const hint = page.locator('.demo-notes-control [role="tooltip"]');
        const params = page.locator('.demo-control-params').first();
        await page.locator('.cui-switch').first().evaluate(node => { window.retainedSwitch = node; });
        assert.equal(await notes.locator('[data-glyph="Code"]').count(), 1, 'uses the bundled icon library');
        assert.equal(await notes.locator('svg').count(), 0, 'no custom SVG');
        await page.evaluate(() => document.fonts.ready);
        assert.match(await notes.locator('[data-glyph="Code"]').evaluate(node => getComputedStyle(node).fontFamily), /cui-icons/);
        assert.equal(await notes.getAttribute('aria-pressed'), 'false');
        assert.equal(await params.isVisible(), false);
        await notes.hover();
        await page.waitForFunction(() => document.querySelector('.demo-notes-control [role="tooltip"]').getAttribute('data-open') === 'true');
        assert.equal(await hint.innerText(), locale === 'en' ? 'Show implementation notes' : '显示实现说明');
        await page.mouse.move(0, 0);
        await notes.focus();
        await page.waitForFunction(() => document.querySelector('.demo-notes-control [role="tooltip"]').getAttribute('data-open') === 'true');
        await notes.press('Escape');
        assert.equal(await hint.getAttribute('aria-hidden'), 'true');
        assert.equal(await notes.evaluate(node => node === document.activeElement), true);
        await notes.press('Enter');
        assert.equal(await notes.getAttribute('aria-pressed'), 'true');
        assert.equal(await params.isVisible(), true);
        await page.locator('.demo-theme-toggle').focus();
        await notes.focus();
        await page.waitForFunction(() => document.querySelector('.demo-notes-control [role="tooltip"]').getAttribute('data-open') === 'true');
        assert.equal(await hint.innerText(), locale === 'en' ? 'Hide implementation notes' : '隐藏实现说明');
        await notes.press('Space');
        assert.equal(await notes.getAttribute('aria-pressed'), 'false');
        assert.equal(await params.isVisible(), false);
        assert.equal(await page.locator('.cui-switch').first().evaluate(node => node === window.retainedSwitch), true, 'notes toggle retains the demonstration DOM');
        assert.equal(await page.getByRole('radiogroup', { name: locale === 'en' ? 'View format' : '视图格式', exact: true }).getByRole('radio', { name: locale === 'en' ? 'Code' : '代码', exact: true }).getAttribute('aria-checked'), 'true', 'language and notes preserve segmented selection');
      }
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
          const notesBox = await page.locator('.demo-notes-toggle').boundingBox();
          assert.equal(notesBox.width, 32, 'notes icon matches the shell buttons');
          assert.equal(notesBox.height, 32);
          assert.ok(notesBox.x >= 0 && notesBox.x + notesBox.width <= width, `${width}/${locale}/${theme}: notes button fits`);
          const notes = page.locator('.demo-notes-toggle'), hint = page.locator('.demo-notes-control [role="tooltip"]');
          await themeButton.focus();
          await notes.focus();
          await page.waitForFunction(() => document.querySelector('.demo-notes-control [role="tooltip"]').getAttribute('data-open') === 'true');
          await hint.evaluate(async node => { await Promise.all(node.getAnimations().map(animation => animation.finished)); });
          const tipBox = await hint.boundingBox(), triggerBox = await notes.boundingBox();
          assert.ok(Math.abs(tipBox.y - triggerBox.y - triggerBox.height - 8) < 1, 'header hint sits 8px below its trigger');
          assert.ok(Math.abs(tipBox.x + tipBox.width - triggerBox.x - triggerBox.width) < 1, 'header hint aligns to the button’s right edge');
          assert.ok(tipBox.x >= 0 && tipBox.x + tipBox.width <= width, `${width}/${locale}/${theme}: hint stays in the viewport`);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'open hint does not widen the page');
          const appearance = await hint.evaluate(node => {
            const style = getComputedStyle(node), card = getComputedStyle(document.querySelector('.demo-control-card'));
            return { background: style.backgroundColor, surface: card.backgroundColor, fontSize: style.fontSize, fontWeight: style.fontWeight };
          });
          assert.equal(appearance.background, appearance.surface, 'hint uses the current theme surface');
          assert.equal(appearance.fontSize, '12px');
          assert.equal(appearance.fontWeight, '400');
          await notes.press('Escape');
          assert.equal(await hint.getAttribute('aria-hidden'), 'true');
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
      const notes = touch.getByRole('button', { name: '实现说明', exact: true });
      await notes.tap();
      assert.equal(await notes.getAttribute('aria-pressed'), 'true');
      await notes.tap();
      assert.equal(await notes.getAttribute('aria-pressed'), 'false');
    } finally { await touch.close(); }
    assert.deepEqual(errors, []);
    console.log('Demo settings: original icon buttons, 0.2× default, keyboard/touch, locales/themes, narrow layouts, StrictMode and retained Activity state passed.');
  } finally { await page.close(); }
});
