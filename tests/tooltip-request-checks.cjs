const assert = require('node:assert/strict');

async function testTooltipRequests(page, base) {
  const errors = [];
  const pageError = error => errors.push(error.message);
  const consoleError = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', pageError); page.on('console', consoleError);
  const click = async name => { await page.getByRole('button', { name, exact: true }).evaluate(element => element.click()); await page.clock.runFor(1); };
  const open = () => page.locator('[role="tooltip"]').getAttribute('data-open');
  const prepare = async query => {
    await page.mouse.move(10, 10);
    await page.goto(`${base}/tests/fixtures/react-micro/tooltip-requests.html?${query}`);
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.clock.runFor(100);
  };
  try {
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
  for (const strict of ['off', 'on']) {
    for (const kind of ['focus', 'pointer']) for (const content of ['jsx', 'string']) {
      await prepare(`strict=${strict}${content === 'string' ? '&string' : ''}`);
      await click('Toggle unrelated updates');
      const target = page.getByRole('button', { name: 'Tooltip request target', exact: true });
      if (kind === 'focus') await target.focus();
      else await target.hover();
      await page.clock.runFor(299);
      assert.equal(await open(), 'false', `${strict}/${kind}/${content} retains the default 300ms delay`);
      await page.clock.runFor(1);
      assert.equal(await open(), 'true', `${strict}/${kind}/${content} unrelated JSX renders do not cancel or restart the request`);
      await page.clock.runFor(500);
      assert.equal(await open(), 'true', `${strict}/${kind}/${content} unrelated JSX renders preserve the visible tooltip`);
      assert.ok(Number(await page.locator('[data-revision]').textContent()) >= 16, 'the host really rerendered every 50ms');
      assert.equal(await page.locator('[data-overflow-changes]').textContent(), '1', 'a stateful measurement callback is notified only when truncation changes');
      await target.press('Escape'); await page.clock.runFor(400);
      assert.equal(await open(), 'false', 'host updates cannot undo Escape dismissal');
      await page.getByRole('button', { name: 'Outside focus', exact: true }).focus();
      if (kind === 'pointer') await page.mouse.move(10, 10);
      if (kind === 'focus') await target.focus();
      else await target.hover();
      await page.clock.runFor(300);
      assert.equal(await open(), 'true', 'fresh engagement rearms an Escape-dismissed tooltip');
      if (kind === 'focus') await page.getByRole('button', { name: 'Outside focus', exact: true }).focus();
      else await page.mouse.move(10, 10);
      await page.clock.runFor(1);
      assert.equal(await open(), 'false', 'leaving the trigger still closes an open tooltip');
    }
    for (const focus of ['auto', 'parent', 'child', 'ref']) {
      // Time is frozen before navigation: focus occurs during React's first
      // commit, ahead of fonts.ready, initial observers and passive effects.
      await page.mouse.move(10, 10);
      await page.goto(`${base}/tests/fixtures/react-micro/tooltip-requests.html?strict=${strict}&focus=${focus}`);
      assert.equal(await page.locator('#request-target').evaluate(element => document.activeElement === element), true, `${strict}/${focus} actually focuses on the first commit`);
      assert.equal(await open(), 'false');
      await page.clock.runFor(299);
      assert.equal(await open(), 'false', `${strict}/${focus} initial focus retains the default delay`);
      await page.clock.runFor(1);
      assert.equal(await open(), 'true', `${strict}/${focus} initial focus survives initialization and StrictMode effect replay`);
      await click('Toggle tooltip active'); await page.clock.runFor(400);
      assert.equal(await open(), 'false', 'inactive suppresses a tooltip without moving host focus');
      await click('Toggle tooltip active'); await page.getByRole('button', { name: 'Outside focus', exact: true }).focus();
      await page.locator('#request-target').focus(); await page.clock.runFor(100);
      await click('Toggle tooltip Activity'); await page.getByRole('button', { name: 'Outside focus', exact: true }).focus();
      await page.clock.runFor(400); await click('Toggle tooltip Activity'); await page.clock.runFor(400);
      // Child layout/ref consumers intentionally issue a fresh focus request
      // on reconnection. Manual/auto/parent have no such connection request.
      if (focus === 'auto' || focus === 'parent') assert.equal(await open(), 'false', 'a disconnected pending request cannot return after Activity reconnection');
      else {
        const focused = await page.locator('#request-target').evaluate(element => document.activeElement === element);
        assert.equal(await open(), 'true', `${strict}/${focus} a fresh child layout/ref focus request opens after Activity reconnection (nativeFocus=${focused})`);
      }
      await click('Toggle tooltip mount'); await page.clock.runFor(400);
      assert.equal(await page.locator('[role="tooltip"]').count(), 0, 'real unmount removes the tooltip and cancels its request');
    }
    await prepare(`strict=${strict}&overflow`);
    const target = page.locator('#request-target');
    await target.focus(); await page.clock.runFor(300); assert.equal(await open(), 'true');
    await click('Resize tooltip trigger'); await page.clock.runFor(50); assert.equal(await open(), 'false', 'overflow geometry changes still dismiss and remeasure');
    await page.getByRole('button', { name: 'Outside focus', exact: true }).focus(); await target.focus(); await page.clock.runFor(300); assert.equal(await open(), 'false', 'a fitting overflow-only label cannot open');
    await click('Resize tooltip trigger'); await page.clock.runFor(50);
    await page.getByRole('button', { name: 'Outside focus', exact: true }).focus(); await target.focus(); await page.clock.runFor(300); assert.equal(await open(), 'true');
    await click('Change tooltip label'); await page.clock.runFor(50); assert.equal(await open(), 'false', 'overflow trigger text changes still dismiss and remeasure');
    assert.equal(await page.locator('[data-overflow-changes]').textContent(), '4', 'overflow callbacks report changes without a JSX rerender loop');
    await prepare(`strict=${strict}`);
    await click('Resize tooltip trigger'); await page.clock.runFor(50);
    await page.locator('#request-target').focus(); await page.clock.runFor(300); assert.equal(await open(), 'true', 'an ordinary tooltip may describe a fitting label');
    await click('Toggle overflow mode'); await page.clock.runFor(400); assert.equal(await open(), 'false', 'enabling overflow-only dismisses an open tooltip whose label fits');
    await click('Toggle overflow mode'); await page.clock.runFor(400); assert.equal(await open(), 'false', 'changing modes does not automatically reopen a focused tooltip');
    await page.getByRole('button', { name: 'Outside focus', exact: true }).focus(); await page.locator('#request-target').focus(); await page.clock.runFor(100);
    await click('Toggle overflow mode'); await page.clock.runFor(400); assert.equal(await open(), 'false', 'enabling overflow-only also cancels a pending ordinary request');
    for (const kind of ['pointer', 'focus']) {
      await prepare(`strict=${strict}`);
      const target = page.locator('#request-target');
      if (kind === 'focus') await target.focus(); else await target.hover();
      await page.clock.runFor(100); await click('Toggle tooltip Activity');
      await page.clock.runFor(400); await click('Toggle tooltip Activity'); await page.clock.runFor(400);
      assert.equal(await open(), 'false', `${kind} pending work is cancelled by Activity disconnection even without outside focus`);
      if (kind === 'focus') {
        await page.getByRole('button', { name: 'Outside focus', exact: true }).focus(); await target.focus();
      } else { await page.mouse.move(10, 10); await target.hover(); }
      await page.clock.runFor(300); assert.equal(await open(), 'true', 'a new engagement still works after Activity reconnection');
    }
    for (const focus of ['child', 'ref']) for (const change of ['Change tooltip label', 'Resize tooltip trigger']) {
      await prepare(`strict=${strict}&focus=${focus}`);
      await page.clock.runFor(300); assert.equal(await open(), 'true');
      const original = await page.locator('#request-target').elementHandle();
      await click('Toggle tooltip Activity');
      await page.getByRole('button', { name: 'Outside focus', exact: true }).focus();
      await click(change); await page.clock.runFor(100);
      await click('Toggle tooltip Activity');
      assert.equal(await page.locator('#request-target').evaluate((element, previous) => element === previous, original), true, 'the changed trigger retains its DOM through Activity');
      await page.clock.runFor(298); assert.equal(await open(), 'false', 'a fresh reconnect focus retains the default delay');
      await page.clock.runFor(1); assert.equal(await open(), 'true', `${strict}/${focus}/${change} measurement establishes the new connection without swallowing its fresh focus`);
    }
    for (const content of ['jsx', 'string']) for (const phase of ['pending', 'open']) {
      await prepare(`strict=${strict}${content === 'string' ? '&string' : ''}`);
      const target = page.locator('#request-target');
      await target.focus(); await page.clock.runFor(phase === 'pending' ? 100 : 300);
      assert.equal(await open(), phase === 'open' ? 'true' : 'false');
      await click('Change tooltip explanation'); await page.clock.runFor(400);
      assert.equal(await open(), 'false', `${strict}/${content}/${phase} real explanation changes still cancel the previous hint`);
      assert.equal(await page.locator('[role="tooltip"]').textContent(), 'Updated explanation');
      await page.getByRole('button', { name: 'Outside focus', exact: true }).focus(); await target.focus(); await page.clock.runFor(300);
      assert.equal(await open(), 'true', 'fresh engagement opens the updated explanation');
    }
  }
  assert.deepEqual(errors, [], 'tooltip requests do not produce runtime errors or React warnings');
  } finally {
    page.removeListener('pageerror', pageError); page.removeListener('console', consoleError);
    await page.clock.resume();
  }
}

module.exports = { testTooltipRequests };
