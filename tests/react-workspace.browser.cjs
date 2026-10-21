const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const { testPinnedActivityReconnect } = require('./pinned-activity-checks.cjs');
const { testWorkspacePreviewIsolation } = require('./workspace-preview-checks.cjs');
async function testResizeFocusReentry(page, base) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = () => page.locator('[data-resize-state]').evaluate(element => JSON.parse(element.textContent));
  const width = () => page.getByRole('separator', { name: 'Resize', exact: true }).getAttribute('aria-valuenow').then(Number);
  for (const strict of ['off', 'on']) for (const handler of ['capture', 'bubble']) for (const action of ['inactive', 'unmount', 'hide', 'hide-show', 'inactive-active', 'expanded']) {
    const context = `${strict}/${handler}/${action}`;
    await page.goto(`${base}/tests/fixtures/react-workspace/resize-reentry.html?strict=${strict}&handler=${handler}&action=${action}`);
    const handle = page.getByRole('separator', { name: 'Resize', exact: true });
    await handle.press('Shift+ArrowRight');
    assert.equal(await width(), 276, `${context}: establish a non-default chosen width`);
    const retained = await handle.elementHandle();
    await page.getByRole('button', { name: 'Arm resize reentry', exact: true }).click();
    let box = await handle.boundingBox(); const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    assert.equal((await state()).reentries, 1, `${context}: focus synchronously changes the owner`);
    await page.mouse.move(x + 72, y); await page.mouse.up();
    assert.deepEqual((await state()).changes, [], `${context}: stale pointer work cannot commit a width`);
    assert.equal(await page.locator('[data-resizing]').count(), 0, `${context}: no drag survives the focus boundary`);
    assert.equal(await retained.evaluate(element => element.hasPointerCapture(1)), false, `${context}: the cancelled pointer is not captured`);
    assert.deepEqual(errors, [], `${context}: synchronous owner changes do not throw`);
    await page.getByRole('button', { name: 'Restore resize owner', exact: true }).click();
    const restored = page.getByRole('separator', { name: 'Resize', exact: true }); await restored.waitFor();
    if (action !== 'unmount') assert.equal(await restored.evaluate((element, previous) => element === previous, retained), true, `${context}: Activity retains the same separator`);
    const chosen = action === 'unmount' ? 244 : 276;
    assert.equal(await width(), chosen, `${context}: cancellation preserves the chosen width`);
    assert.deepEqual((await state()).changes, [], `${context}: restoring the owner does not emit a callback`);
    box = await restored.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 64, box.y + box.height / 2); await page.mouse.up();
    assert.equal(await width(), chosen + 64, `${context}: a fresh pointer gesture works`);
    assert.deepEqual((await state()).changes, [chosen + 64], `${context}: one fresh gesture emits one callback`);
    await restored.press('ArrowRight');
    assert.equal(await width(), chosen + 72, `${context}: keyboard resizing still works`);
    assert.deepEqual((await state()).changes, [chosen + 64, chosen + 72]);
    assert.deepEqual(errors, [], `${context}: recovery does not throw`);
  }
}
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false } }); await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const reentryPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await testResizeFocusReentry(reentryPage, base); await reentryPage.close();
    const activityPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await testPinnedActivityReconnect(activityPage, base); await activityPage.close();
    const previewPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await testWorkspacePreviewIsolation(previewPage, base); await previewPage.close();
    const systemPage = await browser.newPage({ viewport: { width: 1280, height: 1000 }, colorScheme: 'light' });
    await systemPage.goto(`${base}/demo/?lang=en#modes`);
    assert.equal(await systemPage.locator('.demo-topbar button[data-preference]').getAttribute('data-preference'), 'system');
    await systemPage.locator('.cui-pinned-main').first().focus(); await systemPage.keyboard.press('ArrowRight'); await systemPage.keyboard.press('Enter');
    const systemMenu = systemPage.getByRole('menu', { name: 'Move conversation', exact: true }); await systemMenu.waitFor();
    await systemPage.emulateMedia({ colorScheme: 'dark' });
    await systemPage.waitForFunction(() => document.documentElement.dataset.cuiTheme === 'dark');
    await systemPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await systemMenu.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(32, 32, 31)', 'an open pinned menu follows a system theme change without a React parent render');
    await systemPage.emulateMedia({ colorScheme: 'light' });
    await systemPage.waitForFunction(() => document.documentElement.dataset.cuiTheme === 'light');
    await systemPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await systemMenu.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(255, 255, 255)');
    assert.equal(await systemMenu.evaluate(element => element.contains(document.activeElement)), true, 'system theme updates retain menu focus');
    await systemPage.close();
    const statusPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await statusPage.goto(`${base}/demo/?lang=en#modes`);
    const restoredStatus = statusPage.locator('.cui-pinned-stage [role="status"]');
    await statusPage.getByRole('button', { name: 'Restore order', exact: true }).click();
    assert.equal(await restoredStatus.textContent(), 'Order restored');
    await setLanguage(statusPage, 'zh-Hans');
    assert.equal(await restoredStatus.textContent(), '已恢复原来的顺序', 'the restored-order announcement follows the current language');
    await statusPage.locator('.cui-pinned-main').first().focus(); await statusPage.keyboard.press('ArrowRight'); await statusPage.keyboard.press('Enter');
    await statusPage.getByRole('menuitem', { name: '下移', exact: true }).click();
    assert.equal(await restoredStatus.textContent(), '设计笔记已移到第 2 位，共 4 项');
    await setLanguage(statusPage, 'en');
    assert.equal(await restoredStatus.textContent(), 'Design notes moved to position 2 of 4', 'a later move remains the current announcement when the initial message changes language');
    const statusList = statusPage.locator('.cui-pinned-list'), movedOrder = ['reading', 'notes', 'weekend', 'ideas'];
    assert.deepEqual(await statusList.locator(':scope > li').evaluateAll(rows => rows.map(row => row.dataset.pin)), movedOrder);
    const statusRow = statusList.locator('[data-pin="notes"]'); await statusRow.scrollIntoViewIfNeeded();
    const statusBox = await statusRow.boundingBox();
    await statusPage.mouse.move(statusBox.x + 50, statusBox.y + 13); await statusPage.mouse.down();
    await statusPage.mouse.move(statusBox.x + 54, statusBox.y + 13); await statusPage.mouse.move(statusBox.x + 50, statusBox.y + 80);
    assert.equal(await statusPage.locator('.cui-pinned-ghost').count(), 1);
    await statusPage.evaluate(() => { location.hash = '#workspace'; });
    await statusPage.waitForFunction(() => document.querySelector('nav a[aria-current]')?.getAttribute('href') === '#workspace');
    await statusPage.mouse.up(); await chooseChapter(statusPage, 'modes');
    assert.equal(await restoredStatus.textContent(), 'Move cancelled', 'leaving a mounted chapter announces the interrupted drag');
    assert.equal(await statusPage.locator('.cui-pinned-ghost').count(), 0);
    assert.deepEqual(await statusList.locator(':scope > li').evaluateAll(rows => rows.map(row => row.dataset.pin)), movedOrder, 'chapter exit cancels without committing the preview order');
    await setLanguage(statusPage, 'zh-Hans');
    assert.equal(await restoredStatus.textContent(), '已取消移动', 'cancellation replaces the initial restored-order message and remains translatable');
    await statusPage.close();
    const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } }); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/tests/fixtures/react-workspace/`);
    const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const first = page.getByRole('region', { name: 'First workspace' }), second = page.getByRole('region', { name: 'Second workspace' });
    const handle = first.locator('.cui-workspace-resizer'), files = first.getByRole('complementary'), content = first.getByRole('article');
    const width = async () => Number(await handle.getAttribute('aria-valuenow'));
    const focused = locator => locator.evaluate(element => element === document.activeElement);
    const setRange = async (name, value) => { await page.getByRole('slider', { name, exact: true }).evaluate((element, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, String(value)); element.dispatchEvent(new Event('input', { bubbles: true })); }, value); await frames(); };
    assert.equal(await page.locator('[data-changes]').textContent(), '0', 'StrictMode mount has no change callbacks');
    assert.equal(await width(), 244);
    for (const [delta, expected] of [[3, 244], [4, 248]]) {
      await handle.press('Enter'); const box = await handle.boundingBox(), x = box.x + 6, y = box.y + 30;
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + delta, y);
      assert.equal(await width(), 244 + delta); await page.mouse.up(); assert.equal(await width(), expected, '3/4px commit boundary');
    }
    await handle.press('Enter'); await handle.press('ArrowRight'); assert.equal(await width(), 252);
    await handle.press('Shift+ArrowRight'); assert.equal(await width(), 284);
    await handle.press('Home'); assert.equal(await width(), 160); await handle.press('End'); assert.equal(await width(), 520);
    await handle.press('ArrowLeft'); assert.equal(await width(), 512); await handle.press('Space'); assert.equal(await width(), 244);
    await handle.press('Control+ArrowRight'); assert.equal(await width(), 244);
    await handle.press('Shift+ArrowRight'); await handle.dblclick(); assert.equal(await width(), 244);
    let box = await handle.boundingBox(); await page.mouse.move(box.x + 6, box.y + 30); await page.mouse.down(); await page.mouse.move(box.x + 66, box.y + 30);
    await handle.dispatchEvent('pointercancel', { pointerId: 1 }); await page.mouse.up(); assert.equal(await width(), 244);
    await handle.press('End'); await setRange('Workspace width', 700); assert.equal(await width(), 419);
    await handle.press('End'); await setRange('Workspace width', 900); assert.equal(await width(), 520, 'clamped no-op preserves chosen width');
    await handle.press('Enter'); await handle.press('Shift+ArrowRight');
    await first.getByRole('radio', { name: 'Code', exact: true }).click(); await files.getByRole('button', { name: 'tokens.css', exact: true }).click();
    for (let index = 0; index < 4; index++) {
      await first.getByRole('button', { name: 'Expand', exact: true }).click(); assert.equal(await first.locator('aside').evaluate(element => element.inert), true); assert.equal(await handle.getAttribute('tabindex'), '-1');
      await first.getByRole('radio', { name: 'Code', exact: true }).focus(); await page.keyboard.press('F6'); assert.equal(await focused(content), true); await page.keyboard.press('F6'); assert.equal(await focused(first.getByRole('radio', { name: 'Code', exact: true })), true);
      await first.getByRole('button', { name: 'Restore', exact: true }).click(); assert.equal(await width(), 276);
    }
    assert.equal(await first.getByRole('radio', { name: 'Code', exact: true }).getAttribute('aria-checked'), 'true'); assert.ok((await content.textContent()).includes(':root'));
    await files.getByRole('button').first().focus(); await page.keyboard.press('F6'); assert.equal(await focused(first.getByRole('radio', { name: 'Code', exact: true })), true); await page.keyboard.press('F6'); assert.equal(await focused(content), true); await page.keyboard.press('Shift+F6'); assert.equal(await focused(first.getByRole('radio', { name: 'Code', exact: true })), true);
    assert.equal(await second.getByRole('separator').getAttribute('aria-valuenow'), '244'); assert.equal(await second.getByRole('radio', { name: 'Code', exact: true }).getAttribute('aria-checked'), 'true');
    await setRange('Workspace width', 400); assert.equal(await handle.isVisible(), false); assert.equal(await files.isVisible(), true);
    await first.getByRole('button', { name: 'Expand', exact: true }).click(); assert.equal(await first.locator('aside').isVisible(), false); await first.getByRole('button', { name: 'Restore', exact: true }).click();
    await setRange('Workspace width', 900); assert.equal(await width(), 276);

    const modes = page.getByRole('group', { name: 'Modes', exact: true }), chat = modes.getByRole('button', { name: 'Chat', exact: true }), cowork = modes.getByRole('button', { name: 'Cowork', exact: true });
    await chat.focus(); await page.keyboard.press('ArrowRight'); assert.equal(await focused(cowork), true); assert.equal(await chat.getAttribute('aria-current'), 'page');
    await page.keyboard.press('Space'); assert.equal(await cowork.getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: 'Two modes', exact: true }).click(); assert.equal(await chat.getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: 'Two modes', exact: true }).click(); assert.equal(await chat.getAttribute('aria-current'), 'page', 'reintroduced option does not resurrect old selection');
    for (const [trackWidth, hidden] of [[257, false], [256, true]]) {
      await setRange('Mode width', trackWidth); assert.equal(await cowork.locator('.cui-mode-label').evaluate(element => getComputedStyle(element).display === 'none'), hidden, '254px content-box threshold');
    }
    await page.getByRole('button', { name: 'Two modes', exact: true }).click();
    for (const [trackWidth, hidden] of [[183, false], [182, true]]) {
      await setRange('Mode width', trackWidth); assert.equal(await modes.locator('button').last().locator('.cui-mode-label').evaluate(element => getComputedStyle(element).display === 'none'), hidden, '180px content-box threshold');
    }
    await modes.getByRole('button', { name: 'Code, working', exact: true }).click(); assert.equal(await modes.locator('.cui-mode-running').count(), 0);
    assert.equal(await modes.locator('[aria-current] .cui-icon').evaluate(element => getComputedStyle(element).fontWeight), '700');
    await chat.click(); await page.getByRole('button', { name: 'RTL', exact: true }).click(); await chat.focus(); await page.keyboard.press('ArrowLeft'); assert.equal(await focused(modes.getByRole('button', { name: 'Code, working', exact: true })), true); assert.equal(await chat.getAttribute('aria-current'), 'page');
    await frames(); const aligned = await modes.evaluate(element => { const selected = element.querySelector('[aria-current]').getBoundingClientRect(), thumb = element.querySelector('.cui-mode-thumb').getBoundingClientRect(); return Math.abs(selected.x - thumb.x) < 1 && Math.abs(selected.width - thumb.width) < 1; }); assert.equal(aligned, true);
    await page.getByRole('button', { name: 'RTL', exact: true }).click();
    await frames();
    const running = modes.locator('.cui-mode-running');
    assert.equal(await running.evaluate(element => getComputedStyle(element).animationDuration), '1.2s');
    assert.ok(await running.evaluate(element => Math.abs(element.getAnimations()[0].startTime + performance.timeOrigin % 1200) < .01), 'pulse shares the authored global phase');
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await modes.locator('.cui-mode-activity-icon').last().evaluate(element => getComputedStyle(element).maskImage), 'none');
    await page.emulateMedia({ forcedColors: 'none' });

    const pins = page.getByRole('region', { name: 'Pins', exact: true }), list = pins.getByRole('list'), rows = list.locator(':scope > li');
    const order = () => rows.evaluateAll(nodes => nodes.map(node => node.dataset.pin));
    const original = ['notes', 'reading', 'weekend', 'ideas'];
    const clean = async () => { assert.equal(await pins.locator('.cui-pinned-ghost').count(), 0); assert.equal(await list.getAttribute('data-pin-dragging'), null); assert.equal(await list.locator('[style*="visibility: hidden"]').count(), 0); };
    const start = async (id = 'notes') => { const row = list.locator(`[data-pin="${id}"]`); await row.scrollIntoViewIfNeeded(); const box = await row.boundingBox(); const x = box.x + 50, y = box.y + 13; await page.mouse.move(x, y); await page.mouse.down(); return { x, y }; };
    const reorder = async (id, target) => { const p = await start(id), bounds = await list.boundingBox(); await page.mouse.move(p.x + 4, p.y); await page.mouse.move(p.x, bounds.y + target * 27 + (target === 0 ? 2 : 24), { steps: 4 }); return p; };
    assert.equal(await rows.evaluateAll(nodes => nodes[1].getBoundingClientRect().top - nodes[0].getBoundingClientRect().top), 27);
    await page.getByRole('button', { name: 'Long title', exact: true }).click(); assert.equal(await list.locator('[data-pin="notes"] .cui-pinned-title').getAttribute('data-overflow'), '');
    await page.getByRole('button', { name: 'Long title', exact: true }).click(); assert.equal(await list.locator('[data-pin="notes"] .cui-pinned-title').getAttribute('data-overflow'), null);
    let p = await start(); await page.mouse.move(p.x + 3, p.y + 3); assert.equal(await pins.locator('.cui-pinned-ghost').count(), 0); await page.mouse.move(p.x + 4, p.y + 3); assert.equal(await pins.locator('.cui-pinned-ghost').count(), 1);
    assert.equal(await pins.locator('.cui-pinned-ghost').evaluate(element => element.inert), true); await page.mouse.up(); await clean(); assert.deepEqual(await order(), original);
    await reorder('notes', 3); assert.deepEqual(await order(), original); assert.equal(await list.locator('[data-pin="reading"]').evaluate(element => element.style.transform), 'translateY(-27px)'); await page.mouse.up(); await clean(); assert.deepEqual(await order(), ['reading', 'weekend', 'ideas', 'notes']);
    assert.equal(await pins.getByRole('status').textContent(), 'notes moved to 4 of 4'); await reorder('notes', 0); await page.mouse.up(); assert.deepEqual(await order(), original);
    for (const cancel of ['Escape', 'pointercancel', 'blur', 'resize', 'inactive']) {
      await reorder('notes', 3);
      if (cancel === 'Escape') await page.keyboard.press('Escape');
      if (cancel === 'pointercancel') await list.locator('[data-pin="notes"]').dispatchEvent('pointercancel', { pointerId: 1 });
      if (cancel === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      if (cancel === 'resize') await page.setViewportSize({ width: 1350, height: 1400 });
      if (cancel === 'inactive') await page.getByRole('button', { name: 'Active', exact: true }).evaluate(element => element.click());
      await page.mouse.up(); await clean(); assert.deepEqual(await order(), original, cancel);
      if (cancel === 'inactive') {
        assert.equal(await pins.getByRole('status').textContent(), 'Move cancelled');
        const inactive = await start(); await page.mouse.move(inactive.x + 10, inactive.y + 60); await page.mouse.up();
        await clean(); assert.deepEqual(await order(), original, 'inactive lists cannot start a new drag');
        await page.getByRole('button', { name: 'Active', exact: true }).click();
        assert.equal(await pins.getByRole('status').textContent(), 'Move cancelled', 'reactivating retains the interrupted move announcement');
      }
    }
    await reorder('notes', 3); const bounds = await list.boundingBox();
    await page.mouse.move(bounds.x + bounds.width + 10, bounds.y + 90); await page.mouse.up(); assert.deepEqual(await order(), original, 'horizontal exit restores the source slot');
    await reorder('notes', 3); await list.locator('[data-pin="notes"]').dispatchEvent('pointermove', { pointerId: 1, buttons: 0 });
    assert.deepEqual(await order(), original, 'lost-button fallback waits 200ms');
    await page.waitForFunction(() => !document.querySelector('.cui-pinned-ghost')); await page.mouse.up(); assert.deepEqual(await order(), ['reading', 'weekend', 'ideas', 'notes']);
    await page.getByRole('button', { name: 'Reset pins', exact: true }).click();
    await page.getByRole('button', { name: 'RTL', exact: true }).click();
    await list.locator('.cui-pinned-main').first().focus(); await page.keyboard.press('ArrowLeft'); assert.equal(await focused(list.locator('[data-pin="notes"] .cui-pinned-more')), true);
    await page.keyboard.press('Enter'); const rtlMenu = page.getByRole('menu', { name: 'Move conversation', exact: true }); assert.equal(await rtlMenu.getAttribute('dir'), 'rtl');
    await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'RTL', exact: true }).click();
    await list.locator('.cui-pinned-main').first().focus(); await page.keyboard.press('ArrowDown'); assert.equal(await focused(list.locator('[data-pin="reading"] .cui-pinned-main')), true);
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); const menu = page.getByRole('menu', { name: 'Move conversation', exact: true }); await menu.waitFor();
    assert.equal(await focused(menu.getByRole('menuitem', { name: 'Move up' })), true); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    assert.deepEqual(await order(), ['notes', 'weekend', 'reading', 'ideas']); assert.equal(await focused(list.locator('[data-pin="reading"] .cui-pinned-main')), true);
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await page.keyboard.press('Escape'); assert.equal(await focused(list.locator('[data-pin="reading"] .cui-pinned-more')), true);
    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    await list.locator('[data-pin="notes"] .cui-pinned-main').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
    assert.equal(await menu.getByRole('menuitem').count(), 1); assert.equal(await menu.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(32, 32, 31)', 'portal retains scoped dark theme');
    await pins.evaluate(element => element.setAttribute('data-cui-theme', 'light')); await frames();
    assert.equal(await menu.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(255, 255, 255)', 'a newly scoped theme updates an already open portal');
    await pins.evaluate(element => element.setAttribute('data-cui-theme', 'dark')); await frames();
    assert.equal(await menu.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(32, 32, 31)');
    await pins.evaluate(element => element.removeAttribute('data-cui-theme')); await frames();
    assert.equal(await menu.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(32, 32, 31)', 'removing a theme scope restores the nearest ancestor theme');
    assert.equal(await menu.evaluate(element => element.contains(document.activeElement)), true, 'scoped theme updates retain menu focus');
    await page.getByRole('button', { name: 'Outside', exact: true }).focus(); assert.equal(await menu.count(), 0);
    await list.locator('[data-pin="notes"] .cui-pinned-main').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await page.keyboard.press('Tab');
    assert.equal(await menu.count(), 0); assert.equal(await list.evaluate(element => !element.contains(document.activeElement)), true, 'Tab leaves the roving list after menu dismissal');
    assert.deepEqual(await page.getByRole('region', { name: 'Other pins', exact: true }).locator('[data-pin]').evaluateAll(nodes => nodes.map(node => node.dataset.pin)), original);
    await page.getByRole('button', { name: 'Reset pins', exact: true }).click(); await reorder('notes', 3);
    await list.locator('[data-pin="notes"]').dispatchEvent('pointermove', { pointerId: 1, buttons: 0 });
    const before = await page.locator('[data-changes]').textContent(); await page.getByRole('button', { name: 'Mount', exact: true }).evaluate(element => element.click()); await page.mouse.up(); await page.waitForTimeout(250); assert.equal(await page.locator('.cui-pinned-ghost').count(), 0); assert.equal(await page.locator('[data-changes]').textContent(), before, 'unmount cancels delayed release without a late reorder callback');

    for (const w of [1280, 390, 320]) for (const theme of ['light', 'dark']) for (const locale of ['en', 'zh-Hans']) {
      await page.setViewportSize({ width: w, height: 1000 }); await page.goto(`${base}/demo/?lang=${locale}#workspace`); await page.reload(); await setTheme(page, theme); await page.evaluate(() => document.fonts.ready);
      const scope = page.locator('main section:not([hidden])'); await scope.getByRole('radio', { name: locale === 'en' ? 'Code' : '代码', exact: true }).click();
      assert.equal(await scope.locator('.cui-workspace-content pre').count(), 1); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.goto(`${base}/demo/?lang=${locale}#modes`);
      const track = scope.locator('.cui-mode-track'); await track.locator('button').last().click(); assert.equal(await track.locator('.cui-mode-running').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${w}/${theme}/${locale} sidebar fits`);
      const main = scope.locator('.cui-pinned-main').first(); await main.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
      const menu = page.getByRole('menu'); await menu.waitFor(); const rect = await menu.boundingBox(); assert.ok(rect.x >= 4 && rect.x + rect.width <= w - 4, 'menu clamps to viewport'); await page.keyboard.press('Escape');
    }
    assert.deepEqual(errors, []); console.log('React workspace/sidebar: resize commit boundaries, cancellation, state preservation, F6, mode folding/RTL, pinned drag/menu ownership, portal themes and responsive bilingual layouts passed');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
