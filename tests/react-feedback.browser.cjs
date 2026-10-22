const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const { testStatusCommitDelivery } = require('./status-notice-lifecycle-checks.cjs');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  try {
    // Exercise the production controller with a deterministic animation clock.
    // These assertions preserve the original authored seam/entry/exit contract.
    const { createStatusPlayback } = await server.ssrLoadModule('/src/components/feedback/statusPlayback.ts');
    const originalImage = global.Image, originalSetTimeout = global.setTimeout, originalClearTimeout = global.clearTimeout;
    const timers = new Map(); let timerId = 0;
    global.Image = class { decode() { return Promise.resolve(); } };
    global.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, {fn, delay}); return id; };
    global.clearTimeout = id => timers.delete(id);
    try {
      const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
      function harness() {
        timers.clear(); const entries = [], animations = [], host = { dataset: {} }; let completed = 0;
        const strip = { style: {}, animate(_frames, timing) {
          let resolve, reject;
          const animation = { currentTime: 0, timing, finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
            cancel() { reject(Error('cancelled')); }, pause() {}, play() {}, end() { this.currentTime = timing.duration; resolve(); } };
          animations.push(animation); return animation;
        } };
        const mark = createStatusPlayback(host, strip, activity => entries.push(activity), () => completed++);
        mark.pause(false);
        const current = () => animations.at(-1), end = async () => { current().end(); await flush(); };
        return {mark, host, entries, current, end, completed: () => completed,
          start: async activity => { mark.start(activity); await flush(); await end(); await end(); },
          select: async activity => { mark.select(activity); await flush(); },
          fire: async () => { assert.equal(timers.size, 1); const [id, timer] = [...timers][0]; timers.delete(id); timer.fn(); await flush(); },
        };
      }
      {
        const h = harness(); h.mark.start('think'); h.mark.finish(); h.mark.dispose(); await flush();
        assert.equal(h.completed(), 0, 'StrictMode cleanup suppresses immediate completion from its probe mount');
        const live = harness(); live.mark.start('think'); live.mark.finish(); await flush();
        assert.equal(live.completed(), 1); live.mark.dispose();
        const ImageWithDecode = global.Image;
        global.Image = class { decode() { return Promise.reject(Error('missing artwork')); } };
        const failed = harness(); failed.mark.start('code'); await flush();
        assert.equal(failed.host.dataset.phase, 'dot');
        failed.mark.finish(); await flush(); assert.equal(failed.completed(), 1, 'failed decoding cannot strand completion');
        failed.mark.dispose(); global.Image = ImageWithDecode;
      }
      {
        const h = harness(); h.mark.start('think'); await flush();
        for (const [expected, time] of [['grow', 120], ['think-in', 200], ['think-loop', 800]]) {
          assert.equal(h.host.dataset.phase, expected); h.current().currentTime = time;
          h.mark.disconnect(); await flush();
          assert.equal(timers.size, 0, 'disconnected playback releases every wall-clock timer');
          h.mark.connect();
          assert.equal(h.host.dataset.phase, expected, 'reconnection restores each authored stage');
          assert.equal(h.current().currentTime, time, 'reconnection restores its exact animation time');
          if (expected !== 'think-loop') await h.end();
        }
        assert.deepEqual(h.entries, ['think'], 'restoring entry does not notify entry twice');
        await h.select('read'); assert.equal(timers.size, 1);
        h.mark.disconnect(); assert.equal(timers.size, 0); h.mark.connect();
        assert.equal(timers.size, 1, 'reconnection recomputes a pending seam from the retained loop time');
        h.mark.finish(); await h.end(); assert.equal(h.host.dataset.phase, 'think-out');
        h.current().currentTime = 100; h.mark.disconnect(); await flush(); h.mark.connect();
        assert.equal(h.host.dataset.phase, 'think-out'); assert.equal(h.current().currentTime, 100);
        await h.end(); assert.equal(h.completed(), 1);
        h.mark.disconnect(); h.mark.connect(); await flush(); assert.equal(h.completed(), 1);
        h.mark.dispose();
        const pendingCompletion = harness(); pendingCompletion.mark.start('code'); pendingCompletion.mark.finish();
        pendingCompletion.mark.disconnect(); await flush(); assert.equal(pendingCompletion.completed(), 0);
        pendingCompletion.mark.connect(); await flush(); assert.equal(pendingCompletion.completed(), 1, 'a completion interrupted by effect cleanup is delivered once on reconnect');
        pendingCompletion.mark.dispose();
      }
      for (const [activity, time, expected] of [
        ['think', 1749, 54 * 33.3333 - 1749], ['think', 1750, null],
        ['code', 1000, 37 * 33.3333 - 1000], ['code', 1900, null], ['read', 1000, null], ['write', 1000, null],
      ]) {
        const h = harness(); await h.start(activity); h.current().currentTime = time;
        await h.select(activity === 'read' ? 'write' : 'read');
        assert.equal(timers.size, expected === null ? 0 : 1);
        if (expected !== null) { assert.equal([...timers.values()][0].delay, expected); await h.fire(); }
        else await h.end();
        assert.equal(h.host.dataset.phase, activity + '-out');
        assert.deepEqual(h.entries, [activity]); h.mark.dispose(); await flush();
      }
      {
        const h = harness(); h.mark.start('code'); await flush(); await h.end();
        await h.select('read'); assert.equal(h.host.dataset.phase, 'code-in');
        await h.end(); assert.equal(h.host.dataset.phase, 'code-loop'); await h.fire();
        await h.select('write'); await h.select('think'); await h.end();
        assert.equal(h.host.dataset.phase, 'think-in'); assert.deepEqual(h.entries, ['code', 'think']);
        await h.end(); await h.select('code'); assert.equal(timers.size, 1);
        h.mark.pause(true); assert.equal(timers.size, 0, 'hidden mark cancels wall-clock seam');
        h.mark.pause(false); assert.equal(timers.size, 1, 'resume recomputes seam from animation time');
        await h.select('think'); assert.equal(timers.size, 0);
        h.mark.finish(); await h.end(); assert.equal(h.host.dataset.phase, 'think-out');
        await h.select('read'); await h.end(); assert.equal(h.host.dataset.phase, 'read-in'); assert.equal(h.completed(), 0);
        h.mark.finish(); await h.end(); await h.end(); assert.equal(h.host.dataset.phase, 'done'); assert.equal(h.completed(), 1);
        h.mark.start('code'); await flush(); const stale = h.current(); h.mark.start('write'); await flush(); stale.end(); await flush();
        assert.equal(h.host.dataset.phase, 'grow'); await h.end(); assert.equal(h.host.dataset.phase, 'write-in');
        h.mark.dispose(); await flush(); assert.equal(timers.size, 0);
      }
    } finally { global.Image = originalImage; global.setTimeout = originalSetTimeout; global.clearTimeout = originalClearTimeout; }

    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const commitPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await testStatusCommitDelivery(commitPage, base); await commitPage.close();
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${base}/tests/fixtures/react-feedback/?dynamic`);
    const dynamic = page.locator('[data-dynamic-skeleton]');
    const dynamicMask = dynamic.locator(':scope > div').first();
    const expectDynamicMask = async count => {
      await page.waitForFunction(count => {
        const group = document.querySelector('[data-dynamic-skeleton]'), mask = group.firstElementChild;
        const rows = [...group.querySelectorAll('[data-dynamic-row]')];
        if (rows.length !== count) return false;
        const box = group.getBoundingClientRect(), expected = document.createElement('div');
        expected.style.clipPath = rows.length ? `path("${rows.map(row => {
          const rect = row.getBoundingClientRect();
          return `M${rect.left - box.left},${rect.top - box.top}h${rect.width}v${rect.height}h${-rect.width}Z`;
        }).join(' ')}")` : '';
        return mask.style.clipPath === expected.style.clipPath && mask.style.visibility === (count ? 'visible' : 'hidden');
      }, count);
    };
    await expectDynamicMask(1);
    const retainedSkeleton = await dynamic.elementHandle();
    await page.getByRole('button', { name: 'Add row', exact: true }).click();
    await expectDynamicMask(2);
    assert.equal(await dynamic.evaluate(element => element.offsetHeight), 180, 'nested state adds rows without resizing the group or rerendering its parent');
    const oldRow = await dynamic.locator('[data-dynamic-row]').last().elementHandle();
    await page.getByRole('button', { name: 'Replace row', exact: true }).click();
    assert.equal(await oldRow.evaluate(element => element.isConnected), false, 'a row can be replaced without changing the group geometry');
    await page.getByRole('button', { name: 'Resize row', exact: true }).click(); await expectDynamicMask(2);
    await page.getByRole('button', { name: 'Move row', exact: true }).click(); await expectDynamicMask(2);
    await page.getByRole('button', { name: 'Reflow text', exact: true }).click(); await expectDynamicMask(2);
    await page.getByRole('button', { name: 'Hide skeleton', exact: true }).click();
    await dynamic.locator('[data-dynamic-row]').last().evaluate(element => { element.style.width = '173px'; });
    await page.getByRole('button', { name: 'Show skeleton', exact: true }).click(); await expectDynamicMask(2);
    await page.getByRole('button', { name: 'Reconnect skeleton', exact: true }).click(); await expectDynamicMask(2);
    assert.equal(await retainedSkeleton.evaluate(element => element === document.querySelector('[data-dynamic-skeleton]')), true, 'Activity reconnect retains the group DOM and remeasures current descendants');
    await page.getByRole('button', { name: 'Remove row', exact: true }).click(); await expectDynamicMask(1);
    await page.getByRole('button', { name: 'Remove row', exact: true }).click(); await expectDynamicMask(0);
    await page.getByRole('button', { name: 'Add row', exact: true }).click(); await expectDynamicMask(1);
    const disconnectedMask = await dynamicMask.evaluate(element => element.style.clipPath);
    await page.getByRole('button', { name: 'Mount skeleton', exact: true }).click();
    await retainedSkeleton.evaluate(element => { const row = document.createElement('div'); row.dataset.cuiSkeletonLine = ''; element.append(row); });
    await page.waitForTimeout(50);
    assert.equal(await retainedSkeleton.evaluate(element => element.firstElementChild.style.clipPath), disconnectedMask, 'unmount disconnects mutation and resize observers');
    await oldRow.dispose(); await retainedSkeleton.dispose();

    const working = await browser.newPage({ viewport: { width: 800, height: 600 } });
    working.on('pageerror', error => errors.push(error.message));
    let releaseArtwork;
    const artwork = new Promise(resolve => { releaseArtwork = resolve; });
    await working.route('**/default-loop.webp', async route => { await artwork; await route.continue(); });
    try {
      await working.goto(`${base}/tests/fixtures/react-feedback/?working`, { waitUntil: 'domcontentloaded' });
      const direct = working.locator('[data-working-mark]'), fallback = working.locator('[data-working-fallback]');
      await fallback.waitFor();
      await working.waitForFunction(() => document.querySelector('[data-working-mark] img')?.getAttribute('src')?.includes('default-loop.webp'));
      assert.equal(await direct.locator('img').evaluate(image => image.naturalWidth), 0, 'the actual artwork request remains pending');
      assert.equal(await direct.locator('img').isVisible(), false, 'undecoded artwork cannot obscure its pending fallback');
      const follower = working.getByRole('region', { name: 'Working content', exact: true });
      await follower.evaluate(element => { element.scrollTop = 0; element.dispatchEvent(new Event('scroll')); });
      const returnButton = working.getByRole('button', { name: 'Return to latest', exact: true });
      await returnButton.waitFor();
      await working.waitForFunction(() => {
        const button = document.querySelector('.cui-return-button');
        return button.getAttribute('aria-hidden') === 'false' && Number(getComputedStyle(button).opacity) > .99;
      });
      const returnMark = returnButton.locator(':scope > span').last();
      assert.equal(await returnMark.evaluate(element => getComputedStyle(element).opacity), '1', 'the pending fallback layer is opaque');
      assert.equal(await returnMark.locator('[data-glyph="ArrowDown"]').isVisible(), true, 'a visible busy return button retains its arrow until artwork is ready');
      const retainedImage = await direct.locator('img').elementHandle();
      await working.getByRole('button', { name: 'Hide working', exact: true }).click();
      await working.getByRole('button', { name: 'Show working', exact: true }).click();
      await fallback.waitFor();
      assert.equal(await retainedImage.evaluate(image => image === document.querySelector('[data-working-mark] img')), true, 'pending decode survives an Activity reconnect on the retained image');
      releaseArtwork();
      await working.waitForFunction(() => [...document.querySelectorAll('main img')].every(image => image.getAnimations().length === 1));
      assert.equal(await fallback.count(), 0);
      assert.equal(await returnMark.locator('[data-glyph="ArrowDown"]').count(), 0, 'decoded artwork replaces the return arrow fallback');
      assert.equal(await direct.locator('img').isVisible(), true);
      assert.ok(await retainedImage.evaluate(image => image.naturalWidth > 0));
      const beforeHide = await direct.locator('img').evaluateHandle(image => image.getAnimations()[0]);
      await working.getByRole('button', { name: 'Hide working', exact: true }).click();
      assert.equal(await beforeHide.evaluate(animation => animation.playState), 'idle');
      await working.getByRole('button', { name: 'Show working', exact: true }).click();
      await working.waitForFunction(() => document.querySelector('[data-working-mark] img').getAnimations()[0]?.playState === 'running');
      assert.equal(await fallback.count(), 0, 'ready artwork does not flash its fallback on reconnect');
      const beforeUnmount = await direct.locator('img').evaluateHandle(image => image.getAnimations()[0]);
      await working.getByRole('button', { name: 'Mount working', exact: true }).click();
      assert.equal(await beforeUnmount.evaluate(animation => animation.playState), 'idle', 'unmount still cancels decoded playback');
      await retainedImage.dispose(); await beforeHide.dispose(); await beforeUnmount.dispose();
    } finally { releaseArtwork(); await working.close(); }
    const pendingUnmount = await browser.newPage();
    pendingUnmount.on('pageerror', error => errors.push(error.message));
    let releaseUnmountedArtwork;
    const unmountedArtwork = new Promise(resolve => { releaseUnmountedArtwork = resolve; });
    await pendingUnmount.route('**/default-loop.webp', async route => { await unmountedArtwork; await route.continue(); });
    try {
      await pendingUnmount.goto(`${base}/tests/fixtures/react-feedback/?working`, { waitUntil: 'domcontentloaded' });
      await pendingUnmount.waitForFunction(() => document.querySelector('[data-working-mark] img')?.getAttribute('src')?.includes('default-loop.webp'));
      const detached = await pendingUnmount.locator('[data-working-mark] img').elementHandle();
      await pendingUnmount.getByRole('button', { name: 'Mount working', exact: true }).click();
      releaseUnmountedArtwork();
      assert.equal(await detached.evaluate(async image => { await image.decode().catch(() => {}); return image.isConnected || image.getAnimations().length > 0; }), false, 'decode completion after unmount cannot attach or animate stale artwork');
      await pendingUnmount.getByRole('button', { name: 'Mount working', exact: true }).click();
      await pendingUnmount.waitForFunction(() => document.querySelector('[data-working-mark] img')?.getAnimations().length === 1);
      assert.equal(await pendingUnmount.locator('[data-working-fallback]').count(), 0, 'a new mount can decode after an interrupted pending request');
      await detached.dispose();
    } finally { releaseUnmountedArtwork(); await pendingUnmount.close(); }
    const failedWorking = await browser.newPage();
    failedWorking.on('pageerror', error => errors.push(error.message));
    await failedWorking.route('**/default-loop.webp', route => route.abort());
    await failedWorking.goto(`${base}/tests/fixtures/react-feedback/?working`);
    await failedWorking.waitForFunction(() => document.querySelector('[data-working-mark]') && !document.querySelector('[data-working-mark] img'));
    assert.equal(await failedWorking.locator('[data-working-fallback]').isVisible(), true, 'decode failure retains the same fallback');
    await failedWorking.close();

    await page.goto(`${base}/tests/fixtures/react-feedback/?activity`);
    const status = page.locator('.cui-status-mark');
    const statusPhase = value => page.waitForFunction(value => document.querySelector('.cui-status-mark').dataset.phase === value, value);
    const statusAction = name => page.getByRole('button', { name, exact: true }).click();
    await statusPhase('think-loop');
    const retainedStatus = await status.elementHandle();
    await statusAction('Pause Status');
    await page.waitForFunction(() => document.querySelector('.cui-status-mark > span').getAnimations()[0].playState === 'paused');
    await status.evaluate(element => { element.firstElementChild.getAnimations()[0].currentTime = 800; });
    await statusAction('Hide Status');
    assert.equal(await retainedStatus.evaluate(element => element.isConnected), true, 'Activity retains the original status DOM');
    await page.waitForTimeout(100); await statusAction('Show Status');
    assert.equal(await status.getAttribute('data-phase'), 'think-loop', 'Activity reconnect retains the authored phase without replaying the growing dot');
    assert.equal(await status.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime), 800, 'Activity reconnect restores the paused frame');
    assert.equal(await page.locator('[data-status-entered]').textContent(), '1', 'reconnecting an entered phase does not enter it twice');
    await statusAction('Pause Status');
    await page.waitForFunction(() => document.querySelector('.cui-status-mark > span').getAnimations()[0].currentTime > 800);
    await statusAction('Finish Status');
    await page.waitForFunction(() => {
      const mark = document.querySelector('.cui-status-mark');
      for (const animation of mark.firstElementChild.getAnimations()) animation.finish();
      return mark.dataset.phase === 'done';
    });
    assert.equal(await page.locator('[data-status-completed]').textContent(), '1');
    await statusAction('Hide Status'); await page.waitForTimeout(100); await statusAction('Show Status');
    await statusAction('Reconnect Status'); await page.waitForTimeout(100);
    assert.equal(await status.getAttribute('data-phase'), 'done', 'completed status remains completed after separate-task and same-task reconnects');
    assert.equal(await page.locator('[data-status-completed]').textContent(), '1', 'reconnect never repeats onComplete');
    await statusAction('Hide Status'); await statusAction('Replay Status'); await statusAction('Show Status');
    await statusPhase('grow'); await statusPhase('think-loop');
    assert.equal(await page.locator('[data-status-entered]').textContent(), '2', 'an explicit Replay while hidden still starts a fresh run');
    assert.equal(await retainedStatus.evaluate(element => element === document.querySelector('.cui-status-mark')), true, 'Replay also retains the same DOM');
    await statusAction('Finish Status'); await statusAction('Mount Status'); await page.waitForTimeout(150);
    assert.equal(await page.locator('[data-status-completed]').textContent(), '1', 'unmount cancels pending playback without a later completion');
    await retainedStatus.dispose();
    await page.goto(`${base}/tests/fixtures/react-feedback/?activity&finished`);
    await page.waitForFunction(() => document.querySelector('[data-status-completed]').textContent === '1');
    await statusAction('Reconnect Status'); await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-status-completed]').textContent(), '1', 'StrictMode immediate completion notifies once across reconnect');
    await page.goto(`${base}/tests/fixtures/react-feedback/`);
    const mark = page.locator('.cui-status-mark');
    const phase = value => page.waitForFunction(value => document.querySelector('.cui-status-mark').dataset.phase === value, value);
    await phase('think-loop');
    assert.equal(await page.locator('#entered').textContent(), 'think');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForTimeout(80);
    const pausedTime = await mark.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime);
    await page.waitForTimeout(100);
    assert.equal(await mark.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime), pausedTime);
    await page.getByRole('button', { name: 'code', exact: true }).click();
    assert.equal(await page.locator('#entered').textContent(), 'think');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await phase('code-in'); assert.equal(await page.locator('#entered').textContent(), 'code');
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await phase('done'); assert.equal(await page.locator('#completed').textContent(), '1');
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await phase('code-loop');
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await page.waitForTimeout(100); await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await phase('grow'); assert.equal(await page.locator('#completed').textContent(), '1');
    const trigger = page.getByRole('button', { name: 'Details', exact: true });
    const region = page.getByRole('region', { name: 'Details', exact: true });
    await trigger.focus(); await trigger.press('Enter'); await region.waitFor();
    await region.getByRole('textbox').fill('retained');
    await region.getByRole('button', { name: 'Close from inside' }).click();
    assert.equal(await trigger.evaluate(element => element === document.activeElement), true, 'collapse returns focus from the panel');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await trigger.press('Space');
    assert.equal(await region.getByRole('textbox').inputValue(), 'retained');
    assert.equal(await page.getByRole('button', { name: 'Other details' }).getAttribute('aria-expanded'), 'false');
    const mask = page.locator('.cui-skeleton > div').first();
    const oldMask = await mask.evaluate(element => element.style.clipPath);
    assert.ok(oldMask.includes('300'), 'shared sweep covers the measured row');
    await page.getByRole('button', { name: 'Resize' }).click();
    await page.waitForFunction(() => document.querySelector('.cui-skeleton > div').style.clipPath.includes('200'));
    assert.notEqual(await mask.evaluate(element => element.style.clipPath), oldMask);
    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    assert.equal(await page.locator('[data-cui-skeleton-line]').first().evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(255, 255, 255, 0.075)');

    // Hold only the demo's skeleton timer; sprite playback and other timers stay native.
    const deadlines = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    deadlines.on('pageerror', error => errors.push(error.message));
    await deadlines.addInitScript(() => {
      const schedule = window.setTimeout.bind(window), cancel = window.clearTimeout.bind(window);
      let serial = 0;
      window.feedbackTimers = [];
      window.setTimeout = (callback, delay, ...args) => {
        if (delay !== 500 || !new Error().stack.includes('/demo/chapters/FeedbackChapter.tsx')) return schedule(callback, delay, ...args);
        const timer = { id: --serial, cancelled: false, fired: false,
          fire() { if (!this.cancelled && !this.fired) { this.fired = true; callback(...args); } } };
        window.feedbackTimers.push(timer); return timer.id;
      };
      window.clearTimeout = id => {
        const timer = window.feedbackTimers.find(timer => timer.id === id);
        if (timer) timer.cancelled = true; else cancel(id);
      };
    });
    const pendingDeadline = async () => {
      await deadlines.waitForFunction(() => window.feedbackTimers.some(timer => !timer.cancelled && !timer.fired));
      return deadlines.evaluate(() => window.feedbackTimers.find(timer => !timer.cancelled && !timer.fired).id);
    };
    const wasCancelled = id => deadlines.evaluate(id => window.feedbackTimers.find(timer => timer.id === id).cancelled, id);
    const finishPlayback = () => deadlines.waitForFunction(() => {
      const mark = document.querySelector('.demo-waiting-card .cui-status-mark');
      for (const animation of mark.firstElementChild.getAnimations()) animation.finish();
      return mark.dataset.phase === 'done';
    });
    await deadlines.goto(`${base}/demo/?lang=en#feedback`);
    const firstDeadline = await pendingDeadline();
    await chooseChapter(deadlines, 'controls');
    assert.equal(await wasCancelled(firstDeadline), true, 'hidden chapters cancel the pending skeleton');
    await chooseChapter(deadlines, 'feedback');
    const beforeOffscreen = await pendingDeadline();
    await deadlines.locator('.demo-waiting-card').evaluate(element => { element.style.transform = 'translateY(200vh)'; });
    await deadlines.waitForFunction(id => window.feedbackTimers.find(timer => timer.id === id).cancelled, beforeOffscreen);
    await deadlines.locator('.demo-waiting-card').evaluate(element => { element.style.transform = ''; });
    const beforeHidden = await pendingDeadline();
    await deadlines.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await deadlines.waitForFunction(id => window.feedbackTimers.find(timer => timer.id === id).cancelled, beforeHidden);
    await deadlines.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    const originalDeadline = await pendingDeadline();
    await deadlines.waitForFunction(() => document.querySelector('.demo-waiting-card .cui-status-mark > span').getAnimations().length > 0);
    await deadlines.locator('.demo-waiting-card .cui-status-mark > span').evaluate(element => element.getAnimations().forEach(animation => animation.pause()));
    await deadlines.getByRole('button', { name: 'Finish', exact: true }).click();
    assert.equal(await pendingDeadline(), originalDeadline, 'Finish preserves the original 500ms deadline');
    assert.equal(await wasCancelled(originalDeadline), false);
    await deadlines.evaluate(id => window.feedbackTimers.find(timer => timer.id === id).fire(), originalDeadline);
    await deadlines.getByLabel('Loading content', { exact: true }).waitFor();
    await finishPlayback();
    await deadlines.getByRole('button', { name: 'Replay', exact: true }).waitFor();
    assert.equal(await deadlines.getByLabel('Loading content', { exact: true }).count(), 0, 'completion removes loading content');
    await deadlines.getByRole('button', { name: 'Replay', exact: true }).click();
    const replayDeadline = await pendingDeadline();
    assert.notEqual(replayDeadline, originalDeadline, 'Replay starts a fresh skeleton deadline');
    await deadlines.waitForFunction(() => document.querySelector('.demo-waiting-card .cui-status-mark > span').getAnimations().length > 0);
    await deadlines.locator('.demo-waiting-card .cui-status-mark > span').evaluate(element => element.getAnimations().forEach(animation => animation.pause()));
    await deadlines.getByRole('button', { name: 'Finish', exact: true }).click(); await finishPlayback();
    await deadlines.getByRole('button', { name: 'Replay', exact: true }).waitFor();
    assert.equal(await wasCancelled(replayDeadline), true, 'completion cancels a still-pending skeleton');
    await deadlines.evaluate(id => window.feedbackTimers.find(timer => timer.id === id).fire(), replayDeadline);
    assert.equal(await deadlines.getByLabel('Loading content', { exact: true }).count(), 0, 'a cancelled deadline cannot insert loading content');
    await deadlines.close();

    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/demo/?lang=en#feedback`);
      await setTheme(page, theme);
      await page.getByRole('button', { name: '3 design observations collected Expand to see the process' }).click();
      await page.getByRole('region', { name: '3 design observations collected Expand to see the process' }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${theme} no page overflow`);
      await setLanguage(page, 'zh-Hans');
      assert.equal(await page.getByRole('button', { name: '已整理 3 项设计观察 展开查看过程' }).getAttribute('aria-expanded'), 'true', 'locale preserves disclosure');
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`${base}/demo/?lang=en#feedback`); await phase('think-loop');
    await chooseChapter(page, 'type');
    await page.waitForTimeout(100);
    const hiddenTime = await mark.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime);
    await page.waitForTimeout(150);
    assert.equal(await mark.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime), hiddenTime, 'hidden chapter pauses authored motion');
    assert.deepEqual(errors, []);
    console.log('React feedback: dynamic nested skeleton geometry/observers, pending/failed WorkingMark and return-arrow fallback, retained-DOM reconnect, authored seams, phase/frame/completion, hidden Replay, latest handoff, completion/replay, pause, StrictMode, disclosure focus and responsive bilingual demo passed');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
