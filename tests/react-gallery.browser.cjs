const { setTheme } = require('./demo-helpers.cjs');
const assert = require('node:assert/strict');
const { withDevBrowser } = require('./dev-browser.cjs');
const { testGalleryEffects } = require('./migration-review-checks.cjs');
withDevBrowser(async ({ browser, base }) => {
    const effectPage = await browser.newPage();
    await testGalleryEffects(effectPage, base); await effectPage.close();
    for (const transitions of ['native', 'unavailable', 'throws']) {
      for (const action of ['inactive', 'empty', 'unmount', 'remove', 'close', 'reopen', 'replace', 'remove-after-close', 'close-after-close', 'nested-cancel-after-close']) {
        const afterClose = action.endsWith('-after-close');
        const reentry = await browser.newPage({ viewport: { width: 1280, height: 800 } }), reentryErrors = [];
        reentry.on('pageerror', error => reentryErrors.push(error.message));
        reentry.on('console', message => { if (message.type() === 'error') reentryErrors.push(message.text()); });
        await reentry.addInitScript(mode => {
          if (mode === 'unavailable') document.startViewTransition = undefined;
          if (mode === 'throws') document.startViewTransition = () => { throw new Error('View Transition unavailable'); };
        }, transitions);
        await reentry.goto(`${base}/tests/fixtures/react-gallery/?reentry=${action}`);
        if (afterClose) {
          await reentry.getByRole('button', { name: 'Open current', exact: true }).click();
          await reentry.waitForFunction(() => !document.querySelector('style[data-cui-gallery-transition]'));
        }
        await reentry.getByRole('button', { name: afterClose ? 'Close and select' : 'Open selected', exact: true, includeHidden: true }).evaluate(element => element.click());
        await reentry.waitForFunction(() => !document.querySelector('style[data-cui-gallery-transition]'));
        const expectedOpen = action === 'reopen' || action === 'replace';
        assert.equal(await reentry.locator('dialog[open]').count(), Number(expectedOpen), `selection callback ${action} owns the final open state (${transitions})`);
        assert.equal(await reentry.locator('[aria-expanded="true"]').count(), Number(expectedOpen));
        assert.deepEqual(JSON.parse(await reentry.locator('[data-selection-changes]').textContent()), expectedOpen ? [true] : afterClose ? [true, false] : [], 'cancelled opening does not announce a stale open');
        assert.deepEqual(JSON.parse(await reentry.locator('[data-selection-values]').textContent()), action === 'reopen' || action === 'nested-cancel-after-close' ? ['dusk', 'sand'] : ['dusk']);
        if (afterClose) assert.equal(await reentry.getByRole('button', { name: 'Open image 1', exact: true }).evaluate(element => element === document.activeElement), true, 'cancelling another opening preserves the earlier close and its focus destination');
        if (expectedOpen) {
          const reopened = reentry.getByRole('dialog', { name: 'Selection gallery' });
          assert.equal(await reopened.locator('.cui-gallery-filename').textContent(), action === 'reopen' ? 'landscape-sand.svg' : 'replacement.svg');
          await reentry.keyboard.press('Escape');
          await reopened.waitFor({ state: 'hidden' });
          await reentry.waitForFunction(() => !document.querySelector('style[data-cui-gallery-transition]'));
          assert.deepEqual(JSON.parse(await reentry.locator('[data-selection-changes]').textContent()), [true, false]);
          assert.equal(await reentry.locator('[aria-expanded="true"]').count(), 0);
        }
        assert.deepEqual(reentryErrors, []); await reentry.close();
      }
      const activity = await browser.newPage({ viewport: { width: 1280, height: 800 } }), activityErrors = [];
      activity.on('pageerror', error => activityErrors.push(error.message));
      activity.on('console', message => { if (message.type() === 'error') activityErrors.push(message.text()); });
      await activity.addInitScript(mode => {
        if (mode === 'unavailable') document.startViewTransition = undefined;
        if (mode === 'throws') document.startViewTransition = () => { throw new Error('View Transition unavailable'); };
      }, transitions);
      await activity.goto(`${base}/tests/fixtures/react-gallery/?activity`);
      const modal = activity.getByRole('dialog', { name: 'Activity gallery', includeHidden: true });
      const activityHost = name => activity.getByRole('button', { name, exact: true, includeHidden: true }).evaluate(element => element.click());
      const activitySettle = () => activity.waitForFunction(() => !document.querySelector('style[data-cui-gallery-transition]'));
      const changes = async () => JSON.parse(await activity.locator('[data-activity-changes]').textContent());
      await modal.waitFor({ state: 'visible' }); await activitySettle();
      assert.deepEqual(await changes(), [true], 'StrictMode opens once after its effect probe');
      await modal.getByRole('button', { name: 'Next', exact: true }).click();
      assert.equal(await modal.locator('.cui-gallery-filename').textContent(), 'landscape-dusk.svg');
      assert.equal(await activity.locator('[data-activity-selections]').textContent(), '["dusk"]');
      const retained = await modal.elementHandle();
      await modal.evaluate(element => { element.dataset.closes = '0'; element.addEventListener('close', () => { element.dataset.closes = String(Number(element.dataset.closes) + 1); }); });
      for (let repeat = 0; repeat < 2; repeat++) {
        const before = (await changes()).length, closes = await retained.evaluate(element => Number(element.dataset.closes));
        await activityHost('Reconnect Activity');
        await activity.waitForFunction(closes => Number(document.querySelector('[data-activity-host] dialog').dataset.closes) > closes, closes);
        await activitySettle();
        assert.equal(await retained.evaluate(element => element === document.querySelector('[data-activity-host] dialog') && element.isConnected), true, 'Activity reconnect retains the same dialog DOM');
        assert.equal(await modal.isVisible(), true, `old close events cannot cancel the reconnected opening (${transitions})`);
        assert.deepEqual((await changes()).slice(before), [true], 'effect cleanup stays silent and reopening emits no stale false');
        assert.equal(await modal.locator('.cui-gallery-filename').textContent(), 'landscape-dusk.svg', 'Activity reopening retains the selected ID instead of the initial ID');
        assert.equal(await modal.locator('[data-cui-gallery-slide="dusk"]').getAttribute('aria-hidden'), 'false');
        assert.equal(await activity.locator('[data-activity-selections]').textContent(), '["dusk"]', 'reconnection does not invent another selection change');
      }
      await modal.evaluate(element => element.close());
      await activity.waitForFunction(() => !document.querySelector('[data-activity-host] button[aria-haspopup="dialog"][aria-expanded="true"]'));
      assert.equal((await changes()).at(-1), false, 'external native close still updates the reconnected controller');
      await activityHost('Open Activity'); await modal.waitFor({ state: 'visible' }); await activitySettle();
      const beforeHidden = (await changes()).length, closes = await retained.evaluate(element => Number(element.dataset.closes));
      await activityHost('Hide Activity');
      await activity.waitForFunction(closes => Number(document.querySelector('[data-activity-host] dialog').dataset.closes) > closes, closes);
      assert.equal(await retained.evaluate(element => element.isConnected), true, 'hidden Activity keeps its dialog attached while the old close event is delivered');
      await activityHost('Show Activity'); await modal.waitFor({ state: 'visible' }); await activitySettle();
      assert.equal(await retained.evaluate(element => element === document.querySelector('[data-activity-host] dialog')), true);
      assert.deepEqual((await changes()).slice(beforeHidden), [true], 'showing after queued close delivery reopens without a stale notification');
      assert.equal(await modal.locator('.cui-gallery-filename').textContent(), 'landscape-dusk.svg', 'selection also survives an interval with detached effects');
      await modal.evaluate(element => element.close());
      await activity.waitForFunction(() => !document.querySelector('[data-activity-host] button[aria-haspopup="dialog"][aria-expanded="true"]'));
      assert.deepEqual((await changes()).slice(beforeHidden), [true, false], 'hidden-time delivery leaves no stale ownership to swallow external close');

      // Reconnecting effects does not itself request another modal. The DOM,
      // selected item and host history survive; presentation and zoom do not.
      await activity.goto(`${base}/tests/fixtures/react-gallery/?activity&no-reopen`);
      await activityHost('Open Activity'); await modal.waitFor({ state: 'visible' }); await activitySettle();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();
      await activity.waitForFunction(() => { const image = document.querySelector('[data-cui-gallery-slide="dusk"] img'); return image.complete && image.naturalWidth > 0 && !image.getAnimations().some(animation => animation.playState === 'running'); });
      await modal.locator('[data-cui-gallery-slide="dusk"]').press('Enter');
      assert.equal(await modal.locator('[data-cui-gallery-slide="dusk"]').getAttribute('aria-pressed'), 'true');
      const idleRetained = await modal.elementHandle();
      await modal.evaluate(element => { element.dataset.closes = '0'; element.addEventListener('close', () => { element.dataset.closes = String(Number(element.dataset.closes) + 1); }); });
      await activityHost('Hide Activity');
      await activity.waitForFunction(() => Number(document.querySelector('[data-activity-host] dialog').dataset.closes) > 0);
      await activityHost('Show Activity');
      assert.equal(await idleRetained.evaluate(element => element === document.querySelector('[data-activity-host] dialog') && element.isConnected && !element.open), true, 'a passive reconnect retains the closed native dialog');
      assert.equal(await activity.locator('[data-activity-host] [aria-expanded="true"]').count(), 0, `a passive reconnect clears stale thumbnail expansion (${transitions})`);
      assert.equal(await modal.locator('[data-cui-gallery-slide="dusk"]').getAttribute('aria-pressed'), 'false', 'a passive reconnect also clears the former zoom state');
      assert.equal(await modal.locator('[data-cui-gallery-slide="dusk"]').getAttribute('aria-hidden'), 'false', 'a passive reconnect retains the selected item');
      assert.deepEqual(await changes(), [true], 'passive cleanup and reconnect do not notify the host of a dismissal');
      assert.equal(await activity.locator('[data-activity-selections]').textContent(), '["dusk"]');
      await activityHost('Reconnect Activity');
      assert.equal(await activity.locator('[data-activity-host] [aria-expanded="true"]').count(), 0, 'repeated passive reconnects remain closed');
      await activityHost('Open Activity'); await modal.waitFor({ state: 'visible' }); await activitySettle();
      const beforePassive = (await changes()).length, passiveCloses = await idleRetained.evaluate(element => Number(element.dataset.closes));
      await activityHost('Reconnect Activity');
      await activity.waitForFunction(closes => Number(document.querySelector('[data-activity-host] dialog').dataset.closes) > closes, passiveCloses);
      assert.equal(await idleRetained.evaluate(element => element.open), false, 'same-task passive reconnect keeps the native dialog closed');
      assert.equal(await activity.locator('[data-activity-host] [aria-expanded="true"]').count(), 0, 'same-task passive reconnect clears React expansion despite its queued close event');
      assert.deepEqual((await changes()).slice(beforePassive), [], 'same-task passive reconnect stays silent');
      await activityHost('Open Activity'); await modal.waitFor({ state: 'visible' }); await activitySettle();
      const beforeSynchronous = (await changes()).length, synchronousCloses = await idleRetained.evaluate(element => Number(element.dataset.closes));
      await activityHost('Reconnect and open Activity');
      await activity.waitForFunction(closes => Number(document.querySelector('[data-activity-host] dialog').dataset.closes) > closes, synchronousCloses);
      await modal.waitFor({ state: 'visible' }); await activitySettle();
      assert.equal(await activity.locator('[data-activity-host] [aria-expanded="true"]').count(), 1, 'a synchronous host reopen wins over reconnect state reset');
      assert.equal(await modal.locator('[data-cui-gallery-slide="dusk"]').getAttribute('aria-hidden'), 'false');
      assert.deepEqual((await changes()).slice(beforeSynchronous), [true], 'an old close event cannot cancel the synchronous host reopen');
      await modal.evaluate(element => element.close());
      await activity.waitForFunction(() => !document.querySelector('[data-activity-host] [aria-expanded="true"]'));
      assert.deepEqual((await changes()).slice(beforeSynchronous), [true, false], 'external dismissal remains observable after synchronous reopen');
      assert.deepEqual(activityErrors, []); await activity.close();
    }
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
    // A close event is queued after the native dialog has already closed. A host
    // can reopen in that gap; the previous request must not cancel the new one.
    await page.evaluate(() => { window.galleryTransitionAPI = document.startViewTransition; });
    for (const transitions of ['native', 'unavailable', 'throws']) {
      await page.evaluate(mode => {
        document.startViewTransition = mode === 'native' ? window.galleryTransitionAPI : mode === 'unavailable' ? undefined : () => { throw new Error('View Transition unavailable'); };
      }, transitions);
      for (let repeat = 0; repeat < 2; repeat++) {
        const before = JSON.parse(await page.locator('[data-changes]').textContent()).length;
        await open();
        await dialog.evaluate(element => {
          window.galleryReopen = { requested: false, delivered: false };
          const observer = new MutationObserver(() => {
            if (element.open) return;
            observer.disconnect(); window.galleryReopen.requested = true;
            [...document.querySelectorAll('button')].find(button => button.textContent === 'Open first').click();
          });
          observer.observe(element, { attributes: true, attributeFilter: ['open'] });
          element.addEventListener('close', () => { observer.disconnect(); window.galleryReopen.delivered = true; }, { once: true });
        });
        await host('Close first');
        await page.waitForFunction(() => window.galleryReopen.delivered);
        await settle();
        assert.equal(await page.evaluate(() => window.galleryReopen.requested), true);
        assert.equal(await dialog.isVisible(), true, `a queued internal close cannot cancel reopening (View Transition: ${transitions})`);
        assert.deepEqual(JSON.parse(await page.locator('[data-changes]').textContent()).slice(before), [true, false, true]);
        // Ignoring an internal event must not hide a later external native close,
        // including after repeated close/reopen cycles.
        await dialog.evaluate(element => element.close());
        await page.waitForFunction(() => document.querySelector('section[aria-label="First"] button').getAttribute('aria-expanded') === 'false');
        await settle();
        assert.deepEqual(JSON.parse(await page.locator('[data-changes]').textContent()).slice(before), [true, false, true, false]);
      }
    }
    // Dispose while an internally generated native close is still queued, then
    // verify the next instance still observes an external close exactly once.
    await page.evaluate(() => { document.startViewTransition = undefined; });
    await open();
    const beforeDispose = JSON.parse(await page.locator('[data-changes]').textContent()).length;
    await page.evaluate(() => {
      for (const name of ['Close first', 'Close first', 'Mount']) [...document.querySelectorAll('button')].find(button => button.textContent === name).click();
    });
    await first.waitFor({ state: 'detached' }); await host('Mount'); await open();
    await dialog.evaluate(element => element.close());
    await page.waitForFunction(() => document.querySelector('section[aria-label="First"] button').getAttribute('aria-expanded') === 'false');
    assert.deepEqual(JSON.parse(await page.locator('[data-changes]').textContent()).slice(beforeDispose), [false, true, false]);
    await page.evaluate(() => { document.startViewTransition = window.galleryTransitionAPI; });
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
}).catch(error => { console.error(error); process.exitCode = 1; });
