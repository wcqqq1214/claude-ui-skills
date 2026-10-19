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
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }); const errors = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      window.transitions = []; const start = document.startViewTransition.bind(document);
      document.startViewTransition = callback => {
        const transition = start(callback), record = {}; window.transitions.push(record);
        transition.ready.then(() => { record.duration = getComputedStyle(document.documentElement, '::view-transition-group(root)').animationDuration; }).catch(() => {});
        return transition;
      };
    });
    await page.goto(`${base}/tests/fixtures/react-gallery/`);
    const first = page.getByRole('region', { name: 'First', exact: true }), dialog = page.locator('.cui-gallery-dialog').first();
    const current = () => dialog.locator('.cui-gallery-slide.current'), image = () => current().locator('img');
    const focused = locator => locator.evaluate(element => element === document.activeElement);
    const host = name => page.getByRole('button', { name, exact: true, includeHidden: true }).evaluate(element => element.click());
    const settle = () => page.waitForFunction(() => !document.querySelector('style[data-cui-gallery-transition]') && ![...document.querySelectorAll('.cui-gallery-rail, .cui-gallery-slide img')].some(element => element.getAnimations().some(animation => animation.playState === 'running')));
    const open = async (at = 0) => { await first.getByRole('button').nth(at).click(); await dialog.waitFor({ state: 'visible' }); await settle(); };
    const close = async (at = 0) => { await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' }); await settle(); assert.equal(await focused(first.getByRole('button').nth(at)), true); };
    const transform = () => image().evaluate(element => { const matrix = new DOMMatrix(getComputedStyle(element).transform); return { scale: matrix.a, x: matrix.e, y: matrix.f }; });
    const wheel = (deltaY, deltaMode = 0, deltaX = 0, ctrlKey = true, clientX = 640) => image().evaluate((element, values) => element.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientY: 400, ...values })), { deltaY, deltaMode, deltaX, ctrlKey, clientX });
    assert.equal(await page.locator('[data-changes]').textContent(), '[]');
    await open(); assert.equal(await focused(dialog.getByRole('button', { name: 'Close', exact: true })), true);
    assert.equal(await dialog.locator('.cui-gallery-count').textContent(), '1 / 3');
    assert.equal(await page.evaluate(() => window.transitions[0].duration), '0.18s');
    assert.equal(await dialog.getByRole('button', { name: 'Previous', exact: true }).getAttribute('aria-disabled'), 'true');
    await page.keyboard.press('Tab'); assert.equal(await focused(current()), true);
    await page.keyboard.press('Enter'); assert.deepEqual(await transform(), { scale: 2, x: 0, y: 0 });
    await page.keyboard.press('Space'); assert.equal(await current().getAttribute('aria-pressed'), 'false');
    const fitted = await image().boundingBox();
    const point = { x: Math.round(fitted.x + fitted.width * .25), y: Math.round(fitted.y + fitted.height * .25) };
    await page.mouse.click(point.x, point.y);
    const matrix = await transform(); assert.equal(matrix.scale, 2);
    assert.ok(Math.abs(matrix.x - Math.min(fitted.x + fitted.width / 2 - point.x, (fitted.width * 2 - 1280) / 2)) < .1, JSON.stringify({ matrix, fitted }));
    assert.ok(Math.abs(matrix.y - Math.min(fitted.y + fitted.height / 2 - point.y, (fitted.height * 2 - 800) / 2)) < .1, JSON.stringify({ matrix, fitted }));
    await current().press('Enter'); await current().press('Enter');
    for (const distance of [3, 4]) {
      if (await current().getAttribute('aria-pressed') !== 'true') await current().press('Enter');
      await page.mouse.move(640, 400); await page.mouse.down(); await page.mouse.move(640 + distance, 400); await page.mouse.up();
      assert.equal(await current().getAttribute('aria-pressed'), String(distance === 4));
    }
    await current().press('Enter'); // reset
    await wheel(-1); assert.equal((await transform()).scale, 1.25);
    await wheel(-1); assert.ok((await transform()).scale > 1.25);
    await wheel(1000); assert.equal(await current().getAttribute('aria-pressed'), 'false');
    for (const mode of [0, 1, 2]) { await wheel(mode ? -1 : -16, mode); assert.equal((await transform()).scale, 1.25); await wheel(1000); }
    await current().press('Enter'); await wheel(1, 1, 1, false); assert.deepEqual(await transform(), { scale: 2, x: -16, y: -16 });
    await wheel(100, 2, 100, false); const bounded = await transform(); assert.ok(bounded.x > -2000 && bounded.y > -2000);
    await current().press('Enter'); await current().press('Enter');
    // A second pointer cannot finish or replace a captured drag.
    await page.mouse.move(640, 400); await page.mouse.down(); await page.mouse.move(660, 400);
    await image().dispatchEvent('pointercancel', { pointerId: 99 }); await page.mouse.move(680, 400);
    assert.equal((await transform()).x, 40);
    await image().evaluate(element => element.click()); assert.equal(await current().getAttribute('aria-pressed'), 'true');
    await current().press('Enter'); assert.equal(await current().getAttribute('aria-pressed'), 'false'); await page.mouse.up();
    await current().press('Enter');
    await page.keyboard.press('Tab'); const previous = dialog.getByRole('button', { name: 'Previous', exact: true }), next = dialog.getByRole('button', { name: 'Next', exact: true });
    assert.equal(await focused(previous), true); await page.keyboard.press('Enter'); assert.equal(await current().getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); assert.equal(await focused(next), true);
    assert.equal(await dialog.locator('.cui-gallery-filename').textContent(), 'landscape-dusk.svg'); assert.equal(await current().getAttribute('aria-pressed'), 'false');
    assert.equal(await dialog.locator('[aria-hidden="true"][role]').count(), 0);
    await page.keyboard.press('End'); assert.equal(await next.getAttribute('aria-disabled'), 'true');
    await page.keyboard.press('Tab'); assert.equal(await focused(dialog.getByRole('button', { name: 'Close', exact: true })), true);
    await page.keyboard.press('Shift+Tab'); assert.equal(await focused(next), true); await close();
    await open(1); await close(1);
    await host('RTL'); await open(); await page.keyboard.press('ArrowLeft'); await settle();
    assert.equal(await dialog.locator('.cui-gallery-count').textContent(), '2 / 3');
    const middle = await current().boundingBox(); assert.ok(Math.abs(middle.x + middle.width / 2 - 640) < .1);
    await page.keyboard.press('ArrowRight'); await close(); await host('RTL');
    await open(1); await host('Reverse'); await settle(); assert.equal(await dialog.locator('.cui-gallery-filename').textContent(), 'landscape-dusk.svg');
    await host('Remove dusk'); await settle(); assert.equal(await dialog.locator('.cui-gallery-filename').textContent(), 'landscape-sand.svg');
    await host('Empty'); await settle(); assert.equal(await dialog.isVisible(), false); await host('Open first'); assert.equal(await dialog.isVisible(), false);
    await host('Restore'); await open(); await current().press('Enter'); await host('Long'); assert.equal(await current().getAttribute('aria-pressed'), 'true', 'host label changes retain geometry');
    await page.setViewportSize({ width: 1200, height: 800 }); await page.waitForFunction(() => document.querySelector('.cui-gallery-slide.current').getAttribute('aria-pressed') === 'false'); await close(); await host('Long');
    await page.setViewportSize({ width: 607, height: 800 }); await open();
    await wheel(-1, 0, 0, true, 0); await wheel(-Math.log(2 / 1.25) / .01, 0, 0, true, 303);
    assert.ok(Math.abs((await transform()).x - 121.7) < .01, 'ideal pan survives expanded bounds');
    await wheel(1000);
    await image().evaluate(element => { element.auditAnimation = element.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 10000 }); });
    await current().press('Enter'); assert.equal(await current().getAttribute('aria-pressed'), 'false');
    await image().evaluate(element => { element.auditAnimation.cancel(); element.style.width = '0px'; element.style.height = '0px'; });
    await current().press('Enter'); assert.equal(await current().getAttribute('aria-pressed'), 'false');
    await image().evaluate(element => { element.style.removeProperty('width'); element.style.removeProperty('height'); });
    await page.keyboard.press('ArrowRight'); await settle(); await current().press('Enter');
    await page.mouse.move(450, 400); await page.mouse.down(); await page.mouse.move(80, 400, { steps: 8 }); await page.mouse.up();
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
    await page.mouse.click(585, 350); assert.equal(await dialog.locator('.cui-gallery-count').textContent(), '2 / 3'); assert.equal(await current().getAttribute('aria-pressed'), 'false');
    await page.mouse.click(585, 350); assert.equal(await dialog.locator('.cui-gallery-count').textContent(), '3 / 3'); await close();
    await open(); await page.mouse.click(585, 60); await dialog.waitFor({ state: 'hidden' }); await settle();
    assert.equal(await dialog.locator('.cui-gallery-count').textContent(), '1 / 3'); assert.equal(await focused(first.getByRole('button').first()), true);
    for (const sequence of [['Open first', 'Close first'], ['Open first', 'Close first', 'Open first']]) {
      await page.evaluate(names => { for (const name of names) [...document.querySelectorAll('button')].find(button => button.textContent === name).click(); }, sequence);
      await settle(); assert.equal(await dialog.isVisible(), sequence.length === 3);
      if (sequence.length === 3) { await host('Close first'); await settle(); }
    }
    await open(); await host('Open second'); const other = page.getByRole('dialog', { name: 'Second gallery' }); await other.waitFor({ state: 'visible' }); await settle();
    assert.equal(await other.locator('.cui-gallery-filename').textContent(), 'landscape-dusk.svg'); await host('Close first'); await settle(); assert.equal(await focused(other.getByRole('button', { name: 'Close', exact: true })), true);
    await host('Close second'); await settle();
    for (const cancel of ['Active', 'Mount', 'pagehide']) {
      await host('Open first'); if (cancel === 'pagehide') await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); else await host(cancel);
      await settle(); assert.equal(await page.locator('dialog[open]').count(), 0); assert.equal(await page.locator('.cui-gallery-slide img').evaluateAll(images => images.every(image => !image.style.transform)), true);
      if (cancel !== 'pagehide') await host(cancel);
    }
    await page.evaluate(() => { window.originalStart = document.startViewTransition; window.lateUpdates = []; document.startViewTransition = callback => { window.lateUpdates.push(callback); return { skipTransition() {}, ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), finished: new Promise(() => {}) }; }; });
    await host('Open first'); await host('Mount'); await page.evaluate(() => { window.lateUpdates.forEach(callback => callback()); document.startViewTransition = window.originalStart; });
    assert.equal(await page.locator('dialog[open], style[data-cui-gallery-transition]').count(), 0); await host('Mount');
    await page.evaluate(() => { document.startViewTransition = undefined; }); await open(); await close();
    assert.deepEqual(errors, []);
    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) for (const locale of ['en', 'zh-Hans']) {
      await page.setViewportSize({ width, height: 800 }); await page.goto(`${base}/demo/?lang=${locale}#gallery`);
      await setTheme(page, theme);
      await page.locator('section[aria-label]').filter({ visible: true }).getByRole('button').first().click();
      const preview = page.locator('.cui-gallery-dialog'); await preview.waitFor({ state: 'visible' }); await settle();
      const layout = await preview.evaluate(element => {
        const rect = name => { const value = element.querySelector(name).getBoundingClientRect(); return { x: value.x, y: value.y, width: value.width, height: value.height, bottom: value.bottom, right: value.right }; };
        return { close: rect('.cui-gallery-close'), nav: rect('.cui-gallery-navigation'), previous: rect('.cui-gallery-navigation button'), bottom: rect('.cui-gallery-bottom'), filename: rect('.cui-gallery-filename'), image: rect('.current img'), overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.deepEqual([layout.close.width, layout.close.height, layout.close.x, layout.close.y], [32, 32, width - 48, 16]);
      assert.deepEqual([layout.previous.width, layout.previous.height], [36, 36]); assert.equal(layout.bottom.height, 56); assert.equal(layout.bottom.bottom, 776);
      assert.ok(Math.abs(layout.nav.x + layout.nav.width / 2 - width / 2) < .1); assert.equal(layout.overflow, false);
      assert.ok(layout.image.width <= width * .75 + .1 && layout.image.height <= 560.1);
      if (width < 640) { assert.equal(layout.filename.bottom, layout.bottom.y); assert.equal(layout.filename.x, 24); assert.equal(layout.filename.right, width - 24); }
      await page.keyboard.press('Escape'); await preview.waitFor({ state: 'hidden' }); await settle();
    }
    assert.deepEqual(errors, []); console.log('React gallery: geometry, focal zoom, gestures, keys, lifecycle, independent consumers and responsive demos passed.');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
