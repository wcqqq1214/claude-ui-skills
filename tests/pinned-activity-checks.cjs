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

module.exports = { testPinnedActivityReconnect };
