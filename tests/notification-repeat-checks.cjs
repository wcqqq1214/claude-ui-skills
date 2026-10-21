const assert = require('node:assert/strict');

async function testNotificationRepeat(page, base) {
  const errors = [], held = new Set();
  const onError = error => errors.push(error.message);
  const onConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', onError); page.on('console', onConsole);
  const stack = () => page.getByRole('region', { name: 'Stack', exact: true });
  const cards = () => stack().locator('[data-cui-notice]');
  const front = () => stack().locator('[data-cui-notice]:not([inert])');
  const repeat = () => page.getByRole('button', { name: 'Repeat', exact: true });
  const advanceTo = async time => {
    const remaining = time - await page.evaluate(() => Date.now());
    assert.ok(remaining >= 0, 'the notification clock never moves backwards');
    await page.clock.runFor(remaining);
  };
  const click = async () => {
    // Native button activation keeps host/protocol delays outside the authored
    // deadline. All geometry, pointer and focus checks still run on the main page.
    const time = await repeat().evaluate(element => { const time = Date.now(); element.click(); return time; });
    await page.clock.runFor(1);
    return time;
  };
  const prepare = async strict => {
    await page.goto(`${base}/tests/fixtures/react-micro/?strict=${strict}`);
    await repeat().waitFor(); await page.evaluate(() => document.fonts.ready); await page.clock.runFor(1);
    assert.equal(await cards().count(), 0, `${strict}: the isolated stack starts empty`);
  };
  const assertFront = async (id, count, context) => {
    assert.equal(await front().count(), 1, `${context}: one notification is usable`);
    assert.equal(await front().getAttribute('data-cui-notice'), id, `${context}: the current notification has the expected ID`);
    assert.equal(await front().getAttribute('data-ending'), null, `${context}: the current notification has not expired`);
    assert.equal(await front().getAttribute('aria-hidden'), 'false', `${context}: the current notification remains accessible`);
    assert.equal(await front().getAttribute('aria-live'), count > 2 ? 'off' : 'polite', `${context}: repeated announcements follow the authored count threshold`);
    const text = await front().textContent();
    assert.ok(text.includes('Repeated'), `${context}: the real fixture message is rendered`);
    if (count === 1) assert.equal(text.includes('×'), false, `${context}: a fresh notification starts at one`);
    else assert.ok(text.includes(`×${count}`), `${context}: the repeated notification renders count ${count}`);
  };
  const holdExit = async element => {
    // NotificationCard waits for its real animations. A paused, visually inert
    // animation holds that exit without changing CSS durations or relying on
    // whether the browser's CSS timeline follows the mocked JavaScript clock.
    const animation = await element.evaluateHandle(node => {
      const animation = node.animate([{ outlineOffset: '0px' }, { outlineOffset: '0px' }], { duration: 1 });
      animation.pause(); animation.currentTime = 0;
      return animation;
    });
    held.add(animation);
    assert.equal(await animation.evaluate(animation => animation.playState), 'paused', 'the test holds the actual card exit');
    return animation;
  };
  const release = async animation => { await animation.evaluate(animation => animation.finish()); held.delete(animation); await animation.dispose(); };
  try {
    await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
    for (const strict of ['off', 'on']) {
      await prepare(strict);
      const first = await click(), original = await front().elementHandle(), id = await front().getAttribute('data-cui-notice');
      await assertFront(id, 1, `${strict}/initial`);
      await advanceTo(first + 500); const second = await click();
      await assertFront(id, 2, `${strict}/first repeat`);
      await advanceTo(first + 600); const third = await click();
      await assertFront(id, 3, `${strict}/second repeat`);
      assert.equal(await front().evaluate((element, previous) => element === previous, original), true, `${strict}: repeats retain the same card DOM`);
      const exit = await holdExit(original);
      await advanceTo(first + 900);
      await assertFront(id, 3, `${strict}/original deadline`);
      await advanceTo(second + 900);
      await assertFront(id, 3, `${strict}/superseded deadline`);
      await advanceTo(third + 899);
      await assertFront(id, 3, `${strict}/latest deadline minus one`);
      await advanceTo(third + 900);
      assert.equal(await original.getAttribute('data-ending'), 'true', `${strict}: the latest repeat expires at its own exact deadline`);
      assert.equal(await original.getAttribute('inert'), '', `${strict}: an expired notice is inert during its exit`);
      assert.equal(await original.getAttribute('aria-hidden'), 'true', `${strict}: an expired notice is hidden from accessibility`);
      await release(exit);
      await cards().waitFor({ state: 'detached' }); await original.dispose();

      for (const offset of [900, 901]) {
        const context = `${strict}/repeat after expiry at ${offset}ms`;
        await prepare(strict);
        const first = await click(), old = await front().elementHandle(), oldId = await front().getAttribute('data-cui-notice');
        const exit = await holdExit(old);
        // Deliver the expiry task first. The contract reuses non-exiting
        // entries; merely passing wall time without delivering it is different.
        await advanceTo(first + offset);
        assert.equal(await old.getAttribute('data-ending'), 'true', `${context}: the expiry task has started the old exit`);
        assert.equal(await old.evaluate(element => element.isConnected), true, `${context}: the old exiting DOM is actually retained`);
        assert.equal(await old.getAttribute('inert'), '', `${context}: the retained old card cannot receive input`);
        assert.equal(await old.getAttribute('aria-hidden'), 'true', `${context}: the retained old card is not announced`);
        await click();
        const newId = await front().getAttribute('data-cui-notice');
        assert.notEqual(newId, oldId, `${context}: an exiting same-key notification is not reused`);
        await assertFront(newId, 1, context);
        assert.equal(await cards().count(), 2, `${context}: old exit and new notice coexist`);
        assert.equal(await old.evaluate(element => element.isConnected), true, `${context}: adding the new notice does not replace the old exit DOM`);
        await release(exit);
        await stack().locator(`[data-cui-notice="${oldId}"]`).waitFor({ state: 'detached' });
        await assertFront(newId, 1, `${context}/old exit completed`);
        assert.equal(await cards().count(), 1, `${context}: completing the old exit cannot remove the new notice`);
        await old.dispose();
      }

      await prepare(strict);
      const time = await click(), removedId = await front().getAttribute('data-cui-notice');
      await advanceTo(time + 900); await cards().waitFor({ state: 'detached' });
      await click();
      const newId = await front().getAttribute('data-cui-notice');
      assert.notEqual(newId, removedId, `${strict}: a repeat after complete removal gets a new ID`);
      await assertFront(newId, 1, `${strict}/repeat after complete removal`);
      assert.deepEqual(errors, [], `${strict}: notification boundary checks produce no browser errors`);
    }
  } finally {
    for (const animation of held) { await animation.evaluate(animation => animation.cancel()).catch(() => {}); await animation.dispose().catch(() => {}); }
    page.off('pageerror', onError); page.off('console', onConsole); await page.clock.resume();
  }
}

module.exports = { testNotificationRepeat };
