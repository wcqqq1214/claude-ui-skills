const assert = require('node:assert/strict');

async function testMenuCallbackLifecycle(page, base) {
  const errors = [], onError = error => errors.push(error.message), onConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', onError); page.on('console', onConsole);
  const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  const focused = locator => locator.evaluate(element => element === document.activeElement);
  const state = () => page.locator('[data-callback-state]').evaluate(element => JSON.parse(element.textContent));
  try {
    for (const strict of ['off', 'on']) for (const kind of ['artifact', 'submenu']) for (const controlled of kind === 'submenu' ? ['off', 'on'] : ['off']) for (const mode of ['inactive', 'reactivate', 'unmount', 'reconnect', 'reopen', 'pagehide', 'normal']) {
      const label = `${strict}/${kind}/${controlled}/${mode}`;
      await page.goto(`${base}/tests/fixtures/react-menus/callback.html?strict=${strict}&kind=${kind}&controlled=${controlled}&mode=${mode}`);
      const region = page.locator('[data-callback-region]'), outside = page.getByRole('textbox', { name: 'Outside callback input', exact: true });
      const trigger = region.getByRole('button', { name: kind === 'artifact' ? 'Callback Artifact actions' : 'Callback model settings', exact: true });
      async function open() {
        await trigger.click();
        if (kind === 'submenu') await region.getByRole('menuitem', { name: /Callback thinking effort/ }).press('ArrowRight');
        await frames();
      }
      async function select(keyboard = false) {
        const choice = kind === 'artifact' ? region.getByRole('menuitem', { name: 'Choose callback action', exact: true }) : region.getByRole('menuitemradio', { name: 'Low', exact: true });
        if (keyboard) { await choice.focus(); await page.keyboard.press('Enter'); }
        else await choice.click();
        await frames();
      }
      await outside.fill('Host draft remains'); await open();
      const retained = await trigger.elementHandle();
      await trigger.evaluate(element => {
        window.callbackTriggerFocuses = 0;
        element.addEventListener('focus', () => { window.callbackTriggerFocuses++; });
      });
      await select();
      const expected = kind === 'artifact' ? 'action' : 'low', result = await state();
      assert.equal(result.active, mode !== 'inactive', `${label}: the callback commits the intended active state`);
      assert.equal(result.mounted, mode !== 'unmount', `${label}: the callback commits the intended mount state`);
      assert.equal(result.visible, true, `${label}: any Activity disconnection completes its visible reconnection`);
      assert.deepEqual(result.changes, [expected], `${label}: the explicit selection is delivered exactly once`);
      assert.equal(result.selected, expected, `${label}: selection is committed before host lifecycle work`);
      assert.equal(await outside.inputValue(), 'Host draft remains', `${label}: host draft is preserved`);
      if (mode === 'reopen') {
        assert.equal(await trigger.getAttribute('aria-expanded'), 'true', `${label}: old selection cannot close the new menu opened by its callback`);
        const selected = kind === 'artifact' ? region.getByRole('menuitem', { name: 'Choose callback action', exact: true }) : region.getByRole('menuitemradio', { name: 'Low', exact: true });
        assert.equal(await focused(selected), true, `${label}: new interaction retains its own focus`);
        if (kind === 'submenu') assert.equal(await selected.getAttribute('aria-checked'), 'true', `${label}: reopened menu retains controlled or local selection`);
      } else {
        assert.equal(await region.getByRole('menu').count(), 0, `${label}: the selected menu is closed`);
        assert.equal(await focused(mode === 'normal' ? trigger : outside), true, `${label}: only a live normal selection restores trigger focus`);
        assert.equal(await page.evaluate(() => window.callbackTriggerFocuses), mode === 'normal' ? 1 : 0, `${label}: invalidated or unmounted selections do not emit obsolete focus`);
      }
      if (mode === 'unmount') assert.equal(await retained.evaluate(element => element.isConnected), false, `${label}: the selected instance really unmounts`);
      else assert.equal(await trigger.evaluate((element, previous) => element === previous, retained), true, `${label}: retained reconnect keeps the trigger DOM`);
      await retained.dispose();

      // A new explicit interaction works after each cancellation. Reopened
      // menus first dismiss normally, then all cases select using the keyboard.
      await outside.focus();
      await page.locator('[data-callback-reset]').evaluate(element => element.click());
      await open(); await select(true);
      assert.deepEqual((await state()).changes, [expected, expected], `${label}: a fresh selection still delivers once`);
      assert.equal(await region.getByRole('menu').count(), 0, `${label}: fresh normal selection closes`);
      assert.equal(await focused(trigger), true, `${label}: fresh normal selection restores focus`);
      assert.deepEqual(errors, [], `${label}: no browser errors`);
    }
  } finally { page.off('pageerror', onError); page.off('console', onConsole); }
}

module.exports = { testMenuCallbackLifecycle };
