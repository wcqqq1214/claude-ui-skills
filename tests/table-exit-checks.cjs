const assert = require('node:assert/strict');

async function testTableExitLifecycle(page, base) {
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  try {
    for (const strict of ['off', 'on']) {
      const label = `table exit, StrictMode ${strict}`;
      const reset = async () => {
        await page.goto(`${base}/tests/fixtures/react-reading/table-exit.html?strict=${strict}`);
        await page.getByRole('button', { name: 'Expand lifecycle table', exact: true }).waitFor();
        await page.evaluate(() => document.fonts.ready);
        await frames();
      };
      const dialog = page.locator('[data-table-host] dialog');
      const expand = page.getByRole('button', { name: 'Expand lifecycle table', exact: true });
      const outside = page.locator('[data-outside]');
      const open = async () => {
        await expand.click();
        await page.waitForFunction(() => document.querySelector('[data-table-host] dialog').open);
        await dialog.evaluate(async element => {
          void element.offsetHeight;
          const animations = element.getAnimations();
          animations.forEach(animation => animation.finish());
          await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
        });
        await frames();
      };
      const pauseNextExit = async () => dialog.evaluate(element => {
        element.dataset.closeEvents = '0';
        element.addEventListener('close', () => { element.dataset.closeEvents = String(Number(element.dataset.closeEvents) + 1); });
        const observer = new MutationObserver(() => {
          if (element.open) return;
          observer.disconnect();
          // Layout starts the real discrete display/overlay exit before the
          // queued native close event commits React's closed state.
          void element.offsetHeight;
          element.exitAnimations = element.getAnimations();
          element.exitAnimations.forEach(animation => { animation.pause(); animation.currentTime = 80; });
          element.dataset.pausedExit = String(element.exitAnimations.length);
        });
        observer.observe(element, { attributes: true, attributeFilter: ['open'] });
      });
      const exitArrived = async () => {
        await page.waitForFunction(() => Number(document.querySelector('[data-table-host] dialog').dataset.closeEvents) > 0);
        await frames();
      };
      const finishExit = async retained => {
        await retained.evaluate(element => element.exitAnimations.forEach(animation => { if (animation.playState !== 'idle') animation.finish(); }));
        await frames();
      };

      await reset(); await open();
      await pauseNextExit();
      await dialog.evaluate(element => { element.close(); document.querySelector('[data-outside]').focus(); });
      await exitArrived();
      assert.equal(await outside.evaluate(element => element === document.activeElement), true, `${label}: queued close preserves newer external focus`);
      const externallyClosed = await dialog.elementHandle();
      await finishExit(externallyClosed);
      assert.equal(await outside.evaluate(element => element === document.activeElement), true, `${label}: exit completion preserves newer external focus`);

      await reset(); await open();
      const retainedDialog = await dialog.elementHandle(), retainedTable = await dialog.locator('table').elementHandle();
      const height = await dialog.evaluate(element => element.offsetHeight);
      await pauseNextExit();
      await page.getByRole('button', { name: 'Close lifecycle table', exact: true }).click();
      await exitArrived();
      const fading = await dialog.evaluate(element => ({ open: element.open, animations: Number(element.dataset.pausedExit), display: getComputedStyle(element).display, opacity: Number(getComputedStyle(element).opacity), height: element.offsetHeight }));
      assert.ok(fading.animations > 0 && fading.display !== 'none' && fading.opacity > 0 && fading.opacity < 1 && !fading.open, `${label}: inspect an actual paused CSS close transition: ${JSON.stringify(fading)}`);
      assert.equal(await retainedTable.evaluate(element => element.isConnected && element === document.querySelector('[data-table-host] dialog table')), true, `${label}: fading dialog retains the original expanded table DOM`);
      assert.equal(fading.height, height, `${label}: fading dialog retains its complete height`);
      assert.equal(await expand.evaluate(element => element === document.activeElement), true, `${label}: ordinary close uses native trigger focus return`);
      await finishExit(retainedDialog);
      await page.waitForFunction(() => !document.querySelector('[data-table-host] dialog table'));
      assert.equal(await dialog.evaluate(element => getComputedStyle(element).display), 'none', `${label}: expanded content is released once the exit finishes`);

      await open();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('[data-table-host] dialog table'));
      assert.equal(await expand.evaluate(element => element === document.activeElement), true, `${label}: Escape still returns native focus to the trigger`);

      await open(); await pauseNextExit();
      const reopenedTable = await dialog.locator('table').elementHandle();
      await dialog.evaluate(element => element.close());
      await exitArrived();
      await expand.click(); await frames();
      assert.equal(await dialog.evaluate(element => element.open && element.matches(':modal')), true, `${label}: reopening during the fade acquires the native modal`);
      await finishExit(retainedDialog);
      assert.equal(await dialog.evaluate(element => element.open && element.matches(':modal')), true, `${label}: the previous exit completion cannot close the reopened dialog`);
      assert.equal(await reopenedTable.evaluate(element => element.isConnected && element === document.querySelector('[data-table-host] dialog table')), true, `${label}: reopening reuses the retained content instead of clearing it`);

      await reset(); await open();
      const sameTaskDialog = await dialog.elementHandle();
      await sameTaskDialog.evaluate(element => {
        element.dataset.closeEvents = '0';
        element.addEventListener('close', () => { element.dataset.closeEvents = String(Number(element.dataset.closeEvents) + 1); });
        element.close();
        document.querySelector('.cui-table-expand').click();
      });
      await page.waitForFunction(() => Number(document.querySelector('[data-table-host] dialog').dataset.closeEvents) > 0);
      await frames();
      assert.equal(await dialog.evaluate(element => element.open && element.matches(':modal')), true, `${label}: a fresh same-task expansion survives the previous queued close`);
      assert.equal(await dialog.locator('table').count(), 1);

      await reset(); await open();
      const activityDialog = await dialog.elementHandle(), activityTable = await dialog.locator('table').elementHandle();
      await page.locator('[data-hide]').evaluate(button => { button.click(); document.querySelector('[data-outside]').focus(); });
      assert.equal(await activityDialog.evaluate(element => element.isConnected && !element.open && !element.matches(':modal')), true, `${label}: hidden Activity retains DOM and releases the native modal`);
      assert.equal(await outside.evaluate(element => element === document.activeElement), true);
      await frames();
      await page.locator('[data-show]').evaluate(button => button.click()); await frames();
      assert.equal(await activityDialog.evaluate(element => element === document.querySelector('[data-table-host] dialog') && element.open && element.matches(':modal')), true, `${label}: Activity reconnect restores the retained open request`);
      assert.equal(await activityTable.evaluate(element => element === document.querySelector('[data-table-host] dialog table')), true, `${label}: Activity reconnect retains expanded content`);
      await page.locator('[data-reconnect]').evaluate(button => button.click()); await frames();
      assert.equal(await activityDialog.evaluate(element => element.open && element.matches(':modal') && element.contains(document.activeElement)), true, `${label}: old Activity close events cannot cancel a same-task reconnect`);
      const nativeFocus = await dialog.evaluateHandle(element => { element.close(); return document.activeElement; });
      assert.equal(await nativeFocus.evaluate(element => element instanceof HTMLElement && element.isConnected && element.matches('button, input') && !element.closest('dialog')), true, `${label}: native close restores a valid external focus target after Activity reconnect`);
      await page.waitForFunction(() => !document.querySelector('[data-table-host] dialog table'));
      assert.equal(await nativeFocus.evaluate(element => element === document.activeElement), true, `${label}: queued close and fade preserve native focus restoration after Activity reconnect`);
      await nativeFocus.dispose();

      await open();
      await page.locator('[data-reconnect]').evaluate(button => button.click()); await frames();
      await dialog.evaluate(element => { element.close(); document.querySelector('[data-outside]').focus(); });
      await page.waitForFunction(() => !document.querySelector('[data-table-host] dialog table'));
      assert.equal(await outside.evaluate(element => element === document.activeElement), true, `${label}: a newer external focus request survives queued close and fade after Activity reconnect`);

      for (const immediate of [false, true]) {
        await reset(); await open();
        const dismissed = await dialog.elementHandle();
        await dismissed.evaluate((element, immediate) => {
          element.dataset.closeEvents = '0';
          element.addEventListener('close', () => { element.dataset.closeEvents = String(Number(element.dataset.closeEvents) + 1); });
          element.close(); document.querySelector('[data-hide]').click(); document.querySelector('[data-outside]').focus();
          if (immediate) document.querySelector('[data-show]').click();
        }, immediate);
        await page.waitForFunction(() => Number(document.querySelector('[data-table-host] dialog').dataset.closeEvents) > 0);
        if (!immediate) await page.locator('[data-show]').evaluate(button => button.click());
        await frames();
        assert.equal(await dismissed.evaluate(element => element.isConnected && !element.open && !element.matches(':modal')), true, `${label}: external close before hiding stays dismissed after ${immediate ? 'same-task' : 'later'} show`);
        assert.equal(await dialog.locator('table').count(), 0);
        assert.equal(await outside.evaluate(element => element === document.activeElement), true, `${label}: a dismissed Activity table preserves external focus`);
      }

      await reset(); await open();
      await page.locator('[data-inactive]').evaluate(button => { button.click(); document.querySelector('[data-outside]').focus(); });
      await frames();
      assert.equal(await dialog.evaluate(element => element.open || element.matches(':modal')), false, `${label}: deactivation releases the native modal`);
      assert.equal(await dialog.locator('table').count(), 0, `${label}: deactivation releases expanded content`);
      await page.locator('[data-active]').evaluate(button => button.click()); await frames();
      assert.equal(await dialog.evaluate(element => element.open), false, `${label}: reactivation does not revive a dismissed request`);
      assert.equal(await outside.evaluate(element => element === document.activeElement), true);

      await reset(); await open(); await pauseNextExit();
      const unmounted = await dialog.elementHandle();
      await dialog.evaluate(element => element.close()); await exitArrived();
      await page.locator('[data-unmount]').evaluate(button => { button.click(); document.querySelector('[data-outside]').focus(); });
      await finishExit(unmounted);
      assert.equal(await unmounted.evaluate(element => element.isConnected), false, `${label}: true unmount disconnects the retained table`);
      assert.equal(await outside.evaluate(element => element === document.activeElement), true, `${label}: old exit completion after unmount is silent`);
      assert.deepEqual(errors, [], `${label}: no lifecycle errors`);
    }
  } finally { page.removeListener('pageerror', onError); }
}

module.exports = { testTableExitLifecycle };
