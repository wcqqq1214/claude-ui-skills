const assert = require('node:assert/strict');

const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const state = page => page.locator('[data-capture-state]').evaluate(element => JSON.parse(element.textContent));
const control = (page, name) => page.locator(`[data-capture-${name}]`).evaluate(element => element.click());
const focused = locator => locator.evaluate(element => element === document.activeElement);
async function visit(page, base, kind, strict, action, event = 'click') {
  await page.goto(`${base}/tests/fixtures/react-menus/capture-lifetimes.html?kind=${kind}&strict=${strict}&action=${action}&event=${event}`);
  await page.locator('[data-capture-owner]').waitFor();
  await page.getByRole('textbox', { name: 'Outside draft', exact: true }).fill('Retained draft');
}
async function assertInterrupted(page, retained, action, context) {
  await frames(page);
  const current = await state(page);
  assert.equal(current.entries, 1, `${context}: the visible event reached the armed capture handler`);
  assert.equal(current.armed, false);
  assert.deepEqual(current.changes, [], `${context}: the obsolete event emits no callback`);
  if (action === 'unmount') assert.equal(await retained.evaluate(element => element.isConnected), false, `${context}: the component really unmounted`);
  else if (action.startsWith('hide')) assert.equal(await retained.evaluate(element => element.isConnected && !element.getClientRects().length), true, `${context}: committed hidden Activity retains its DOM`);
  const outside = page.getByRole('textbox', { name: 'Outside draft', exact: true });
  assert.equal(await focused(outside), true, `${context}: the host owns outside focus after interruption`);
  assert.equal(await outside.inputValue(), 'Retained draft');
  await control(page, 'restore'); await frames(page);
  if (action !== 'unmount') assert.equal(await page.locator('[data-capture-owner]').evaluate((element, previous) => element === previous, retained), true, `${context}: a later reveal reconnects the same DOM`);
  assert.equal(await focused(outside), true, `${context}: reveal does not steal host focus`);
  assert.deepEqual((await state(page)).changes, [], `${context}: reconnect and true unmount stay silent`);
}

async function testSubmenuCaptureHide(page, base) {
  const errors = [], onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  try {
    for (const strict of ['off', 'on']) for (const action of ['hide', 'hide-inactive', 'inactive', 'unmount']) for (const interaction of ['trigger-click', 'trigger-down', 'trigger-up', 'owner-click', 'owner-right']) {
      const context = `submenu/${strict}/${action}/${interaction}`;
      await visit(page, base, 'submenu', strict, action, interaction.endsWith('click') ? 'click' : 'keydown');
      const retained = await page.locator('[data-capture-owner]').elementHandle(), trigger = page.getByRole('button', { name: 'Model settings', exact: false });
      if (interaction.startsWith('owner')) await trigger.click();
      await control(page, 'arm');
      if (interaction === 'trigger-click') await trigger.click();
      else if (interaction.startsWith('trigger')) await trigger.press(interaction === 'trigger-down' ? 'ArrowDown' : 'ArrowUp');
      else {
        const owner = page.getByRole('menu', { name: 'Model settings', exact: true }).getByRole('menuitem');
        if (interaction === 'owner-click') await owner.click(); else await owner.press('ArrowRight');
      }
      await assertInterrupted(page, retained, action, context);
      assert.equal(await page.getByRole('menu').count(), 0, `${context}: an obsolete open request never survives reconnection`);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert.deepEqual((await state(page)).previews, [], `${context}: the old request cannot deliver preview callbacks`);

      await trigger.press('ArrowDown');
      const owner = page.getByRole('menu', { name: 'Model settings', exact: true }).getByRole('menuitem');
      assert.equal(await focused(owner), true, `${context}: a fresh request still focuses the parent item`);
      await owner.press('ArrowRight');
      await page.getByRole('menuitemradio', { name: 'Low', exact: true }).click();
      assert.deepEqual((await state(page)).changes, ['low'], `${context}: fresh selection emits exactly once`);
      assert.equal(await focused(trigger), true, `${context}: fresh selection returns focus`);
      // A normal retained reconnect still dismisses an existing menu.
      await trigger.click(); await control(page, 'hide'); await frames(page); await control(page, 'restore'); await frames(page);
      assert.equal(await page.getByRole('menu').count(), 0);
      assert.equal(await focused(page.getByRole('textbox', { name: 'Outside draft', exact: true })), true);
      assert.deepEqual((await state(page)).changes, ['low']);
      await trigger.click(); await page.getByRole('menu', { name: 'Model settings', exact: true }).getByRole('menuitem').press('Escape');
      assert.equal(await focused(trigger), true, `${context}: fresh Escape preserves normal return focus`);
      assert.deepEqual(errors, [], context); await retained.dispose();
    }
  } finally { page.off('pageerror', onError); }
}

async function testPinnedCaptureHide(page, base) {
  const errors = [], onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const menu = page.getByRole('menu', { name: 'Move pin', exact: true });
  async function open(interaction) {
    const row = page.locator('[data-pin="b"]'), trigger = row.locator('.cui-pinned-more');
    if (interaction === 'pointer') { await row.hover(); await trigger.click(); }
    else await trigger.press('Enter');
  }
  try {
    for (const strict of ['off', 'on']) for (const action of ['hide', 'hide-inactive', 'inactive', 'unmount']) for (const interaction of ['pointer', 'keyboard-click', 'keyboard-capture']) {
      const context = `pinned/${strict}/${action}/${interaction}`;
      await visit(page, base, 'pinned', strict, action, interaction === 'keyboard-capture' ? 'keydown' : 'click');
      const retained = await page.locator('[data-capture-owner]').elementHandle();
      await control(page, 'arm'); await open(interaction);
      await assertInterrupted(page, retained, action, context);
      assert.equal(await menu.count(), 0, `${context}: an obsolete menu request never survives reconnection`);
      assert.equal(await page.locator('[data-pin="b"] .cui-pinned-more').getAttribute('aria-expanded'), 'false');
      assert.deepEqual((await state(page)).order, ['a', 'b', 'c']);
      assert.equal(await page.locator('.cui-pinned-stage [role="status"]').textContent(), 'Ready', `${context}: interruption does not invent drag feedback`);

      await open(interaction); await menu.waitFor(); await page.keyboard.press('Escape');
      assert.equal(await focused(page.locator('[data-pin="b"] .cui-pinned-more')), true, `${context}: fresh Escape returns focus`);
      await open(interaction); await menu.getByRole('menuitem', { name: 'Move down', exact: true }).click();
      assert.deepEqual((await state(page)).order, ['a', 'c', 'b'], `${context}: a fresh menu can reorder`);
      assert.deepEqual((await state(page)).changes, [['a', 'c', 'b']], `${context}: a fresh reorder emits once`);
      assert.equal(await focused(page.locator('[data-pin="b"] .cui-pinned-main')), true);
      await open(interaction); await control(page, 'hide'); await frames(page); await control(page, 'restore'); await frames(page);
      assert.equal(await menu.count(), 0, `${context}: normal Activity reconnect still closes menus`);
      assert.equal(await focused(page.getByRole('textbox', { name: 'Outside draft', exact: true })), true);
      assert.deepEqual((await state(page)).changes, [['a', 'c', 'b']]);
      assert.deepEqual(errors, [], context); await retained.dispose();
    }
  } finally { page.off('pageerror', onError); }
}

async function testPaneKeyboardHide(page, base) {
  const errors = [], onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  try {
    for (const strict of ['off', 'on']) for (const action of ['hide', 'hide-inactive', 'inactive', 'expanded', 'unmount']) for (const key of ['Enter', 'Space', 'Home', 'End', 'ArrowRight']) {
      const context = `pane/${strict}/${action}/${key}`;
      await visit(page, base, 'pane', strict, action, 'keydown');
      const retained = await page.locator('[data-capture-owner]').elementHandle(), handle = page.getByRole('separator', { name: 'Resize', exact: true });
      await handle.press('Shift+ArrowRight');
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), 276, `${context}: establish a nondefault retained width`);
      await control(page, 'arm'); await handle.press(key);
      await assertInterrupted(page, retained, action, context);
      const expected = action === 'unmount' ? 244 : 276;
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), expected, `${context}: obsolete keys cannot overwrite the chosen width`);
      await handle.press('ArrowRight');
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), expected + 8, `${context}: fresh arrows still resize`);
      await handle.press('Enter');
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), 244, `${context}: fresh Enter still resets`);
      await handle.press('Shift+ArrowRight'); await handle.press('Space');
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), 244, `${context}: fresh Space still resets`);
      assert.deepEqual((await state(page)).changes, [expected + 8, 244, 276, 244], `${context}: fresh requests emit once each`);
      // Retaining a completed width through an ordinary reconnect remains valid.
      await handle.press('Shift+ArrowRight'); await control(page, 'hide'); await frames(page); await control(page, 'restore'); await frames(page);
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), 276);
      assert.equal(await focused(page.getByRole('textbox', { name: 'Outside draft', exact: true })), true);
      assert.deepEqual((await state(page)).changes, [expected + 8, 244, 276, 244, 276]);
      assert.deepEqual(errors, [], context); await retained.dispose();
    }
  } finally { page.off('pageerror', onError); }
}

module.exports = { testSubmenuCaptureHide, testPinnedCaptureHide, testPaneKeyboardHide };
