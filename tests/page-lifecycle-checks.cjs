const assert = require('node:assert/strict');

const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const transition = (page, type) => page.evaluate(type => window.dispatchEvent(new PageTransitionEvent(type, { persisted: true })), type);
const documentVisible = (page, visible) => page.evaluate(visible => {
  if (visible) delete document.hidden;
  else Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, visible);

async function testReadingPageLifecycle(page, base) {
  const errors = [], onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  // Acquire the presentation timer under this clock, rather than replacing an
  // already-running native interval after the application mounts.
  await page.clock.install({ time: new Date() });
  const numbers = page.locator('[data-number-sample]');
  const value = async () => {
    const values = await numbers.allTextContents();
    assert.equal(values.length, 2);
    assert.equal(values[0], values[1], 'both digit columns share one frame');
    assert.match(values[0], /^00:[0-5][0-9]\.[0-9]{2}$/);
    const [, seconds, fraction] = /^00:([0-5][0-9])\.([0-9]{2})$/.exec(values[0]);
    return Number(seconds) * 100 + Number(fraction);
  };
  const advance = async (duration, expected, label) => {
    const before = await value();
    await page.clock.runFor(duration);
    assert.equal(await value(), (before + expected) % 6000, label);
  };
  const settle = async () => { await page.clock.runFor(100); await new Promise(resolve => setTimeout(resolve, 25)); };
  try {
    for (const strict of ['off', 'on']) {
      const label = `reading page lifecycle, StrictMode ${strict}`;
      await page.clock.resume();
      await page.goto(`${base}/tests/fixtures/react-reading/demo-reading.html?strict=${strict}`);
      await numbers.first().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('[data-number-sample="0"]')?.textContent !== '00:00.00');
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
      const retained = await numbers.first().elementHandle();
      await advance(150, 21, `${label}: one timer advances both columns`);
      await transition(page, 'pagehide');
      await documentVisible(page, true);
      assert.equal(await page.evaluate(() => document.hidden), false);
      await advance(250, 0, `${label}: pagehide stops independently of document.hidden and visibilitychange cannot restart it`);
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      });
      await advance(150, 0, `${label}: pageshow respects document.hidden before visibilitychange commits`);
      await transition(page, 'pagehide');
      await documentVisible(page, false);
      await advance(100, 0, `${label}: backgrounding a departed page remains paused`);
      await documentVisible(page, true);
      await advance(150, 0, `${label}: a visible effect reconnect cannot restart before pageshow`);
      await transition(page, 'pageshow'); await transition(page, 'pageshow');
      await advance(100, 14, `${label}: repeated pageshow resumes one timer at the same frame`);
      await advance(45000, 6300, `${label}: both columns retain their fixed format across the minute wrap`);

      await documentVisible(page, false);
      await advance(150, 0, `${label}: background document pauses`);
      await transition(page, 'pagehide'); await transition(page, 'pageshow');
      await advance(150, 0, `${label}: pageshow cannot override document visibility`);
      await documentVisible(page, true); await settle();
      await advance(100, 14, `${label}: visibility resumes without duplicate intervals`);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await settle();
      await advance(150, 0, `${label}: offscreen counters pause`);
      await transition(page, 'pagehide'); await transition(page, 'pageshow');
      await advance(150, 0, `${label}: pageshow cannot override intersection visibility`);
      await numbers.first().scrollIntoViewIfNeeded(); await settle();
      await advance(100, 14, `${label}: entering the viewport resumes one counter`);

      await page.locator('[data-inactive]').click();
      await advance(150, 0, `${label}: inactive chapter pauses`);
      await transition(page, 'pagehide'); await transition(page, 'pageshow');
      await advance(150, 0, `${label}: pageshow cannot override inactive`);
      await page.locator('[data-active]').click(); await settle();
      await advance(100, 14, `${label}: reactivation resumes`);
      await page.locator('[data-hide]').click();
      await advance(150, 0, `${label}: retained Activity is paused`);
      await page.locator('[data-outside]').focus();
      await page.locator('[data-show]').evaluate(element => element.click()); await settle();
      assert.equal(await retained.evaluate(element => element === document.querySelector('[data-number-sample="0"]')), true, `${label}: reconnect preserves the counter DOM`);
      assert.equal(await page.locator('[data-outside]').evaluate(element => element === document.activeElement), true, `${label}: reconnect preserves external focus`);
      await advance(100, 14, `${label}: Activity reconnect resumes one timer`);
      await transition(page, 'pagehide');
      await page.locator('[data-hide]').click();
      await transition(page, 'pageshow');
      await advance(150, 0, `${label}: pageshow while Activity is disconnected cannot run its counter`);
      await page.locator('[data-outside]').focus();
      await page.locator('[data-show]').evaluate(element => element.click()); await settle();
      assert.equal(await retained.evaluate(element => element === document.querySelector('[data-number-sample="0"]')), true, `${label}: reconnect after a missed pageshow retains the counter`);
      assert.equal(await page.locator('[data-outside]').evaluate(element => element === document.activeElement), true, `${label}: reconnect after pageshow preserves focus`);
      await advance(100, 14, `${label}: a live Activity reconnect recovers from a pageshow delivered while hidden`);
      await page.locator('[data-unmount]').click();
      const detached = await retained.evaluate(element => element.textContent);
      await transition(page, 'pagehide'); await transition(page, 'pageshow'); await page.clock.runFor(250);
      assert.equal(await retained.evaluate(element => element.textContent), detached, `${label}: true unmount stays silent after page events`);
      await retained.dispose();
      assert.deepEqual(errors, []);
    }
  } finally { page.removeListener('pageerror', onError); }
}

async function testWorkingPageLifecycle(page, base) {
  const errors = [], onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const image = page.locator('[data-working-mark] img');
  const playing = () => page.waitForFunction(() => document.querySelector('[data-working-mark] img')?.getAnimations()[0]?.playState === 'running');
  const paused = () => page.waitForFunction(() => document.querySelector('[data-working-mark] img')?.getAnimations()[0]?.playState === 'paused');
  const same = (animation, expected, label) => image.evaluate((element, animation) => element.getAnimations()[0] === animation, animation).then(value => assert.equal(value, expected, label));
  const load = async (strict, suffix = '') => {
    await page.goto(`${base}/tests/fixtures/react-reading/page-lifecycle.html?strict=${strict}${suffix}`, { waitUntil: 'domcontentloaded' });
  };
  try {
    for (const strict of ['off', 'on']) {
      const label = `working page lifecycle, StrictMode ${strict}`;
      await load(strict); await playing();
      const retained = await image.elementHandle();
      const old = await image.evaluateHandle(element => { const animation = element.getAnimations()[0]; animation.currentTime = 500; return animation; });
      await transition(page, 'pagehide');
      assert.equal(await old.evaluate(animation => animation.playState), 'idle', `${label}: pagehide cancels the old animation`);
      assert.equal(await image.evaluate(element => element.getAnimations().length), 0, `${label}: pagehide releases the animation`);
      await documentVisible(page, true); await frames(page);
      assert.equal(await image.evaluate(element => element.getAnimations().length), 0, `${label}: visibilitychange cannot restore a departed page's loop`);
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      });
      assert.equal(await image.evaluate(element => element.getAnimations().length), 0, `${label}: pageshow respects document.hidden before visibilitychange commits`);
      await documentVisible(page, false); await frames(page);
      await documentVisible(page, true); await playing();
      await same(old, false, `${label}: pageshow creates a fresh loop instead of restoring the previous phase`);
      const fresh = await image.evaluateHandle(element => element.getAnimations()[0]);
      await transition(page, 'pageshow');
      await same(fresh, true, `${label}: duplicate pageshow does not duplicate playback`);
      assert.equal(await image.evaluate(element => element.getAnimations().length), 1);

      await page.locator('[data-inactive]').click(); await paused();
      await same(fresh, true, `${label}: inactive retains its paused phase`);
      await fresh.evaluate(animation => { animation.currentTime = 333; });
      await page.locator('[data-active]').click(); await playing();
      await same(fresh, true, `${label}: activation resumes the same loop`);
      await documentVisible(page, false); await paused();
      await same(fresh, true, `${label}: backgrounding pauses without rebuilding`);
      await documentVisible(page, true); await playing();
      await same(fresh, true, `${label}: document visibility preserves phase ownership`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await paused();
      await same(fresh, true, `${label}: offscreen pauses the same loop`);
      await transition(page, 'pagehide'); await transition(page, 'pageshow'); await frames(page);
      assert.equal(await fresh.evaluate(animation => animation.playState), 'idle', `${label}: offscreen page exit cancels paused playback`);
      assert.equal(await image.evaluate(element => element.getAnimations().some(animation => animation.playState === 'running')), false, `${label}: pageshow cannot play offscreen`);
      await image.scrollIntoViewIfNeeded(); await playing();
      const beforeHide = await image.evaluateHandle(element => element.getAnimations()[0]);
      await page.locator('[data-hide]').click();
      assert.equal(await beforeHide.evaluate(animation => animation.playState), 'idle', `${label}: Activity disconnection cancels its owned loop`);
      await page.locator('[data-outside]').focus();
      await page.locator('[data-show]').evaluate(element => element.click()); await playing();
      assert.equal(await retained.evaluate(element => element === document.querySelector('[data-working-mark] img')), true, `${label}: Activity preserves ready artwork`);
      assert.equal(await page.locator('[data-working-fallback]').count(), 0, `${label}: reconnect does not flash a fallback`);
      assert.equal(await page.locator('[data-outside]').evaluate(element => element === document.activeElement), true, `${label}: reconnect preserves external focus`);
      const beforePageHide = await image.evaluateHandle(element => element.getAnimations()[0]);
      await transition(page, 'pagehide');
      await page.locator('[data-hide]').click(); await transition(page, 'pageshow');
      assert.equal(await beforePageHide.evaluate(animation => animation.playState), 'idle', `${label}: combined page and Activity hiding cancels the old loop`);
      assert.equal(await retained.evaluate(element => element.getAnimations().length), 0, `${label}: pageshow cannot animate disconnected Activity artwork`);
      await page.locator('[data-outside]').focus();
      await page.locator('[data-show]').evaluate(element => element.click()); await playing();
      assert.equal(await retained.evaluate(element => element === document.querySelector('[data-working-mark] img')), true, `${label}: reconnect after a missed pageshow retains ready artwork`);
      assert.equal(await page.locator('[data-outside]').evaluate(element => element === document.activeElement), true, `${label}: reconnect after pageshow preserves external focus`);
      assert.equal(await page.locator('[data-working-fallback]').count(), 0, `${label}: reconnect after a missed pageshow resumes without a fallback flash`);
      const beforeUnmount = await image.evaluateHandle(element => element.getAnimations()[0]);
      await page.locator('[data-unmount]').click();
      await transition(page, 'pagehide'); await transition(page, 'pageshow'); await frames(page);
      assert.equal(await beforeUnmount.evaluate(animation => animation.playState), 'idle', `${label}: true unmount cancels the loop`);
      assert.equal(await retained.evaluate(element => !element.isConnected && element.getAnimations().length === 0), true, `${label}: detached artwork stays silent after pageshow`);
      for (const handle of [old, fresh, beforeHide, beforePageHide, beforeUnmount, retained]) await handle.dispose();

      let release;
      const held = new Promise(resolve => { release = resolve; });
      const holdArtwork = async route => { await held; await route.continue(); };
      await page.route('**/default-loop*.webp', holdArtwork);
      try {
        await load(strict, '&pending');
        await page.locator('[data-working-fallback]').waitFor();
        await page.waitForFunction(() => document.querySelector('[data-working-mark] img')?.getAttribute('src')?.includes('default-loop'));
        const pending = await image.elementHandle();
        await page.locator('[data-hide]').click(); await page.locator('[data-show]').click();
        assert.equal(await pending.evaluate(element => element === document.querySelector('[data-working-mark] img')), true, `${label}: pending decode survives retained Activity reconnection`);
        assert.equal(await page.locator('[data-working-fallback]').isVisible(), true, `${label}: pending reconnection retains the fallback`);
        await pending.dispose();
        await transition(page, 'pagehide'); release();
        await image.evaluate(element => element.decode()); await frames(page);
        assert.equal(await image.evaluate(element => element.getAnimations().length), 0, `${label}: decode completing after pagehide cannot start stale playback`);
        await transition(page, 'pageshow'); await playing();
        assert.equal(await page.locator('[data-working-fallback]').count(), 0, `${label}: pageshow can use newly decoded artwork`);
      } finally { release(); await page.unroute('**/default-loop*.webp', holdArtwork); }

      let releaseUnmounted;
      const heldUnmounted = new Promise(resolve => { releaseUnmounted = resolve; });
      const holdUnmounted = async route => { await heldUnmounted; await route.continue(); };
      await page.route('**/default-loop*.webp', holdUnmounted);
      try {
        await load(strict, '&pending-unmount');
        await page.waitForFunction(() => document.querySelector('[data-working-mark] img')?.getAttribute('src')?.includes('default-loop'));
        const pending = await image.elementHandle();
        await page.locator('[data-unmount]').click(); releaseUnmounted();
        await pending.evaluate(element => element.decode().catch(() => {})); await frames(page);
        await transition(page, 'pageshow');
        assert.equal(await pending.evaluate(element => !element.isConnected && element.getAnimations().length === 0), true, `${label}: late decode after real unmount remains silent`);
        await pending.dispose();
        await page.locator('[data-mount]').click(); await playing();
      } finally { releaseUnmounted(); await page.unroute('**/default-loop*.webp', holdUnmounted); }

      const failArtwork = route => route.fulfill({ status: 200, contentType: 'image/webp', body: 'invalid sprite' });
      await page.route('**/default-loop*.webp', failArtwork);
      try {
        await load(strict, '&failed');
        await page.waitForFunction(() => document.querySelector('[data-working-mark]') && !document.querySelector('[data-working-mark] img'));
        await transition(page, 'pagehide'); await transition(page, 'pageshow'); await frames(page);
        assert.equal(await page.locator('[data-working-fallback]').isVisible(), true, `${label}: failed decode keeps its fallback across page events`);
      } finally { await page.unroute('**/default-loop*.webp', failArtwork); }
      assert.deepEqual(errors, []);
    }
  } finally { page.removeListener('pageerror', onError); }
}

module.exports = { testReadingPageLifecycle, testWorkingPageLifecycle };
