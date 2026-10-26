const assert = require('node:assert/strict');
const { withDevBrowser } = require('./dev-browser.cjs');
const { setChoice, setLanguage, chooseChapter } = require('./demo-helpers.cjs');

withDevBrowser(async ({ browser, base }) => {
  const errors = [];
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const chapters = ['type', 'controls', 'composer', 'feedback', 'workspace', 'images', 'micro', 'reading', 'gallery', 'menus', 'modes', 'tasks', 'recovery', 'segmented'];
  try {
    for (const strict of ['off', 'on']) {
      await page.goto(`${base}/tests/fixtures/react-visual-parity/demo.html?lang=en&strict=${strict}#controls`);
      const speed = page.getByRole('combobox', { name: 'Playback speed', exact: true });
      assert.equal(await speed.getAttribute('data-value'), '1', 'first visit shows the original animation speed');
      const grid = page.locator('.demo-controls-grid');
      assert.equal(await grid.evaluate(node => getComputedStyle(node).getPropertyValue('--cui-motion-scale')), '1');
      await setChoice(page, speed, '0.2');
      assert.equal(await grid.evaluate(node => getComputedStyle(node).getPropertyValue('--cui-motion-scale')), '5');
      await setChoice(page, speed, '1');
      const toggle = page.locator('.demo-notes-toggle');
      const control = page.getByRole('switch', { name: 'Switch', exact: true });
      await control.click();
      await control.evaluate(node => { window.retainedDemoSwitch = node; });
      assert.equal((await page.title()).includes('·'), false);
      assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
      assert.equal(await page.locator('.demo-control-params').first().isVisible(), false);
      await toggle.click();
      assert.equal(await page.locator('.demo-control-params').first().isVisible(), true);
      await toggle.click();
      assert.equal(await control.getAttribute('aria-checked'), 'false');
      assert.equal(await control.evaluate(node => node === window.retainedDemoSwitch), true, 'showing notes retains component DOM/state');
      const theme = page.locator('.demo-theme-select');
      for (const width of [1280, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const locale of ['en', 'zh-Hans']) {
          await setLanguage(page, locale);
          for (const mode of ['light', 'dark']) {
            await setChoice(page, theme, mode);
            await page.waitForFunction(mode => document.documentElement.dataset.cuiTheme === mode, mode);
            assert.equal(await page.evaluate(() => localStorage.getItem('cui-demo-theme')), mode);
            for (const chapter of chapters) {
              const context = `${strict}/${width}/${locale}/${mode}/${chapter}`;
              await chooseChapter(page, chapter);
              const section = page.locator('.demo-specimen:not([hidden])');
              assert.equal(await section.count(), 1, context);
              assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${context}: no page overflow`);
              assert.equal(await page.locator('.demo-notes-toggle').isVisible(), true, `${context}: notes remain accessible`);
              if (width === 320) {
                const picker = await page.locator('.demo-chapter-toggle').boundingBox();
                const topbar = await page.locator('.demo-topbar').boundingBox();
                assert.ok(picker.width >= 130, `${context}: chapter name has readable space`);
                assert.ok(picker.x + picker.width <= topbar.x, `${context}: header controls do not overlap`);
              }
              await toggle.click();
              assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
              assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${context}: notes do not overflow`);
              const text = await page.locator('body').innerText();
              assert.equal(text.includes('·'), false, `${context}: no middle-dot separators, including notes`);
              const smallShellText = await page.locator('.demo-section-head, .demo-sidebar, .demo-topbar, .demo-card-foot, .demo-control-caption, .demo-implementation').evaluateAll(roots => roots.flatMap(root => [root, ...root.querySelectorAll('*')]).filter(node => node.getClientRects().length && [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()) && parseFloat(getComputedStyle(node).fontSize) < 12).map(node => node.textContent));
              assert.deepEqual(smallShellText, [], `${context}: demo explanations are at least 12px`);
              await toggle.click();
              if (chapter === 'menus') {
                assert.equal(await section.getByText(locale === 'en' ? 'Selected: High' : '已选：高', { exact: true }).isVisible(), true, context);
              }
            }
          }
        }
      }
      await setChoice(page, theme, 'system');
      for (const mode of ['dark', 'light']) {
        await page.emulateMedia({ colorScheme: mode });
        await page.waitForFunction(mode => document.documentElement.dataset.cuiTheme === mode, mode);
      }
      await page.reload();
      assert.equal(await theme.getAttribute('data-value'), 'system', 'explicit system preference persists');
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
    }
    assert.deepEqual(errors, []);
    console.log('Demo presentation: both locales/themes, 320px/desktop, StrictMode off/on, optional notes, source-speed default, retained state and theme persistence passed.');
  } finally { await page.close(); }
});
