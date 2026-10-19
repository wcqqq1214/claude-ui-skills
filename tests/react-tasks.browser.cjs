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
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } }); const errors = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${base}/tests/fixtures/react-tasks/`);
    const progress = page.locator('.cui-progress-list').first(), fold = progress.locator('.cui-progress-fold-button'), earlier = progress.locator('.cui-progress-fold');
    const host = name => page.getByRole('button', { name, exact: true }).click();
    const finite = locator => locator.evaluate(element => Promise.all(element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running' && animation.effect?.getComputedTiming().endTime !== Infinity).map(animation => animation.finished.catch(() => {}))));
    assert.equal(await page.locator('[data-changes]').textContent(), '0');
    assert.equal(await fold.getAttribute('aria-expanded'), 'false'); assert.equal(await earlier.evaluate(element => element.inert), true); assert.equal((await earlier.boundingBox()).height, 0);
    await fold.press('Enter'); await finite(progress); assert.equal(await fold.getAttribute('aria-expanded'), 'true'); assert.ok((await earlier.boundingBox()).height >= 31);
    await fold.press('Space'); await finite(progress); assert.equal((await earlier.boundingBox()).height, 0);
    for (let i = 0; i < 8; i++) await fold.evaluate(element => element.click());
    await finite(progress); assert.equal(await fold.getAttribute('aria-expanded'), 'false');
    const current = () => progress.locator('[data-state="in_progress"] .cui-shimmer');
    await page.waitForFunction(() => document.querySelector('.cui-progress-list [data-shimmering="true"]')?.dataset.shimmerMode === 'composited');
    await page.waitForTimeout(100);
    const before = await current().evaluate(element => {
      window.cloneBefore = element.lastElementChild;
      return window.cloneBefore.getAnimations({ subtree: true }).find(animation => animation.effect.pseudoElement === '::after').startTime;
    });
    assert.equal(typeof before, 'number'); await host('Language');
    const after = await current().evaluate(element => { const clone = element.lastElementChild; return { same: clone === window.cloneBefore, inert: clone.inert, start: clone.getAnimations({ subtree: true }).find(animation => animation.effect.pseudoElement === '::after').startTime, text: clone.textContent }; });
    assert.equal(after.same, false); assert.equal(after.inert, true); assert.equal(after.start, before); assert.ok(after.text.includes('正在处理'));
    await current().evaluate(element => { window.cloneBefore = element.lastElementChild; }); await fold.click(); assert.equal(await current().evaluate(element => element.lastElementChild === window.cloneBefore), true);
    await host('Active'); await page.waitForTimeout(50);
    const time = await current().evaluate(element => element.lastElementChild.getAnimations({ subtree: true }).find(animation => animation.effect.pseudoElement === '::after').currentTime);
    await host('Language');
    const paused = await current().evaluate(element => { const animation = element.lastElementChild.getAnimations({ subtree: true }).find(animation => animation.effect.pseudoElement === '::after'); return { state: animation.playState, time: animation.currentTime }; });
    assert.equal(paused.state, 'paused'); assert.equal(paused.time, time); await host('Active'); await host('RTL');
    assert.equal(await current().locator('.cui-shimmer-clone').evaluate(element => getComputedStyle(element, '::after').animationName), 'cui-progress-shimmer-band-rtl');
    await page.emulateMedia({ forcedColors: 'active' }); assert.equal(await current().locator('.cui-shimmer-clone').evaluate(element => getComputedStyle(element).display), 'none'); await page.emulateMedia({ forcedColors: 'none' }); await host('RTL');
    await host('Pending'); assert.equal(await fold.isVisible(), false); assert.equal(await progress.locator('[data-building="true"]').count(), 1);
    await host('Start'); assert.equal(await progress.locator('[data-kind="current"]').count(), 1);
    assert.equal(await progress.locator('.cui-progress-clay').evaluate(element => getComputedStyle(element).animationDuration), '3s');
    await host('Append'); assert.equal(await progress.locator('.cui-progress-step-enter').count(), 3); assert.equal(await progress.locator('.cui-progress-step-enter').first().evaluate(element => getComputedStyle(element).animationDuration), '0.22s');
    await host('Initial'); await fold.click(); await host('Done'); assert.equal(await fold.getAttribute('aria-expanded'), 'true'); assert.equal(await earlier.locator('.cui-progress-row').count(), 6);
    assert.equal(await progress.locator('[data-kind="finished"]').count(), 1); assert.equal(await progress.locator('[data-shimmering="true"]').count(), 0);
    assert.equal(await progress.locator('.cui-progress-fold-marks > span').last().evaluate(element => getComputedStyle(element).opacity), '0.1');
    await host('Single'); assert.equal(await progress.locator('.cui-progress-rail').evaluate(element => getComputedStyle(element).height), '10px');
    await host('Empty'); assert.equal(await progress.locator('.cui-progress-row').count(), 0); await host('Initial');
    const second = page.getByRole('region', { name: 'Second' }); await host('Controlled fold'); assert.equal(await second.locator('.cui-progress-fold-button').getAttribute('aria-expanded'), 'true'); await second.locator('.cui-progress-fold-button').click(); assert.equal(await second.locator('.cui-progress-fold-button').getAttribute('aria-expanded'), 'false');
    const cards = page.getByRole('group', { name: 'Tasks', exact: true });
    assert.equal(await cards.locator('.cui-task-title').first().evaluate(element => getComputedStyle(element).fontWeight), '500');
    await host('Theme'); assert.equal(await cards.locator('.cui-task-title').first().evaluate(element => getComputedStyle(element).fontWeight), '460'); await host('Theme');
    await cards.getByRole('button').first().focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await cards.getByRole('button').nth(1).evaluate(element => element === document.activeElement), true); assert.equal(await cards.locator('[aria-expanded="true"]').count(), 0);
    await page.keyboard.press('Enter'); assert.equal(await page.getByRole('region', { name: 'Cards', exact: true }).locator('.cui-task-detail').textContent(), 'stopped details'); await page.keyboard.press('Space'); assert.equal(await cards.locator('[aria-expanded="true"]').count(), 0);
    await host('RTL'); await cards.getByRole('button').first().focus(); await page.keyboard.press('ArrowLeft'); assert.equal(await cards.getByRole('button').nth(1).evaluate(element => element === document.activeElement), true); await host('RTL');
    const overlay = page.locator('.cui-drop-overlay'); await host('Drag'); await finite(overlay); assert.equal(await overlay.isVisible(), true); assert.equal(await overlay.getAttribute('data-state'), 'off');
    await host('Over'); await finite(overlay); assert.equal(await overlay.locator('.cui-drop-ring-on').evaluate(element => getComputedStyle(element).opacity), '1');
    await host('Finish'); await page.waitForTimeout(40); await host('Drag'); await finite(overlay); assert.equal(await overlay.isVisible(), true); await page.waitForTimeout(220); assert.equal(await overlay.isVisible(), true, 'stale exit cannot hide re-entry');
    await host('Finish'); await overlay.waitFor({ state: 'hidden' }); await host('Over'); await host('Active'); assert.equal(await overlay.isVisible(), false); await host('Active');
    await host('Finish'); await host('Mount'); await page.waitForTimeout(220); assert.equal(await page.locator('.cui-drop-overlay').count(), 0); await host('Mount');
    assert.deepEqual(errors, []);

    for (const fallback of ['clamped', 'no-observer', 'no-compositing']) {
      const context = await browser.newContext();
      if (fallback === 'no-observer') await context.addInitScript(() => { window.ResizeObserver = undefined; });
      if (fallback === 'no-compositing') await context.addInitScript(() => { const supports = CSS.supports.bind(CSS); CSS.supports = (...args) => args[0].includes('-webkit-mask-clip') ? false : supports(...args); });
      const probe = await context.newPage(); probe.on('pageerror', error => errors.push(error.message)); await probe.goto(`${base}/tests/fixtures/react-tasks/`);
      if (fallback === 'clamped') { await probe.getByRole('button', { name: 'Pending', exact: true }).click(); await probe.addStyleTag({ content: '.cui-progress-text { -webkit-line-clamp: 1; }' }); await probe.getByRole('button', { name: 'Initial', exact: true }).click(); }
      await probe.waitForFunction(() => document.querySelector('.cui-progress-list [data-shimmering="true"]')?.dataset.shimmerMode === 'fallback');
      assert.equal(await probe.locator('.cui-progress-list').first().locator('.cui-shimmer-clone').count(), 0); await context.close();
    }
    const demo = await browser.newPage({ viewport: { width: 1280, height: 900 } }); demo.on('pageerror', error => errors.push(error.message));
    await demo.clock.install(); await demo.goto(`${base}/demo/?lang=en#tasks`); await demo.clock.pauseAt(new Date(Date.now() + 1000));
    const list = demo.locator('.cui-progress-list'), replay = demo.getByRole('button', { name: 'Replay', exact: true }); await list.scrollIntoViewIfNeeded(); await demo.clock.runFor(50);
    const advance = async ms => { await demo.clock.runFor(ms); await new Promise(resolve => setTimeout(resolve, 250)); await finite(list); };
    const status = () => list.locator('.cui-progress-row').evaluateAll(rows => rows.map(row => row.dataset.state));
    await replay.click(); await advance(1850); assert.deepEqual(await status(), ['in_progress', 'pending', 'pending']);
    await advance(3200); assert.equal(await list.locator('.cui-progress-step-enter').count(), 3);
    await advance(1600); await list.locator('.cui-progress-fold-button').click(); await setLanguage(demo, 'zh-Hans'); await advance(5000);
    assert.equal(await demo.locator('[data-progress-count]').textContent(), '6 / 6'); assert.equal(await list.locator('.cui-progress-fold-button').getAttribute('aria-expanded'), 'true');
    await demo.getByRole('button', { name: '重播', exact: true }).click(); await advance(1000); await demo.getByRole('button', { name: '重播', exact: true }).click(); await advance(1700); assert.equal(await demo.locator('[data-progress-count]').textContent(), '0 / 3');
    await demo.evaluate(() => { location.hash = 'controls'; }); await advance(100); const beforeExit = await status(); await advance(15000); assert.deepEqual(await status(), beforeExit); await demo.evaluate(() => { location.hash = 'tasks'; }); await advance(100);
    const source = demo.locator('[draggable="true"][role="button"]'); await source.press('Enter'); assert.ok((await demo.locator('.cui-drop-target').textContent()).includes('已放入：设计笔记.md'));
    await demo.getByRole('button', { name: '重置拖放示例', exact: true }).click();
    await source.dragTo(demo.locator('.cui-drop-target')); assert.ok((await demo.locator('.cui-drop-target').textContent()).includes('已放入：设计笔记.md'));
    await demo.getByRole('button', { name: '重置拖放示例', exact: true }).click();
    const payload = await demo.evaluateHandle(() => { const data = new DataTransfer(); data.setData('text/plain', 'external'); return data; });
    await demo.locator('.cui-drop-target').dispatchEvent('drop', { dataTransfer: payload }); assert.equal((await demo.locator('.cui-drop-target').textContent()).includes('已放入'), false); await payload.dispose();
    await demo.close();
    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) for (const locale of ['en', 'zh-Hans']) {
      await page.setViewportSize({ width, height: 1000 }); await page.goto(`${base}/demo/?lang=${locale}#tasks`);
      await setTheme(page, theme);
      await page.locator('.cui-progress-fold-button').click(); await finite(page.locator('.cui-progress-list'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('.cui-progress-text').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth + 1)), true);
      const tiles = page.locator('.cui-task-card'); await tiles.first().click(); assert.equal(await page.locator('.cui-task-detail').isVisible(), true);
    }
    assert.deepEqual(errors, []); console.log('React tasks: progress, shimmer phase/fallbacks, cards, drop interruption, replay and responsive demos passed.');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
