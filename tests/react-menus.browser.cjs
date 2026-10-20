const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false } }); await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/tests/fixtures/react-menus/`);
    const first = page.getByRole('region', { name: 'First menu' }), second = page.getByRole('region', { name: 'Second menu' });
    const search = page.getByRole('region', { name: 'Search', exact: true }), input = search.getByRole('searchbox');
    const artifact = page.getByRole('region', { name: 'Artifact', exact: true }), trigger = artifact.getByRole('button', { name: 'Artifact actions' });
    const focused = locator => locator.evaluate(element => element === document.activeElement);
    const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await focused(input), true); assert.equal(await input.evaluate(element => element.matches(':focus-visible')), false, 'programmatic autofocus keeps a neutral ring');
    assert.equal(await first.locator('[data-changes]').textContent(), '0', 'mount emits no selection changes');
    await first.getByRole('button', { name: 'Model settings' }).press('ArrowDown');
    const owner = first.getByRole('menuitem', { name: /Thinking effort/ }); assert.equal(await focused(owner), true);
    await owner.press('ArrowRight'); assert.equal(await focused(first.getByRole('menuitemradio', { name: 'High', exact: true })), true);
    // Reopening an already expanded submenu must enter its committed item,
    // including when the owner is focused before a second Right activation.
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Max', exact: true })), true);
    await owner.click();
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'High', exact: true })), true, 'repeated pointer expansion enters the selected option');
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Max', exact: true })), true, 'keyboard preview works after repeated pointer expansion');
    await owner.focus(); await owner.press('ArrowRight');
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'High', exact: true })), true, 'repeated Right expansion enters the selected option');
    assert.equal(await first.locator('[data-changes]').textContent(), '0', 'repeated expansion and preview never commit a value');
    assert.equal(await first.getByRole('menuitemradio', { name: 'High', exact: true }).getAttribute('aria-checked'), 'true');
    await page.keyboard.press('ArrowUp'); assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Low', exact: true })), true, 'disabled Medium is skipped');
    assert.equal(await first.getByRole('menuitemradio', { name: 'High', exact: true }).getAttribute('aria-checked'), 'true');
    assert.equal(await first.locator('output').first().textContent(), 'low / high', 'focus previews without committing');
    await page.keyboard.press('ArrowUp'); assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Max', exact: true })), true);
    await page.keyboard.press('Escape'); assert.equal(await first.getByRole('menuitemradio').count(), 0); assert.equal(await focused(owner), true);
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Home'); await page.keyboard.press('Enter');
    assert.equal(await first.getByRole('menu').count(), 0); assert.equal(await first.locator('[data-changes]').textContent(), '1'); assert.equal(await focused(first.getByRole('button', { name: 'Model settings' })), true);
    await first.getByRole('button', { name: 'Model settings' }).click(); await owner.press('ArrowRight'); assert.equal(await first.getByRole('menuitemradio', { name: 'Low', exact: true }).getAttribute('aria-checked'), 'true');
    await page.keyboard.press('End'); await page.keyboard.press('Space'); assert.equal(await first.locator('[data-changes]').textContent(), '2');
    await second.getByRole('button', { name: 'Other settings' }).click(); await second.getByRole('menuitem').press('ArrowRight');
    assert.equal(await second.getByRole('menuitemradio', { name: 'Max', exact: true }).getAttribute('aria-checked'), 'true');
    assert.equal(await second.getByRole('menu').first().evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(32, 32, 31)');
    await page.getByRole('button', { name: 'Outside', exact: true }).focus(); assert.equal(await second.getByRole('menu').count(), 0, 'focus leaving closes without stealing focus');
    await first.getByRole('button', { name: 'External selection' }).click(); await first.getByRole('button', { name: 'Model settings' }).click(); await owner.press('ArrowRight');
    assert.equal(await first.getByRole('menuitemradio', { name: 'Low', exact: true }).getAttribute('aria-checked'), 'true');
    await page.keyboard.press('ArrowLeft'); assert.equal(await focused(owner), true); await page.keyboard.press('Escape'); assert.equal(await first.getByRole('menu').count(), 0);
    await first.getByRole('button', { name: 'Remove selection', exact: true }).click();
    await first.getByRole('button', { name: 'Model settings' }).click(); await owner.click();
    await page.keyboard.press('End'); await owner.click();
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Low', exact: true })), true, 'repeated expansion without a committed option enters the first enabled item');
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'High', exact: true })), true, 'fallback entry retains disabled-item keyboard skipping');
    assert.equal(await first.getByRole('menuitemradio', { checked: true }).count(), 0, 'fallback focus does not create a committed selection');
    assert.equal(await first.locator('[data-changes]').textContent(), '2');
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');

    assert.equal(await search.getByRole('heading', { level: 4 }).count(), 2);
    await input.fill(' '); assert.equal(await search.getByRole('heading', { level: 4 }).count(), 0); assert.equal(await search.getByRole('button').count(), 3, 'whitespace flattens groups without filtering');
    await input.fill(' APPEAR '); assert.equal(await search.getByRole('button').count(), 1);
    await input.fill('no such setting'); assert.equal(await search.getByRole('status').textContent(), 'No matching settings');
    await input.fill('notifications'); await search.getByRole('button', { name: 'Notifications' }).click();
    const destination = search.getByRole('heading', { name: 'Notifications', exact: true });
    assert.equal(await focused(destination), true); assert.equal(await input.inputValue(), '');
    await page.waitForFunction(() => document.querySelector('[data-row="notifications"] h3').classList.contains('cui-feature-anchor-highlight'));
    const position = await destination.evaluate(element => { const rect = element.getBoundingClientRect(), scroll = document.querySelector('[data-scroll]'), bounds = scroll.getBoundingClientRect(); return Math.abs((rect.top + rect.bottom) / 2 - (bounds.top + bounds.bottom) / 2); });
    assert.ok(position < 2, `target centered within local scroller: ${position}`);
    await search.getByRole('button', { name: 'Appearance' }).click();
    assert.equal(await destination.getAttribute('class'), '', 'new selection clears previous highlight');
    await page.waitForFunction(() => document.querySelector('[data-row="appearance"] h3').classList.contains('cui-feature-anchor-highlight'));
    await page.waitForFunction(() => !document.querySelector('[data-row="appearance"] h3').classList.contains('cui-feature-anchor-highlight'));
    await search.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('button', { name: 'Active', exact: true }).click(); await page.waitForTimeout(300); assert.equal(await search.locator('.cui-feature-anchor-highlight').count(), 0, 'inactive cancels pending settling');
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await search.getByRole('button', { name: 'Language' }).click();
    await page.waitForFunction(() => document.querySelector('[data-row="language"] h3').classList.contains('cui-feature-anchor-highlight'));
    await search.getByRole('button', { name: 'Language' }).click();
    assert.equal(await search.locator('.cui-feature-anchor-highlight').count(), 0, 'reselecting the same target restarts settling');
    await page.waitForFunction(() => document.querySelector('[data-row="language"] h3').classList.contains('cui-feature-anchor-highlight'));

    await trigger.press('Alt+Enter'); const card = artifact.getByRole('menu'); await card.waitFor();
    await page.waitForFunction(() => document.activeElement?.textContent === 'Open1');
    await page.keyboard.press('ArrowDown'); assert.equal(await focused(card.getByRole('menuitem', { name: 'Pin' })), true);
    await page.keyboard.press('ArrowDown'); assert.equal(await focused(card.getByRole('menuitem', { name: 'Open' })), true);
    await page.keyboard.press('2'); assert.equal(await card.count(), 1, 'disabled numeric action is ignored'); assert.equal(await artifact.locator('[data-action]').textContent(), '');
    await page.keyboard.press('3'); assert.equal(await card.count(), 0); assert.equal(await artifact.locator('[data-action]').textContent(), 'pin'); assert.equal(await focused(trigger), true);
    await trigger.click(); await frames(); await page.getByRole('button', { name: 'Outside', exact: true }).focus(); assert.equal(await card.count(), 0); assert.equal(await focused(page.getByRole('button', { name: 'Outside', exact: true })), true);
    // Close before deferred menu focus; preserve the current animated rect as the return origin.
    await trigger.focus();
    const rapid = await trigger.evaluate(async element => {
      element.click(); await new Promise(resolve => requestAnimationFrame(resolve));
      const card = document.querySelector('.cui-palette-card');
      for (const animation of card.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = 65; }
      const rect = card.getBoundingClientRect();
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      const thumb = document.querySelector('.cui-palette-thumb');
      for (const animation of thumb.getAnimations()) { animation.pause(); animation.currentTime = 0; }
      const returned = thumb.getBoundingClientRect();
      return { from: rect.x, to: returned.x, returning: thumb.dataset.returning, focused: document.activeElement === element };
    });
    assert.equal(rapid.returning, 'true'); assert.ok(Math.abs(rapid.from - rapid.to) < 1); assert.equal(rapid.focused, true);
    await frames(); assert.equal(await focused(trigger), true, 'cancelled two-frame autofocus never fires after close');
    await trigger.click(); await frames(); assert.equal(await artifact.locator('[data-returning]').count(), 0, 'reopening clears return motion');
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); assert.equal(await card.count(), 0); assert.equal(await artifact.locator('[data-returning]').count(), 0);
    await artifact.getByRole('button', { name: 'Image failure' }).click(); await trigger.click(); await frames(); await page.keyboard.press('Escape'); assert.equal(await artifact.locator('[data-returning]').count(), 0, 'failed artwork skips return motion');
    await trigger.click(); await page.getByRole('button', { name: 'Mount', exact: true }).click(); await frames(); assert.equal(await card.count(), 0);
    await page.getByRole('button', { name: 'Mount', exact: true }).click(); assert.equal(await first.locator('[data-changes]').textContent(), '0');

    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) for (const locale of ['en', 'zh-Hans']) {
      await page.setViewportSize({ width, height: 1000 }); await page.goto(`${base}/demo/?lang=${locale}#menus`); await page.reload();
      await setTheme(page, theme); await page.evaluate(() => document.fonts.ready);
      const section = page.locator('main section:not([hidden])'); const labels = locale === 'en' ? ['Model settings', 'Thinking effort', 'Artifact actions'] : ['模型设置', '思考深度', '作品操作菜单'];
      await section.getByRole('button', { name: labels[0], exact: false }).click(); await section.getByRole('menuitem').press('ArrowRight');
      assert.equal(await section.getByRole('menuitemradio').count(), 4);
      await page.keyboard.press('ArrowUp');
      assert.equal(await focused(section.getByRole('menuitemradio', { name: 'Medium', exact: true })), true);
      const preview = locale === 'en' ? 'Focus preview: Medium · Selected: High' : '聚焦预览：Medium · 已选：High';
      assert.equal(await section.getByText(preview, { exact: true }).count(), 1, 'preview includes both focused and committed values');
      assert.equal(await section.getByRole('menuitemradio', { name: 'High', exact: true }).getAttribute('aria-checked'), 'true');
      await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
      await section.getByRole('button', { name: labels[2], exact: true }).click(); await frames();
      assert.equal(await section.getByRole('menu').count(), 1);
      const overflow = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, viewport: innerWidth,
        offenders: [...document.querySelectorAll('body *')].filter(element => element.getClientRects().length).map(element => ({ element: element.tagName, classes: element.className, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })).filter(rect => rect.left < -.5 || rect.right > innerWidth + .5).slice(-15),
      }));
      assert.equal(overflow.width <= overflow.viewport, true, `${width}/${theme}/${locale} has no overflow: ${JSON.stringify(overflow)}`);
      const rect = await section.locator('.cui-palette-card').boundingBox(); assert.ok(rect.x >= 0 && rect.x + rect.width <= width + 1);
      await page.keyboard.press('Escape');
    }
    // Localization and theme updates retain the destination nodes and pending highlight.
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`${base}/demo/?lang=en#menus`); await page.reload();
    await page.getByRole('button', { name: 'Appearance', exact: true }).click();
    await setLanguage(page, 'zh-Hans');
    await setTheme(page, 'dark');
    await page.locator('.cui-feature-anchor-highlight').waitFor();
    assert.equal(await page.locator('.cui-feature-anchor-highlight').textContent(), '外观');
    assert.deepEqual(errors, []); console.log('React menus: independent consumers, keyboard preview/commit, search/filter/focus/settling, interruptible palette return, lifecycle and bilingual responsive layouts passed');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
