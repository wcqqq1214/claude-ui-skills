const assert = require('node:assert/strict');

async function testPinnedActivityReconnect(page, base) {
  const errors = [], onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const state = () => page.locator('[data-pinned-state]').evaluate(element => JSON.parse(element.textContent));
  const focused = locator => locator.evaluate(element => element === document.activeElement);
  const menu = page.getByRole('menu', { name: 'Move pin', exact: true });
  // These controls model navigation rather than pointer input, which would
  // independently dismiss the menu before Activity disconnects it.
  const control = name => page.getByRole('button', { name, exact: true }).evaluate(element => element.click());
  async function open(kind) {
    const row = page.locator('[data-pin="b"]');
    if (kind === 'pointer') { await row.hover(); await row.locator('.cui-pinned-more').click(); }
    else { await row.locator('.cui-pinned-main').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); }
    await menu.waitFor();
    assert.equal(await menu.evaluate(element => element.contains(document.activeElement)), true, 'opening owns menu focus');
  }
  try {
    for (const strict of ['off', 'on']) for (const sync of ['off', 'on']) for (const kind of ['pointer', 'keyboard']) for (const timing of ['separate', 'same-task']) {
      const context = `${strict}/${sync}/${kind}/${timing}`;
      await page.goto(`${base}/tests/fixtures/react-workspace/pinned-activity.html?strict=${strict}&sync=${sync}`);
      const row = page.locator('[data-pin="b"]'), retained = await row.elementHandle(), outside = page.getByRole('textbox', { name: 'Outside draft', exact: true });
      await outside.fill('Retained outside draft'); await open(kind);
      if (timing === 'separate') {
        await control('Hide pins'); await frames();
        assert.equal(await retained.evaluate(element => element.isConnected && !element.getClientRects().length), true, `${context}: hidden Activity retains the row DOM`);
        assert.equal(await focused(outside), true, `${context}: hiding preserves the host's new focus`);
        await control('Show pins');
      } else await control('Reconnect pins');
      await frames();
      assert.equal(await row.evaluate((element, previous) => element === previous, retained), true, `${context}: reconnect uses the same row`);
      assert.equal(await menu.count(), 0, `${context}: reconnect cannot restore the dismissed menu`);
      assert.equal(await row.locator('.cui-pinned-more').getAttribute('aria-expanded'), 'false', `${context}: trigger no longer advertises an open menu`);
      assert.equal(await focused(outside), true, `${context}: reconnect cannot steal outside focus`);
      assert.equal(await outside.inputValue(), 'Retained outside draft');
      assert.deepEqual(await state(), { visible: true, active: true, order: ['a', 'b', 'c'], changes: [] }, `${context}: reconnect emits no order changes`);

      await open(kind); await page.keyboard.press('Escape');
      assert.equal(await menu.count(), 0); assert.equal(await focused(row.locator('.cui-pinned-more')), true, `${context}: fresh Escape still returns focus`);
      await open(kind); await outside.focus();
      assert.equal(await menu.count(), 0, `${context}: fresh menus still dismiss on external focus`);
      await open(kind); await menu.getByRole('menuitem', { name: 'Move down', exact: true }).click();
      assert.deepEqual((await state()).order, ['a', 'c', 'b'], `${context}: fresh menu actions still reorder`);
      assert.deepEqual((await state()).changes, [['a', 'c', 'b']], `${context}: fresh action emits exactly one change`);
      assert.equal(await focused(row.locator('.cui-pinned-main')), true, `${context}: fresh action restores row focus`);
      assert.deepEqual(errors, [], `${context}: no browser errors`);
      await retained.dispose();
    }
  } finally { page.off('pageerror', onError); }
}

async function testPinnedDragCancellation(page, base) {
  const errors = [], onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const state = () => page.locator('[data-pinned-state]').evaluate(element => JSON.parse(element.textContent));
  const status = () => page.locator('.cui-pinned-stage [role="status"]');
  const control = name => page.getByRole('button', { name, exact: true }).evaluate(element => element.click());
  const visit = async (strict, sync, seed) => {
    await page.goto(`${base}/tests/fixtures/react-workspace/pinned-activity.html?strict=${strict}&sync=${sync}`);
    assert.equal(await status().textContent(), 'Ready', 'mount does not announce cancellation, including StrictMode replay');
    if (seed === 'moved') {
      const row = page.locator('[data-pin="b"]'); await row.hover(); await row.locator('.cui-pinned-more').click();
      await page.getByRole('menuitem', { name: 'Move down', exact: true }).click();
      assert.equal(await status().textContent(), 'b moved to 3', 'establish an earlier move announcement');
    }
  };
  async function beginDrag(started = true) {
    const row = page.locator('[data-pin="b"]'), box = await row.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 13); await page.mouse.down();
    await page.mouse.move(box.x + (started ? 4 : 3) + 40, box.y + 13);
    if (started) {
      const list = await page.getByRole('list', { name: 'Pinned conversations', exact: true }).boundingBox();
      await page.mouse.move(box.x + 40, list.y + 2);
    }
    assert.equal(await page.locator('.cui-pinned-ghost').count(), started ? 1 : 0, 'only a real drag creates a preview');
    return row.elementHandle();
  }
  async function clean() {
    assert.equal(await page.locator('.cui-pinned-ghost').count(), 0, 'no decorative preview survives cancellation');
    assert.equal(await page.locator('[data-pin-dragging]').count(), 0, 'the dragging cursor and pointer lock are released');
    assert.equal(await page.locator('.cui-pinned-row[style*="visibility: hidden"]').count(), 0, 'the source row is visible again');
  }
  try {
    for (const strict of ['off', 'on']) for (const sync of ['off', 'on']) for (const timing of ['separate', 'same-task']) for (const seed of ['initial', 'moved']) {
      const context = `${strict}/${sync}/${timing}/${seed}`;
      await visit(strict, sync, seed); const before = await state(), oldMessage = await status().textContent(), retained = await beginDrag();
      if (timing === 'separate') {
        await control('Hide pins'); await frames();
        assert.equal(await retained.evaluate(element => element.isConnected && !element.getClientRects().length), true, `${context}: Activity retains hidden DOM`);
        assert.equal(await retained.evaluate(element => element.closest('.cui-pinned-stage').querySelector('[role="status"]').textContent), oldMessage, `${context}: hidden cleanup is silent`);
        // A retained cancellation is semantic state, not a captured translation.
        await control('Translate cancellation'); await control('Show pins');
      } else await control('Reconnect pins');
      await page.mouse.up(); await frames();
      assert.equal(await status().textContent(), timing === 'separate' ? 'Cancelled translated' : 'Cancelled', `${context}: reconnect announces the interrupted drag using current labels`);
      assert.equal(await page.locator('[data-pin="b"]').evaluate((element, previous) => element === previous, retained), true, `${context}: the same retained row reconnects`);
      assert.equal(await page.getByRole('textbox', { name: 'Outside draft', exact: true }).evaluate(element => element === document.activeElement), true, `${context}: cancellation does not steal host focus`);
      assert.deepEqual(await state(), before, `${context}: obsolete releases do not commit or notify a reorder`);
      await clean();
      // Normal menu interaction remains available after a cancelled drag.
      await page.locator('[data-pin="b"] .cui-pinned-main').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
      await page.getByRole('menu', { name: 'Move pin', exact: true }).waitFor(); await page.keyboard.press('Escape');
      await retained.dispose(); assert.deepEqual(errors, [], context);
    }
    for (const strict of ['off', 'on']) {
      await visit(strict, 'on', 'initial'); const beforeInactive = await state(); await beginDrag();
      await control('Hide pins'); await control('Show inactive pins'); await page.mouse.up(); await frames();
      assert.equal(await status().textContent(), 'Cancelled', 'a retained instance publishes its cancellation even if still inactive when shown');
      assert.deepEqual(await state(), { ...beforeInactive, active: false }, 'showing inactive does not commit the interrupted move'); await clean();
      await visit(strict, 'on', 'initial'); await beginDrag(false);
      await control('Reconnect pins'); await page.mouse.up(); await frames();
      assert.equal(await status().textContent(), 'Ready', 'a press below the drag threshold is not announced as cancelled'); await clean();
      await beginDrag(); await control('Deactivate pins'); await page.mouse.up();
      assert.equal(await status().textContent(), 'Cancelled', 'ordinary visible inactivity still announces immediately');
      await control('Hide pins'); await control('Show pins'); await clean();
      assert.equal(await status().textContent(), 'Cancelled', 'an already published cancellation is retained through reconnection');
      const beforeFresh = await state();
      await beginDrag(); await page.mouse.up(); await frames();
      assert.deepEqual((await state()).order, ['b', 'a', 'c'], 'a fresh drag can reorder after cancellation and reconnection');
      assert.equal((await state()).changes.length, beforeFresh.changes.length + 1, 'a fresh drag emits exactly one callback');
      assert.equal(await status().textContent(), 'b moved to 1', 'fresh movement replaces cancellation feedback');
      for (const unmount of ['Unmount pins', 'Hide and unmount pins']) for (const seed of ['initial', 'moved']) {
        await visit(strict, 'on', seed); const before = await state(), previous = await status().textContent(), oldStatus = await status().elementHandle();
        await oldStatus.evaluate(element => {
          window.pinAnnouncements = [];
          window.pinAnnouncementObserver = new MutationObserver(() => window.pinAnnouncements.push(element.textContent));
          window.pinAnnouncementObserver.observe(element, { childList: true, subtree: true, characterData: true });
        });
        await beginDrag(); await control(unmount); await page.mouse.up(); await frames();
        assert.equal(await oldStatus.evaluate(element => element.isConnected), false, 'this case truly unmounts the status DOM');
        assert.equal(await oldStatus.textContent(), previous, 'true unmount does not publish cancellation');
        assert.deepEqual(await page.evaluate(() => { window.pinAnnouncementObserver.disconnect(); return window.pinAnnouncements; }), [], 'true unmount remains silent');
        assert.deepEqual((await state()).changes, before.changes, 'true unmount cannot emit a late reorder'); await clean();
        await control('Mount pins');
        assert.equal(await status().textContent(), 'Ready', 'a fresh instance cannot replay the discarded cancellation');
        await oldStatus.dispose(); assert.deepEqual(errors, [], `${strict}/${unmount}/${seed}`);
      }
    }
  } finally { page.off('pageerror', onError); }
}

async function testPinnedDragFrames(page, base) {
  for (const strict of ['off', 'on']) for (const end of ['release', 'Escape', 'Hide pins', 'Unmount pins']) {
    await page.goto(`${base}/tests/fixtures/react-workspace/pinned-activity.html?strict=${strict}&sync=on`);
    const row = page.locator('[data-pin="b"]'), ghost = page.locator('.cui-pinned-ghost');
    const box = await row.boundingBox(), x = box.x + 40, y = box.y + 13;
    // Hold frame delivery to test bursts and cancellation in the same task.
    // This fixture has no other animation-frame owners; CSS motion stays native.
    await page.evaluate(() => {
      const request = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
      const pending = new Map(); let serial = 0;
      window.requestAnimationFrame = callback => { const id = ++serial; pending.set(id, callback); return id; };
      window.cancelAnimationFrame = id => pending.delete(id);
      window.pinFrameProbe = {
        pending,
        flush() {
          const batch = [...pending];
          for (const [id, callback] of batch) { pending.delete(id); callback(performance.now()); }
          return batch.length;
        },
        restore() { window.requestAnimationFrame = request; window.cancelAnimationFrame = cancel; delete window.pinFrameProbe; },
      };
    });
    try {
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 4, y);
      assert.equal(await ghost.evaluate(element => element.style.transform), `translate(${x + 4}px, ${y}px)`, 'crossing the threshold paints immediately');
      assert.equal(await page.evaluate(() => window.pinFrameProbe.pending.size), 0, 'a stationary drag has no animation frame queued');
      await row.evaluate((element, { x, y }) => {
        for (const offset of [5, 10, 15]) element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, buttons: 1, clientX: x + offset, clientY: y }));
      }, { x, y });
      assert.equal(await page.evaluate(() => window.pinFrameProbe.pending.size), 1, 'multiple moves before a frame coalesce');
      assert.equal(await page.evaluate(() => window.pinFrameProbe.flush()), 1);
      assert.equal(await ghost.evaluate(element => element.style.transform), `translate(${x + 15}px, ${y}px)`, 'the frame uses the latest pointer coordinates');
      assert.equal(await page.evaluate(() => window.pinFrameProbe.flush()), 0, 'painting does not queue another idle frame');
      await row.dispatchEvent('pointermove', { pointerId: 1, buttons: 1, clientX: x + 20, clientY: y });
      assert.equal(await page.evaluate(() => window.pinFrameProbe.pending.size), 1, 'movement after an idle frame schedules again');
      await ghost.evaluate(element => {
        window.pinFrameProbe.ghost = element;
        window.pinFrameProbe.before = element.style.transform;
        window.pinFrameProbe.stale = [...window.pinFrameProbe.pending.values()][0];
      });
      if (end === 'release') await page.mouse.up();
      else if (end === 'Escape') await page.keyboard.press('Escape');
      else await page.getByRole('button', { name: end, exact: true }).evaluate(element => element.click());
      assert.equal(await ghost.count(), 0, `${strict}/${end}: ending removes the preview`);
      assert.equal(await page.evaluate(() => window.pinFrameProbe.pending.size), 0, `${strict}/${end}: ending cancels the queued frame`);
      assert.equal(await page.evaluate(() => {
        const probe = window.pinFrameProbe;
        probe.stale(performance.now());
        return probe.ghost.style.transform === probe.before && probe.pending.size === 0;
      }), true, `${strict}/${end}: even a late frame cannot repaint or schedule work`);
    } finally {
      await page.mouse.up();
      await page.evaluate(() => window.pinFrameProbe.restore());
    }
  }
}

module.exports = { testPinnedActivityReconnect, testPinnedDragCancellation, testPinnedDragFrames };
