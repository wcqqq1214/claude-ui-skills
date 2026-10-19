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
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      const start = document.startViewTransition.bind(document);
      window.transitions = [];
      document.startViewTransition = callback => {
        const sheet = [...document.querySelectorAll('style[data-cui-image-transition]')].at(-1), name = sheet?.dataset.cuiImageTransition;
        const transition = start(callback), record = { name }; window.transitions.push(record);
        transition.ready.then(() => {
          const style = getComputedStyle(document.documentElement, `::view-transition-image-pair(${name})`);
          record.ready = true; record.duration = style.animationDuration;
          record.frames = document.getAnimations().filter(animation => animation.animationName?.startsWith('cui-image-preview-decoration')).map(animation => animation.effect.getKeyframes());
        }).catch(error => { record.skipped = error.name; });
        return transition;
      };
    });
    await page.goto(`${base}/tests/fixtures/react-images/`);
    const first = page.getByRole('button', { name: 'Enlarge first', exact: true }), second = page.getByRole('button', { name: 'Enlarge second', exact: true });
    const dialog = page.getByRole('dialog', { name: 'First preview', exact: true });
    const settle = () => page.waitForFunction(() => !document.querySelector('style[data-cui-image-transition]'));
    const focused = locator => locator.evaluate(element => element === document.activeElement);
    // Host controls are deliberately invoked without pointer hit-testing for
    // programmatic interruption while the native modal makes its siblings inert.
    const host = name => page.getByRole('button', { name, exact: true, includeHidden: true }).evaluate(element => element.click());
    const open = async () => { await first.click(); await dialog.waitFor({ state: 'visible' }); await settle(); };
    const close = async (method = 'escape') => {
      if (method === 'escape') await page.keyboard.press('Escape');
      else if (method === 'image') await dialog.locator('img').click();
      else if (method === 'backdrop') await dialog.click({ position: { x: 2, y: 2 } });
      else await dialog.getByRole('button', { name: 'Dismiss first' }).click();
      await dialog.waitFor({ state: 'hidden' }); await settle();
      assert.equal(await focused(first), true);
      assert.equal(await first.locator('img').evaluate(element => element.style.visibility), '');
      assert.equal(await page.locator('[style*="view-transition-name"]').count(), 0);
    };
    assert.equal(await page.locator('[data-changes]').textContent(), '[]');
    assert.deepEqual(await first.locator('img').evaluate(element => { const rect = element.getBoundingClientRect(); return [rect.width, rect.height]; }), [480, 312]);
    for (const method of ['escape', 'image', 'backdrop', 'button']) { await open(); await close(method); }
    const records = await page.evaluate(() => window.transitions);
    assert.equal(records.length, 8); assert.ok(records.every(record => record.ready));
    records.forEach((record, index) => {
      assert.equal(record.duration, index % 2 ? '0.25s' : '0.35s');
      assert.equal(record.frames[0][0].borderTopLeftRadius, index % 2 ? '6px' : '9px');
      assert.equal(record.frames[0].at(-1).borderTopLeftRadius, index % 2 ? '9px' : '6px');
    });
    for (const key of ['Enter', 'Space']) {
      await first.focus(); await page.keyboard.press(key); await dialog.waitFor({ state: 'visible' }); await settle();
      const closeButton = dialog.getByRole('button');
      for (const key of ['Tab', 'Shift+Tab', 'ArrowRight', 'Home', 'End']) { await page.keyboard.press(key); assert.equal(await focused(closeButton), true); }
      await close();
    }
    await first.focus();
    assert.ok(await first.evaluate(element => getComputedStyle(element, '::after').boxShadow.includes('rgb(205, 226, 251)')));
    await host('Theme'); await first.focus();
    assert.ok(await first.evaluate(element => getComputedStyle(element, '::after').boxShadow.includes('rgba(24, 79, 149, 0.6)')));
    await host('Theme');
    await host('Contain'); await open();
    const inset = await page.evaluate(() => window.transitions.at(-1).frames[0][0]);
    assert.equal(inset.top, '10%'); assert.equal(inset.bottom, '3.333%'); assert.equal(inset.borderTopLeftRadius, '0px');
    await close(); await host('Contain');
    // A no-longer-visible source closes with a fade, rather than flying offscreen.
    await open(); await first.evaluate(element => { element.style.transform = 'translateY(-2000px)'; }); await host('Close first');
    await page.waitForFunction(() => document.getAnimations().some(animation => animation.animationName === 'cui-image-preview-fade-out'));
    await settle(); await first.evaluate(element => { element.style.transform = ''; });
    // Rapid changes share no stale update callback or root decoration.
    for (const order of [['Open first', 'Close first'], ['Open first', 'Close first', 'Open first']]) {
      await page.evaluate(names => { for (const name of names) [...document.querySelectorAll('button')].find(button => button.textContent === name).click(); }, order);
      await settle(); assert.equal(await dialog.isVisible(), order.length === 3);
      if (order.length === 3) { await host('Close first'); await settle(); }
    }
    // Simultaneous instances keep independent transition names and native focus.
    await open(); await host('Open second');
    const other = page.getByRole('dialog', { name: 'Second preview' }); await other.waitFor({ state: 'visible' }); await settle();
    const names = await page.evaluate(() => [...new Set(window.transitions.map(record => record.name))]); assert.equal(names.length, 2);
    assert.equal(await other.evaluate(element => getComputedStyle(element).getPropertyValue('--cui-bg').trim()), '#0b0b0b');
    await host('Close first'); await settle(); assert.equal(await focused(other.getByRole('button')), true);
    await host('Close second'); await settle(); assert.equal(await page.locator('dialog[open]').count(), 0);
    for (const cancel of ['Active', 'Mount', 'pagehide']) {
      await host('Open first');
      if (cancel === 'pagehide') await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      else await host(cancel);
      await settle(); await page.waitForTimeout(50); assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.equal(await page.locator('[style*="view-transition-name"]').count(), 0);
      if (cancel !== 'pagehide') await host(cancel);
    }
    // A transition whose update arrives after unmount must not reopen a detached modal.
    await page.evaluate(() => { window.originalStart = document.startViewTransition; window.lateUpdates = []; document.startViewTransition = callback => { window.lateUpdates.push(callback); return { skipTransition() {}, ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), finished: new Promise(() => {}) }; }; });
    await host('Open first'); await host('Mount');
    await page.evaluate(() => { window.lateUpdates.forEach(callback => callback()); document.startViewTransition = window.originalStart; });
    assert.equal(await page.locator('dialog[open], style[data-cui-image-transition]').count(), 0); await host('Mount');
    // No View Transition API: same dismissal and focus behavior.
    await page.evaluate(() => { document.startViewTransition = undefined; }); await open(); await close();
    assert.deepEqual(errors, []);
    for (const touch of [false, true]) {
      const context = await browser.newContext({ hasTouch: touch }); const demo = await context.newPage(); demo.on('pageerror', error => errors.push(error.message));
      for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) for (const locale of ['en', 'zh-Hans']) {
        await demo.setViewportSize({ width, height: 740 }); await demo.goto(`${base}/demo/?lang=${locale}#images`);
        await setTheme(demo, theme);
        await demo.locator('.cui-image-origin').click(); const preview = demo.locator('.cui-image-dialog'); await preview.waitFor({ state: 'visible' });
        await demo.waitForFunction(() => !document.querySelector('style[data-cui-image-transition]'));
        assert.equal(await demo.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const layout = await preview.evaluate(element => { const image = element.querySelector('.cui-image-preview-surface').getBoundingClientRect(), button = element.querySelector('button').getBoundingClientRect(); return { width: image.width, size: [button.width, button.height], offset: [button.x - image.x, button.y - image.y], icon: getComputedStyle(element.querySelector('.cui-icon')).fontSize }; });
        assert.ok(Math.abs(layout.width - (width === 1280 ? 640 : width - 32)) < 1);
        assert.deepEqual(layout.size, touch ? [32, 32] : [24, 24]); assert.equal(layout.icon, touch ? '20px' : '16px');
        const expected = width === 1280 ? [646, 0] : [width - (touch ? 70 : 62), 6]; assert.ok(layout.offset.every((value, i) => Math.abs(value - expected[i]) < 1));
        await demo.keyboard.press('Escape'); await preview.waitFor({ state: 'hidden' }); await demo.waitForFunction(() => !document.querySelector('style[data-cui-image-transition]'));
      }
      await context.close();
    }
    assert.deepEqual(errors, []); console.log('React images: independent consumers, native transitions, focus, interruption, lifecycle and responsive demos passed.');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
