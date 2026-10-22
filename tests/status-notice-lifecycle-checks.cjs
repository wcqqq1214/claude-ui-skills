const assert = require('node:assert/strict');

async function testStatusCommitDelivery(page, base) {
  const errors = [], onError = error => errors.push(error.message), onConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', onError); page.on('console', onConsole);
  await page.addInitScript(() => {
    if (!location.pathname.endsWith('/commit-delivery.html')) return;
    const animate = Element.prototype.animate;
    // Hold real sprite animations at their initial frame. Only the fixture's
    // external layout effect releases the interrupted finished Promise.
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args), play = animation.play.bind(animation);
      animation.pause(); animation.currentTime = 0;
      animation.play = () => { play(); animation.pause(); };
      return animation;
    };
  });
  const mark = () => page.locator('[data-status-commit]');
  const phase = value => page.waitForFunction(value => document.querySelector('[data-status-commit]')?.dataset.phase === value, value);
  const control = name => page.getByRole('button', { name, exact: true }).evaluate(element => element.click());
  const events = () => page.evaluate(() => window.statusCommit.events);
  const count = async type => (await events()).filter(event => event.type === type).length;
  const finish = async next => {
    await mark().evaluate(element => element.firstElementChild.getAnimations().find(animation => animation.playState === 'paused').finish());
    await phase(next);
  };
  const enterLoop = async () => { await finish('think-in'); await finish('think-loop'); };
  const finishRun = async () => {
    await control('Finish commit status');
    await finish('think-out'); await finish('done');
    await page.waitForFunction(() => window.statusCommit.events.some(event => event.type === 'complete'));
  };
  try {
    for (const strict of ['off', 'on']) for (const interruptedPhase of ['grow', 'out']) for (const action of ['hide', 'unmount']) {
      const context = `${strict}/${interruptedPhase}/${action}`;
      await page.goto(`${base}/tests/fixtures/react-feedback/commit-delivery.html?strict=${strict}`);
      await phase('grow');
      if (interruptedPhase === 'out') { await enterLoop(); await control('Finish commit status'); await finish('think-out'); }
      const original = await mark().elementHandle();
      await mark().evaluate(element => { element.firstElementChild.getAnimations().find(animation => animation.playState === 'paused').currentTime = 120; });
      const entered = await count('enter'), completed = await count('complete');
      await page.getByRole('textbox', { name: 'Outside status focus', exact: true }).focus();
      await page.evaluate(action => window.statusCommit.interrupt(action), action);
      await page.waitForFunction(() => window.statusCommit.events.some(event => event.type === 'commit-settle'));
      const trace = await events(), settlement = trace.find(event => event.type === 'commit-settle');
      assert.equal(settlement.connected, action === 'hide', `${context}: the external layout effect observes real retained or detached DOM`);
      assert.equal(settlement.visible, false, `${context}: settlement happens after the hide/unmount commit`);
      const start = trace.findIndex(event => event.type === 'interrupt');
      assert.ok(trace.slice(start).some(event => event.type === 'layout-disconnect'), `${context}: layout ownership is already disconnected`);
      assert.equal(await count('enter'), entered, `${context}: a disconnected growing sprite cannot enter its old activity`);
      assert.equal(await count('complete'), completed, `${context}: a disconnected exit cannot deliver an old completion`);
      if (action === 'hide') {
        assert.equal(await original.evaluate(element => element.isConnected), true, `${context}: Activity retains the original mark DOM`);
        await control('Show commit status'); await phase(interruptedPhase === 'grow' ? 'grow' : 'think-out');
        assert.equal(await mark().evaluate((element, old) => element === old, original), true, `${context}: reconnect retains DOM identity`);
        assert.equal(await mark().evaluate(element => element.firstElementChild.getAnimations().find(animation => animation.playState === 'paused').currentTime), 120, `${context}: reconnect restores the pre-disconnection frame`);
        assert.equal(await count('enter'), entered, `${context}: reconnect does not repeat an entry`);
        assert.equal(await count('complete'), completed, `${context}: reconnect does not replay obsolete completion`);
        if (interruptedPhase === 'grow') { await enterLoop(); await finishRun(); }
        else { await finish('done'); await page.waitForFunction(() => window.statusCommit.events.some(event => event.type === 'complete')); }
        assert.equal(await count('enter'), interruptedPhase === 'grow' ? entered + 1 : entered, `${context}: resumed playback enters exactly once`);
      } else {
        assert.equal(await original.evaluate(element => element.isConnected), false, `${context}: true unmount removes the original mark`);
        await control('Mount commit status'); await phase('grow');
        assert.equal(await mark().evaluate((element, old) => element === old, original), false, `${context}: a real remount creates a fresh mark`);
        await enterLoop(); await finishRun();
        assert.equal(await count('enter'), entered + 1, `${context}: only the fresh mount enters`);
      }
      assert.equal(await count('complete'), completed + 1, `${context}: normal resumed or fresh completion is delivered once`);
      assert.equal(await page.getByRole('textbox', { name: 'Outside status focus', exact: true }).evaluate(element => element === document.activeElement), true, `${context}: decorative playback never takes external focus`);
      await original.dispose(); assert.deepEqual(errors, [], context);
    }
  } finally { page.off('pageerror', onError); page.off('console', onConsole); }
}

async function testNotificationActionHide(page, base) {
  const errors = [], onError = error => errors.push(error.message), onConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', onError); page.on('console', onConsole);
  const cards = () => page.locator('[data-cui-notice]');
  const control = name => page.getByRole('button', { name, exact: true }).evaluate(element => element.click());
  const outsideFocused = () => page.getByRole('textbox', { name: 'Outside action focus', exact: true }).evaluate(element => element === document.activeElement);
  try {
    for (const strict of ['off', 'on']) for (const mode of ['stack', 'single']) for (const action of ['normal', 'hide', 'refresh', 'replace', 'unmount']) {
      const context = `${strict}/${mode}/${action}`;
      await page.goto(`${base}/tests/fixtures/react-micro/action-hide.html?strict=${strict}&mode=${mode}&action=${action}`);
      await control('Seed interrupted action'); await cards().waitFor();
      const old = await cards().elementHandle(), id = await cards().getAttribute('data-cui-notice');
      const actionButton = page.getByRole('button', { name: 'Run interrupted action', exact: true });
      await actionButton.focus(); await actionButton.evaluate(element => element.click());
      const trace = await page.evaluate(() => window.actionHide.events);
      assert.equal(trace.filter(event => event.type === 'action').length, 1, `${context}: the action executes exactly once`);
      if (action === 'normal') {
        await cards().waitFor({ state: 'detached' });
        await page.waitForFunction(() => document.activeElement?.textContent === 'Seed interrupted action');
      } else {
        const after = trace.find(event => event.type === 'after-action');
        assert.equal(after.connected, action !== 'unmount', `${context}: callback really hides retained DOM or truly unmounts`);
        assert.equal(after.visible, false, `${context}: the callback ends after DOM deactivation`);
        assert.equal(after.outsideFocused, true, `${context}: the callback intentionally moves focus outside`);
        await control('Notify saved action handle');
        if (action === 'unmount') {
          assert.equal(await old.evaluate(element => element.isConnected), false, `${context}: the original card is truly removed`);
          await control('Mount action stack');
          assert.equal(await cards().count(), 0, `${context}: a stale handle cannot repopulate a new stack`);
        } else {
          assert.equal(await old.evaluate(element => element.isConnected), true, `${context}: the original card DOM is retained while hidden`);
          await control('Show action Activity');
          if (action === 'hide') {
            await cards().waitFor({ state: 'detached' });
            assert.equal(await cards().count(), 0, `${context}: an accepted same-version action still dismisses after hide`);
          } else {
            await page.waitForFunction(() => {
              const cards = [...document.querySelectorAll('[data-cui-notice]')];
              return cards.length === 1 && cards[0].textContent.includes('Replacement action notice') && !cards[0].hasAttribute('data-ending');
            });
            if (action === 'refresh' || mode === 'single') assert.equal(await cards().getAttribute('data-cui-notice'), id, `${context}: a refreshed version retains its original ID`);
            if (action === 'replace' && mode === 'stack') assert.notEqual(await cards().getAttribute('data-cui-notice'), id, `${context}: a distinct stack entry survives the old action exit`);
            assert.equal(await cards().getAttribute('aria-hidden'), 'false', `${context}: the replacement remains accessible`);
          }
        }
        assert.equal(await outsideFocused(), true, `${context}: reveal/remount and dismissal preserve external focus`);
        assert.equal(await page.getByText('Stale saved notice', { exact: true }).count(), 0, `${context}: disconnected imperative calls stay silent`);
      }
      // A fresh action and a plain Activity reconnect still work after every
      // interruption. Preserve the actual same-card identity during reconnect.
      await page.goto(`${base}/tests/fixtures/react-micro/action-hide.html?strict=${strict}&mode=${mode}&action=normal`);
      await control('Seed interrupted action'); await cards().waitFor();
      const reconnect = await cards().elementHandle();
      await control('Hide action Activity'); await control('Show action Activity');
      assert.equal(await cards().evaluate((element, previous) => element === previous, reconnect), true, `${context}: normal reconnect retains the notification DOM`);
      await page.getByRole('button', { name: 'Run interrupted action', exact: true }).focus();
      await page.getByRole('button', { name: 'Run interrupted action', exact: true }).evaluate(element => element.click());
      await cards().waitFor({ state: 'detached' });
      assert.equal((await page.evaluate(() => window.actionHide.events)).filter(event => event.type === 'action').length, 1, `${context}: a reconnected action executes once and closes normally`);
      await old.dispose(); await reconnect.dispose(); assert.deepEqual(errors, [], context);
    }
  } finally { page.off('pageerror', onError); page.off('console', onConsole); }
}
module.exports = { testStatusCommitDelivery, testNotificationActionHide };
