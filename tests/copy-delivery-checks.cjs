const assert = require('node:assert/strict');

async function testCopyDefaultCommit(page, base) {
  const errors = [];
  const pageError = error => errors.push(error.message);
  const consoleError = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', pageError); page.on('console', consoleError);
  const control = name => page.getByRole('button', { name, exact: true }).evaluate(element => element.click());
  const button = () => page.locator('#delivery-copy');
  const status = () => page.locator('[data-copy-host] [role="status"]');
  const results = () => page.locator('[data-copy-results]').evaluate(element => JSON.parse(element.textContent));
  try {
    // Keep real timers here. Advancing a mocked clock or using flushSync can
    // drain passive effects before the callback and mask this commit boundary.
    for (const strict of ['off', 'on']) for (const action of ['hide', 'unmount']) for (const outcome of ['resolve', 'reject']) {
      const context = `${strict}/${action}/${outcome}/default-commit`;
      await page.goto(`${base}/tests/fixtures/react-micro/copy-delivery.html?strict=${strict}`);
      await button().waitFor();
      await page.waitForFunction(() => window.copyDelivery.events.some(event => event.type === 'passive-connect'));
      assert.equal(await page.evaluate(() => window.isSecureContext), true, context);
      const original = await button().elementHandle(), oldStatus = await status().elementHandle();
      const instance = await page.locator('[data-copy-host]').getAttribute('data-instance');
      await button().evaluate(element => element.click());
      assert.equal(await page.evaluate(() => window.copyDelivery.requests.length), 1, `${context}: one asynchronous write is genuinely pending`);
      assert.equal(await status().textContent(), '', `${context}: no feedback precedes write completion`);
      await page.evaluate(({ action, outcome }) => window.copyDelivery.interruptDefault(action, outcome, 0), { action, outcome });
      await page.waitForFunction(() => {
        const trace = window.copyDelivery.events, start = trace.findIndex(event => event.type === 'default-interrupt');
        return start >= 0 && trace.slice(start).some(event => event.type === 'default-settle') && trace.slice(start).some(event => event.type === 'passive-disconnect');
      });
      const trace = await page.evaluate(() => window.copyDelivery.events);
      const interruption = trace.findIndex(event => event.type === 'default-interrupt');
      const settlement = trace.findIndex(event => event.type === 'default-settle');
      const settled = trace[settlement];
      assert.ok(interruption >= 0 && settlement > interruption, `${context}: the timer commits before the outside sibling settles the write`);
      assert.equal(trace.filter(event => event.type === 'default-settle').length, 1, `${context}: only one write settlement occurs`);
      assert.equal(String(settled.instance), instance);
      assert.equal(settled.connected, action === 'hide', `${context}: settlement observes retained or removed DOM after mutation`);
      assert.equal(settled.visible, false, `${context}: the old button is already invisible at settlement`);
      assert.ok(trace.slice(interruption, settlement).some(event => event.type === 'disconnect' && String(event.instance) === instance), `${context}: layout cleanup already disconnected the old instance`);
      assert.deepEqual(trace.filter(event => event.type === 'result'), [], `${context}: a write settled during disconnection cannot deliver an old callback`);
      assert.deepEqual(await results(), [], `${context}: the host stays silent`);
      if (action === 'hide') {
        assert.equal(await original.evaluate(element => element.isConnected), true, `${context}: Activity keeps the original button DOM`);
        assert.equal(await oldStatus.evaluate(element => element.isConnected), true, `${context}: Activity keeps the original status DOM`);
        await control('Show delivery Activity');
        assert.equal(await button().evaluate((element, previous) => element === previous, original), true, `${context}: reveal reconnects the retained instance`);
      } else {
        assert.equal(await original.evaluate(element => element.isConnected), false, `${context}: this is a true button unmount`);
        assert.equal(await oldStatus.evaluate(element => element.isConnected), false, `${context}: true unmount removes the live status region`);
        assert.equal(await oldStatus.textContent(), '', `${context}: the removed live region stays silent`);
        await control('Mount delivery copy');
        assert.equal(await button().evaluate((element, previous) => element === previous, original), false, `${context}: remount creates a fresh instance`);
      }
      assert.equal(await status().textContent(), '', `${context}: the obsolete write cannot publish feedback on reveal or remount`);
      assert.deepEqual(await results(), [], `${context}: reconnecting cannot replay its callback`);
      await button().evaluate(element => element.click());
      await page.evaluate(outcome => window.copyDelivery.settle(1, outcome), outcome);
      await page.waitForFunction(() => JSON.parse(document.querySelector('[data-copy-results]').textContent).length === 1);
      assert.deepEqual((await results()).map(result => result.copied), [outcome === 'resolve'], `${context}: a fresh normal copy still delivers once`);
      assert.equal(await status().textContent(), outcome === 'resolve' ? 'Delivery copied' : 'Delivery failed', `${context}: fresh success or failure feedback remains usable`);
      await original.dispose(); await oldStatus.dispose();
      assert.deepEqual(errors, [], context);
    }
  } finally {
    page.off('pageerror', pageError); page.off('console', consoleError);
  }
}

async function testCopyDelivery(page, base) {
  await testCopyDefaultCommit(page, base);
  const errors = [];
  const pageError = error => errors.push(error.message);
  const consoleError = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', pageError); page.on('console', consoleError);
  const control = name => page.getByRole('button', { name, exact: true }).evaluate(element => element.click());
  const button = () => page.locator('#delivery-copy');
  const status = () => page.locator('[data-copy-host] [role="status"]');
  const results = () => page.locator('[data-copy-results]').evaluate(element => JSON.parse(element.textContent));
  const events = () => page.evaluate(() => window.copyDelivery.events);
  // Two host turns allow both await continuations and their React updates to
  // settle without consuming any of the component's feedback timer.
  const drain = async () => { await page.evaluate(() => Promise.resolve()); await page.evaluate(() => Promise.resolve()); };
  const settle = async (index, outcome, interruption) => {
    await page.evaluate(({ index, outcome, interruption }) => window.copyDelivery.settle(index, outcome, interruption), { index, outcome, interruption });
    await drain();
  };
  const prepare = async strict => {
    await page.goto(`${base}/tests/fixtures/react-micro/copy-delivery.html?strict=${strict}`);
    await button().waitFor(); await drain();
    assert.equal(await page.evaluate(() => window.isSecureContext), true, 'the test exercises asynchronous navigator.clipboard writes');
    assert.deepEqual(await results(), []);
  };
  try {
    await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
    for (const strict of ['off', 'on']) for (const outcome of ['resolve', 'reject']) {
      await prepare(strict); await button().evaluate(element => element.click()); await settle(0, outcome);
      assert.deepEqual((await results()).map(result => result.copied), [outcome === 'resolve'], `${strict}/${outcome}: an uninterrupted initial copy delivers exactly once`);
      assert.equal(await status().textContent(), outcome === 'resolve' ? 'Delivery copied' : 'Delivery failed');
      await page.clock.runFor(1999); assert.equal(await status().textContent(), outcome === 'resolve' ? 'Delivery copied' : 'Delivery failed');
      await page.clock.runFor(1); assert.equal(await status().textContent(), outcome === 'resolve' ? '' : 'Delivery failed');
      assert.equal((await results()).length, 1, 'normal feedback expiry never repeats the host callback');
      for (const action of ['hide', 'reconnect', 'unmount', 'unmount-remount', 'pagehide', 'latest']) {
        const context = `${strict}/${outcome}/${action}`;
        await prepare(strict);
        const original = await button().elementHandle();
        const oldStatus = await status().elementHandle();
        const instance = await page.locator('[data-copy-host]').getAttribute('data-instance');
        await button().evaluate(element => element.click());
        assert.equal(await page.evaluate(() => window.copyDelivery.requests.length), 1, `${context}: the first write is pending`);
        assert.equal(await status().textContent(), '', `${context}: no feedback is published before write settlement`);
        await settle(0, outcome, action);
        const trace = await events(), start = trace.findIndex(event => event.type === 'settle'), interruption = trace.findIndex(event => event.type === 'interrupt-before');
        assert.ok(start >= 0 && interruption > start, `${context}: the interruption is queued after write settlement`);
        assert.ok(trace.some(event => event.type === 'interrupt-after' && event.action === action), `${context}: the interruption finishes before delivery is observed`);
        assert.deepEqual(trace.filter(event => event.type === 'result'), [], `${context}: an invalidated result cannot notify the host at the outer await boundary`);
        assert.deepEqual(await results(), [], `${context}: the host remains silent`);
        if (action === 'hide' || action === 'reconnect') {
          assert.ok(trace.some(event => event.type === 'hidden' && event.connected && !event.visible), `${context}: Activity really hides retained DOM`);
          assert.ok(trace.slice(interruption).some(event => event.type === 'disconnect' && String(event.instance) === instance), `${context}: the interrupted instance's effects disconnect`);
          if (action === 'hide') await control('Show delivery Activity');
          await drain();
          assert.equal(await button().evaluate((element, previous) => element === previous, original), true, `${context}: Activity reconnects the same button DOM`);
          await page.clock.runFor(2100); await drain();
          assert.deepEqual(await results(), [], `${context}: reconnecting cannot replay the old callback`);
        } else if (action === 'unmount' || action === 'unmount-remount') {
          assert.ok(trace.some(event => event.type === 'unmounted' && !event.connected), `${context}: the original button truly disconnects`);
          assert.equal(await original.evaluate(element => element.isConnected), false, `${context}: this is a real unmount, not hidden DOM`);
          assert.equal(await oldStatus.evaluate(element => element.isConnected), false, `${context}: real unmount also removes its live status region`);
          if (action === 'unmount') await control('Mount delivery copy');
          await drain();
          assert.equal(await button().evaluate((element, previous) => element === previous, original), false, `${context}: remount creates a new instance`);
          assert.equal(await status().textContent(), '', `${context}: a new mount starts idle`);
          await page.clock.runFor(2100); await drain();
          assert.deepEqual(await results(), [], `${context}: a new instance cannot deliver the old result`);
        } else if (action === 'pagehide') {
          assert.equal(await original.evaluate(element => element.isConnected), true, `${context}: pagehide invalidates a mounted consumer`);
          assert.equal(await status().textContent(), '', `${context}: page exit clears the feedback`);
          await page.clock.runFor(2100); await drain();
          assert.deepEqual(await results(), [], `${context}: the old page callback remains silent`);
        } else {
          assert.equal(await page.evaluate(() => window.copyDelivery.requests.length), 2, `${context}: the replacement write is genuinely still pending`);
          assert.equal(trace.find(event => event.type === 'interrupt-after').requests, 2);
          // The obsolete request has fully settled. The newer pending request
          // alone may publish a result once its independent write completes.
          await settle(1, 'resolve');
          assert.deepEqual((await results()).map(result => result.copied), [true], `${context}: only the latest request delivers once`);
          assert.equal(await status().textContent(), 'Delivery copied', `${context}: latest success has its normal feedback`);
          await page.clock.runFor(1999); assert.equal(await status().textContent(), 'Delivery copied', `${context}: success retains its two-second feedback duration`);
          await page.clock.runFor(1); assert.equal(await status().textContent(), '', `${context}: success expires at two seconds`);
        }
        // Every cancellation path leaves either the retained instance or its
        // fresh replacement usable. Failure is also a valid delivered result.
        const before = (await results()).length;
        await button().evaluate(element => element.click());
        const freshRequest = await page.evaluate(() => window.copyDelivery.requests.length - 1);
        await settle(freshRequest, outcome);
        assert.deepEqual((await results()).slice(before).map(result => result.copied), [outcome === 'resolve'], `${context}: a fresh normal copy delivers exactly once`);
        assert.equal(await status().textContent(), outcome === 'resolve' ? 'Delivery copied' : 'Delivery failed', `${context}: fresh success/failure feedback is preserved`);
        await page.clock.runFor(1999);
        assert.equal(await status().textContent(), outcome === 'resolve' ? 'Delivery copied' : 'Delivery failed', `${context}: normal feedback does not expire early`);
        await page.clock.runFor(1);
        assert.equal(await status().textContent(), outcome === 'resolve' ? '' : 'Delivery failed', `${context}: success expires while failure remains announced`);
        assert.equal((await results()).length, before + 1, `${context}: timers never redeliver a result`);
        await original.dispose(); await oldStatus.dispose();
        assert.deepEqual(errors, [], context);
      }
      // Settlement after cleanup must also remain silent, in addition to the
      // narrower delivery-boundary window above.
      await prepare(strict); await button().evaluate(element => element.click());
      await page.evaluate(() => window.copyDelivery.interrupt('unmount'));
      await settle(0, outcome); await page.clock.runFor(2100);
      assert.deepEqual(await results(), [], `${strict}/${outcome}: a write completing after a real unmount remains silent`);
      assert.deepEqual((await events()).filter(event => event.type === 'result'), []);
    }
    assert.deepEqual(errors, [], 'copy result lifecycle produces no browser errors or React warnings');
  } finally {
    page.off('pageerror', pageError); page.off('console', consoleError);
    await page.clock.resume();
  }
}

module.exports = { testCopyDelivery, testCopyDefaultCommit };
