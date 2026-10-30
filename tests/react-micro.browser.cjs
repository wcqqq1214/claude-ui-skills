const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
const assert = require('node:assert/strict');
const { withDevBrowser } = require('./dev-browser.cjs');
const { testTooltipRequests } = require('./tooltip-request-checks.cjs');
const { testCopyDelivery } = require('./copy-delivery-checks.cjs');
const { testNotificationRepeat } = require('./notification-repeat-checks.cjs');
const { testNotificationActionHide } = require('./status-notice-lifecycle-checks.cjs');

withDevBrowser(async ({ browser, base }) => {
    const actionHidePage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await testNotificationActionHide(actionHidePage, base); await actionHidePage.close();
    const deliveryPage = await browser.newPage();
    await testCopyDelivery(deliveryPage, base); await deliveryPage.close();
    const tooltipPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await testTooltipRequests(tooltipPage, base); await tooltipPage.close();
    const repeatPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await testNotificationRepeat(repeatPage, base); await repeatPage.close();
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const mode of ['stack', 'single']) for (const delivery of ['batch', 'flush']) for (const duration of ['persistent', 'timed']) {
      for (const replacement of mode === 'stack' ? ['same'] : ['same', 'different', 'unkeyed']) {
        const action = await browser.newPage();
        action.on('pageerror', error => errors.push(error.message));
        await action.clock.install(); await action.clock.pauseAt(new Date(Date.now() + 1000));
        await action.goto(`${base}/tests/fixtures/react-micro/?notice-action=${mode}&delivery=${delivery}&replacement=${replacement}&duration=${duration}`);
        const click = async name => { await action.getByRole('button', { name, exact: true }).evaluate(element => element.click()); await action.clock.runFor(1); };
        const cards = action.getByRole('region', { name: 'Action notices', exact: true }).locator('[data-cui-notice]');
        const result = async () => JSON.parse(await action.locator('[data-action-result]').textContent());
        await click('Seed action notice');
        const original = await cards.elementHandle(), id = await cards.getAttribute('data-cui-notice');
        await click('Refresh notice');
        assert.equal((await result()).refreshedId, id, `${mode}/${replacement}/${delivery} reuses the original public ID`);
        assert.equal(await cards.getAttribute('data-ending'), null, `${mode}/${replacement}/${delivery} old action cannot dismiss its replacement`);
        assert.equal(await cards.evaluate((element, original) => element === original, original), true, 'refresh retains its card DOM');
        assert.ok((await cards.textContent()).includes('Refreshed notice 1'));
        if (mode === 'stack') assert.ok((await cards.textContent()).includes('×2'), 'action refresh preserves key deduplication counts');
        await action.clock.runFor(500);
        await click('Refresh notice');
        assert.equal((await result()).count, 2, 'the replacement action remains usable');
        assert.equal(await cards.getAttribute('data-ending'), null, 'a repeated action refresh cannot dismiss the latest version');
        assert.ok((await cards.textContent()).includes('Refreshed notice 2'));
        if (mode === 'stack') assert.ok((await cards.textContent()).includes('×3'));
        await action.clock.runFor(750);
        assert.equal(await cards.count(), 1, 'refreshed notice survives the obsolete action exit interval');
        assert.equal(await cards.getAttribute('data-ending'), null, 'the newest refresh survives the previous refresh deadline');
        if (duration === 'timed') {
          await action.clock.runFor(500);
          assert.ok(!await cards.count() || await cards.getAttribute('data-ending') === 'true', 'the replacement still expires at its own finite deadline');
        } else {
          await action.clock.runFor(7000);
          assert.equal(await cards.getAttribute('data-ending'), null, 'a persistent replacement remains until explicitly dismissed');
          await click('Dismiss refreshed ID');
        }
        await cards.waitFor({ state: 'detached' });
        await action.close();
      }
    }
    for (const mode of ['stack', 'single']) for (const replacement of mode === 'stack' ? ['none', 'unrelated'] : ['none']) {
      const action = await browser.newPage();
      action.on('pageerror', error => errors.push(error.message));
      await action.goto(`${base}/tests/fixtures/react-micro/?notice-action=${mode}&replacement=${replacement}`);
      const click = name => action.getByRole('button', { name, exact: true }).click();
      await click('Seed action notice'); await click('Refresh notice');
      const result = JSON.parse(await action.locator('[data-action-result]').textContent());
      await action.locator(`[data-cui-notice="${result.originalId}"]`).waitFor({ state: 'detached' });
      assert.equal(result.count, 1, 'an ordinary action still invokes its host exactly once');
      const cards = action.getByRole('region', { name: 'Action notices', exact: true }).locator('[data-cui-notice]');
      if (replacement === 'unrelated') {
        assert.equal(await cards.count(), 1, 'an unrelated stack arrival does not prevent the old action from dismissing');
        assert.equal(await cards.getAttribute('data-cui-notice'), result.refreshedId);
        await click('Clear action notices'); await cards.waitFor({ state: 'detached' });
      } else assert.equal(await cards.count(), 0, 'an ordinary action still automatically dismisses its notice');
      await action.close();
    }
    if (process.argv.includes('--notice-action-only')) { assert.deepEqual(errors, []); console.log('React notification actions: batched/flushSync same-key and single replacement, repeated actions, finite/persistent deadlines, normal dismissal and public dismiss/clear passed'); return; }
    // Both public copy consumers share the same feedback deadline. Activity
    // retains their DOM/state, but disconnects and reconnects their effects.
    for (const kind of ['button', 'source']) {
      const activity = await browser.newPage();
      activity.on('pageerror', error => errors.push(error.message));
      await activity.clock.install();
      await activity.clock.pauseAt(new Date(Date.now() + 1000));
      await activity.addInitScript(() => {
        window.copyRequests = [];
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => new Promise((resolve, reject) => window.copyRequests.push({ text, resolve, reject })) } });
      });
      await activity.goto(`${base}/tests/fixtures/react-micro/?copy-activity`);
      const host = activity.locator('[data-copy-activity]'), original = await host.elementHandle();
      const control = kind === 'button' ? host.locator('button').first() : host.getByRole('group', { name: 'Activity source', exact: true }).getByRole('button');
      const status = kind === 'button' ? host.getByRole('status').first() : host.getByRole('group', { name: 'Activity source', exact: true }).getByRole('status');
      const click = async locator => { await locator.evaluate(element => element.click()); await activity.clock.runFor(1); };
      const copy = async () => {
        await click(control);
        await activity.evaluate(() => window.copyRequests.at(-1).resolve());
        await activity.clock.runFor(1);
        assert.equal(await status.textContent(), `Activity ${kind} copied`);
      };
      const hide = () => click(activity.getByRole('button', { name: 'Hide copy Activity', exact: true }));
      const show = () => click(activity.getByRole('button', { name: 'Show copy Activity', exact: true }));
      await copy(); await activity.clock.runFor(500); await hide(); await activity.clock.runFor(500); await show();
      assert.equal(await host.evaluate((element, original) => element === original, original), true, `${kind} Activity preserves its DOM`);
      assert.equal(await status.textContent(), `Activity ${kind} copied`, 'short hiding preserves the remaining success feedback');
      await activity.clock.runFor(900);
      assert.equal(await status.textContent(), `Activity ${kind} copied`, 'feedback lasts until the original two-second deadline');
      await activity.clock.runFor(150);
      assert.equal(await status.textContent(), '', 'reconnection resumes the remaining deadline instead of cancelling or restarting it');
      await copy(); await hide(); await activity.clock.runFor(2100); await show();
      assert.equal(await status.textContent(), '', 'a deadline that passed while hidden is idle immediately after reconnection');
      await copy(); await activity.clock.runFor(1500); await copy(); await activity.clock.runFor(600);
      assert.equal(await status.textContent(), `Activity ${kind} copied`, 'a fresh successful copy replaces the old deadline');
      await activity.clock.runFor(1450); assert.equal(await status.textContent(), '');
      await click(control);
      const beforeHiddenResult = await activity.locator('[data-copy-results]').textContent();
      await hide();
      await activity.evaluate(() => window.copyRequests.at(-1).resolve()); await show();
      assert.equal(await status.textContent(), '', 'a pending write cannot publish success across Activity disconnection');
      assert.equal(await activity.locator('[data-copy-results]').textContent(), beforeHiddenResult, 'a disconnected pending result cannot notify its host');
      await copy(); await activity.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await activity.clock.runFor(1);
      assert.equal(await status.textContent(), '', 'page exit clears the feedback and its retained deadline');
      await hide(); await show(); assert.equal(await status.textContent(), '', 'page-exit feedback cannot return on reconnection');
      await click(control); await activity.evaluate(() => { window.dispatchEvent(new Event('pagehide')); window.copyRequests.at(-1).resolve(); });
      await activity.clock.runFor(1); assert.equal(await status.textContent(), '', 'page exit also invalidates a pending write');
      await click(control);
      const results = await activity.locator('[data-copy-results]').textContent();
      await click(activity.getByRole('button', { name: 'Mount copy Activity', exact: true }));
      await activity.evaluate(() => window.copyRequests.at(-1).resolve()); await activity.clock.runFor(1);
      assert.equal(await activity.locator('[data-copy-results]').textContent(), results, 'real unmount invalidates a pending result');
      await click(activity.getByRole('button', { name: 'Mount copy Activity', exact: true }));
      assert.equal(await status.textContent(), '', 'a new mount starts with idle feedback');
      await activity.close();
    }
    if (process.argv.includes('--copy-activity-only')) { assert.deepEqual(errors, []); console.log('React copy Activity: retained DOM, remaining/expired/replaced deadlines, pending write cancellation, pagehide and unmount passed'); return; }
    for (const delivery of ['exit', 'ref', 'layout']) {
      const activity = await browser.newPage();
      activity.on('pageerror', error => errors.push(error.message));
      await activity.goto(`${base}/tests/fixtures/react-micro/?notice-activity=${delivery}`);
      const host = activity.locator('[data-notice-activity]'), original = await host.elementHandle();
      const stack = host.getByRole('region', { name: 'Activity notices', exact: true });
      const cards = stack.locator('[data-cui-notice]');
      const hide = () => activity.getByRole('button', { name: 'Hide notice Activity', exact: true }).evaluate(element => element.click());
      const show = () => activity.getByRole('button', { name: 'Show notice Activity', exact: true }).evaluate(element => element.click());
      if (delivery === 'exit') {
        await cards.getByText('Persistent Activity notice', { exact: true }).waitFor();
        await activity.waitForTimeout(250);
        await cards.getByRole('button', { name: 'Dismiss Activity notice', exact: true }).focus();
        await activity.getByRole('button', { name: 'Dismiss and hide notice Activity', exact: true }).evaluate(element => element.click());
        await activity.waitForTimeout(300);
        const trigger = activity.getByRole('button', { name: 'Show notice Activity', exact: true });
        await trigger.focus(); await show();
        await activity.getByText('Activity notices empty', { exact: true }).waitFor();
        assert.equal(await cards.count(), 0, 'an exit completed while hidden is removed after the child layout effect reconnects');
        assert.equal(await stack.evaluate(element => element.style.height), '', 'the last exiting card leaves no reserved stack height');
        assert.equal(await trigger.evaluate(element => element === document.activeElement), true, 'reconnection does not steal focus that moved to the host');
      } else {
        const message = delivery === 'ref' ? 'Ref connection' : 'Layout connection';
        const count = async () => Number(((await cards.textContent()) || '').match(/×(\d+)/)?.[1] || 1);
        await cards.filter({ hasText: message }).waitFor();
        const initial = await count(), id = await cards.getAttribute('data-cui-notice');
        for (let reconnect = 0; reconnect < 2; reconnect++) {
          const before = await count();
          await hide();
          await activity.getByRole('button', { name: 'Notify saved notice handle', exact: true }).evaluate(element => element.click());
          await show();
          await activity.waitForFunction(before => {
            const text = document.querySelector('[data-notice-activity] [data-cui-notice]')?.textContent || '';
            return Number(text.match(/×(\d+)/)?.[1] || 1) > before;
          }, before);
          assert.equal(await cards.getAttribute('data-cui-notice'), id, `${delivery} reconnect updates the retained notification`);
          assert.equal(await cards.count(), 1, 'a saved handle cannot enqueue a notification while its effects are disconnected');
        }
        assert.ok(await count() > initial, `${delivery} notifications are accepted during reconnection before passive effects`);
      }
      assert.equal(await host.evaluate((element, original) => element === original, original), true, 'notice Activity retains the original DOM');
      await activity.getByRole('button', { name: 'Mount notice Activity', exact: true }).click();
      await activity.getByRole('button', { name: 'Notify saved notice handle', exact: true }).click();
      await activity.getByRole('button', { name: 'Mount notice Activity', exact: true }).click();
      await host.waitFor();
      assert.equal(await host.getByText('Stale unmounted notice', { exact: true }).count(), 0, 'a real unmount invalidates its previous imperative handle');
      await activity.close();
    }
    const expiry = await browser.newPage();
    expiry.on('pageerror', error => errors.push(error.message));
    await expiry.clock.install(); await expiry.clock.pauseAt(new Date(Date.now() + 1000));
    await expiry.goto(`${base}/tests/fixtures/react-micro/?notice-activity=exit`);
    const expiryClick = async name => { await expiry.getByRole('button', { name, exact: true }).evaluate(element => element.click()); await expiry.clock.runFor(1); };
    const timed = expiry.locator('[data-notice-activity] [data-cui-notice]').filter({ hasText: 'Timed Activity notice' });
    await expiryClick('Add timed Activity notice'); await expiry.clock.runFor(100);
    await expiryClick('Hide notice Activity'); await expiry.clock.runFor(400); await expiryClick('Show notice Activity');
    assert.equal(await timed.getAttribute('data-ending'), null, 'a notification retains its remaining deadline across short hiding');
    await expiry.clock.runFor(750);
    assert.ok(!await timed.count() || await timed.getAttribute('data-ending') === 'true', 'Activity reconnection does not restart the expiry duration');
    await expiryClick('Add timed Activity notice'); await expiryClick('Hide notice Activity');
    await expiry.clock.runFor(1400); await expiryClick('Show notice Activity');
    assert.equal(await timed.evaluateAll(elements => elements.filter(element => !element.hasAttribute('data-ending')).length), 0, 'a deadline passed while hidden exits on reconnection');
    await expiry.close();
    if (process.argv.includes('--notice-activity-only')) { assert.deepEqual(errors, []); console.log('React notification Activity: retained DOM, exit completion, ref/layout delivery, expiry deadlines, focus and true unmount passed'); return; }
    for (const mode of ['single', 'stack']) for (const duration of [null, 120_000]) {
      const deadline = await browser.newPage();
      deadline.on('pageerror', error => errors.push(error.message));
      await deadline.addInitScript(() => {
        // Control the timer boundary, without inspecting component closures.
        // The old task is delivered after the host refresh, before passive
        // cleanup gets a chance to cancel its registered timer.
        const schedule = window.setTimeout.bind(window), cancel = window.clearTimeout.bind(window), now = Date.now.bind(Date);
        let offset = 0;
        const records = [];
        Date.now = () => now() + offset;
        window.noticeDeadlines = { records, advance: value => { offset += value; } };
        window.setTimeout = (callback, delay, ...args) => {
          const id = schedule(callback, delay, ...args);
          if (typeof callback === 'function' && delay >= 59_000 && delay <= 120_000) records.push({ id, cancelled: false, run: () => { cancel(id); callback(...args); } });
          return id;
        };
        window.clearTimeout = id => { const record = records.find(record => record.id === id); if (record) record.cancelled = true; cancel(id); };
      });
      await deadline.goto(`${base}/tests/fixtures/react-micro/?deadline=${mode}`);
      await deadline.getByRole('button', { name: 'Seed deadline notice', exact: true }).click();
      await deadline.waitForFunction(() => window.noticeDeadlines.records.length === 1);
      const notice = deadline.getByRole('region', { name: 'Deadline notices', exact: true }).locator('[data-cui-notice]');
      const id = await notice.getAttribute('data-cui-notice');
      const cancelledBeforeDelivery = await deadline.evaluate(duration => {
        const probe = window.noticeDeadlines, previous = probe.records[0];
        probe.advance(60_000);
        window.dispatchEvent(new CustomEvent('refresh-deadline-notice', { detail: duration }));
        const cancelled = previous.cancelled;
        previous.run();
        return cancelled;
      }, duration);
      assert.equal(cancelledBeforeDelivery, false, 'the old deadline runs in the valid window before React effect cleanup');
      // Native host events batch their React update. Observe its committed
      // message before checking the resulting identity and expiry state.
      await notice.getByText('Refreshed notice', { exact: false }).waitFor();
      assert.equal(await notice.getAttribute('data-cui-notice'), id, `${mode} refresh reuses its existing notice`);
      assert.equal(await notice.getAttribute('data-ending'), null, `${mode} old deadline cannot cancel ${duration === null ? 'a persistent' : 'an extended'} replacement`);
      assert.ok((await notice.textContent()).includes('Refreshed notice'));
      if (mode === 'stack') assert.ok((await notice.textContent()).includes('×2'), 'same-key refresh still increments its count');
      if (duration !== null) await deadline.waitForFunction(() => window.noticeDeadlines.records.length === 2);
      await deadline.waitForTimeout(250);
      assert.equal(await notice.count(), 1, 'the refreshed notice survives the old exit interval');
      assert.equal(await notice.getAttribute('aria-hidden'), 'false');
      if (duration !== null) {
        await deadline.evaluate(() => { window.noticeDeadlines.advance(120_000); window.noticeDeadlines.records[1].run(); });
        await notice.waitFor({ state: 'detached' });
      }
      await deadline.close();
    }
    await page.addInitScript(() => {
      window.copyRequests = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => new Promise((resolve, reject) => window.copyRequests.push({ text, resolve, reject })) } });
    });
    await page.goto(`${base}/tests/fixtures/react-micro/`);
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual(errors, [], 'JSX tooltip content and a stateful overflow callback mount without a render loop');
    const reactive = page.getByRole('region', { name: 'Reactive tooltip', exact: true });
    const overflowChanges = () => reactive.locator('[data-overflow-changes]').textContent();
    assert.equal(await reactive.locator('[data-overflow-result]').textContent(), 'true');
    assert.equal(await overflowChanges(), '1', 'StrictMode and initial observers notify one initial result');
    const reads = await reactive.getByRole('button', { name: 'Reactive target', exact: true }).evaluate(async element => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const rangeRect = Range.prototype.getBoundingClientRect, elementRect = element.getBoundingClientRect;
      const text = element.firstChild.textContent;
      let ranges = 0, boxes = 0;
      Range.prototype.getBoundingClientRect = function () {
        if (element.contains(this.commonAncestorContainer)) ranges++;
        return rangeRect.call(this);
      };
      element.getBoundingClientRect = function () { boxes++; return elementRect.call(this); };
      try {
        // Keep the fixed-width trigger overflowing: only its text mutation
        // should request a measurement, without changing the host's state.
        element.firstChild.textContent += ' extra';
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return { ranges, boxes };
      } finally {
        Range.prototype.getBoundingClientRect = rangeRect;
        delete element.getBoundingClientRect;
        element.firstChild.textContent = text;
      }
    });
    assert.deepEqual(reads, { ranges: 1, boxes: 1 }, 'one tooltip measurement reads text and trigger geometry once');
    assert.equal(await overflowChanges(), '1', 'equivalent overflow still does not republish');
    await reactive.getByRole('button', { name: 'Resize JSX trigger', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-overflow-result]').textContent === 'false');
    assert.equal(await overflowChanges(), '2', 'resize publishes the changed overflow result');
    await reactive.getByRole('button', { name: 'Refresh JSX content', exact: true }).click();
    await reactive.getByRole('button', { name: 'Change JSX label', exact: true }).click();
    await reactive.getByRole('button', { name: 'Resize JSX trigger', exact: true }).click();
    assert.equal(await overflowChanges(), '2', 'JSX identities and measurements with the same result do not notify again');
    await reactive.getByRole('button', { name: 'Change JSX label', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-overflow-result]').textContent === 'true');
    assert.equal(await overflowChanges(), '3', 'text mutations still publish changed overflow');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await reactive.getByRole('button', { name: 'Reactive target', exact: true }).focus();
    await page.getByRole('tooltip', { name: 'JSX explanation 1', exact: true }).waitFor();
    await reactive.getByRole('button', { name: 'Reactive target', exact: true }).press('Escape');
    const hint = page.getByRole('button', { name: 'Hint', exact: true });
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    await hint.focus(); await page.waitForTimeout(100);
    assert.equal(await hint.getAttribute('aria-describedby'), null, 'tip waits 300ms');
    await page.getByRole('tooltip', { name: 'A useful explanation' }).waitFor();
    await hint.press('Escape');
    assert.equal(await hint.getAttribute('aria-describedby'), null);
    await page.waitForTimeout(160); assert.equal(await page.getByRole('tooltip').count(), 0);
    const overflow = page.getByRole('button', { name: 'A long label that may need a hint', exact: true });
    await overflow.focus(); await page.getByRole('tooltip', { name: 'A long label that may need a hint' }).waitFor();
    assert.equal(await page.locator('#truncation').textContent(), 'true');
    await page.getByRole('button', { name: 'Width', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#truncation').textContent === 'false');
    await overflow.focus(); await page.waitForTimeout(450);
    assert.equal(await overflow.getAttribute('aria-describedby'), null, 'fitting text has no tip');
    await hint.focus(); await page.getByRole('tooltip', { name: 'A useful explanation' }).waitFor();
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    assert.equal(await hint.getAttribute('aria-describedby'), null);
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    const ghost = page.getByRole('button', { name: 'Ghost', exact: true });
    await ghost.hover();
    assert.equal(await ghost.locator('.cui-ghost-eyes').evaluate(element => getComputedStyle(element).animationName), 'cui-ghost-look');
    await page.mouse.down();
    assert.equal(await ghost.locator('.cui-ghost-eyes').evaluate(element => getComputedStyle(element).animationName), 'none');
    await page.mouse.up(); await page.mouse.move(700, 800); await ghost.focus();
    assert.equal(await ghost.locator('.cui-ghost-eyes').evaluate(element => getComputedStyle(element).animationName), 'none', 'focus alone keeps eyes still');
    const copy = page.getByRole('button', { name: 'Copy', exact: true });
    await copy.click(); assert.equal(await page.evaluate(() => window.copyRequests[0].text), '  exact\n\tcode\n');
    await page.evaluate(() => window.copyRequests[0].resolve());
    await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Copied', exact: true }).click();
    await page.evaluate(() => window.copyRequests[1].reject(Error('denied')));
    await page.getByRole('button', { name: 'Failed', exact: true }).waitFor();
    assert.equal(await page.locator('#copyResults').textContent(), '2');
    await page.getByRole('button', { name: 'Failed', exact: true }).click();
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await page.evaluate(() => window.copyRequests[2].resolve());
    assert.equal(await page.locator('#copyResults').textContent(), '2', 'late clipboard result cannot notify after unmount');
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
      document.execCommand = command => { window.fallbackText = document.activeElement.value; return command === 'copy'; };
    });
    await copy.click(); await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.fallbackText), '  exact\n\tcode\n');
    assert.equal(await page.getByRole('button', { name: 'Copied', exact: true }).evaluate(element => element === document.activeElement), true);
    assert.equal(await page.locator('textarea').count(), 0);

    const stack = page.getByRole('region', { name: 'Stack', exact: true });
    const cards = stack.locator('[data-cui-notice]');
    const front = () => stack.locator('[data-cui-notice]:not([inert])');
    await page.getByRole('button', { name: 'Five', exact: true }).click();
    assert.equal(await cards.count(), 5);
    assert.equal(await stack.locator('[data-limited]').count(), 2);
    assert.equal(await stack.getByRole('button', { name: 'Dismiss', exact: true }).count(), 1);
    const frontText = await front().textContent();
    await stack.getByRole('button', { name: 'Dismiss', exact: true }).focus();
    await page.keyboard.press('F6');
    assert.equal(await cards.count(), 6); assert.equal(await front().textContent(), frontText, 'arrival never reorders a focused notice');
    await page.getByRole('button', { name: 'Long message', exact: true }).click();
    await page.waitForTimeout(100);
    const heights = await cards.evaluateAll(elements => elements.map(element => element.firstElementChild.offsetHeight));
    assert.ok(heights[0] > 40); assert.ok(heights.every(value => value === heights[0]), 'rear cards follow natural front height');
    await stack.getByRole('button', { name: 'Dismiss', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="Stack"] [data-cui-notice]:not([inert]) button') === document.activeElement);
    assert.equal(await stack.getByRole('button', { name: 'Dismiss', exact: true }).evaluate(element => element === document.activeElement), true, 'closing advances focus to usable neighbor');
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="Stack"] [data-cui-notice]').length === 5);
    await page.getByRole('button', { name: 'Clear and add', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="Stack"] [data-cui-notice]').length === 1);
    assert.equal(await stack.getByRole('button', { name: 'Dismiss', exact: true }).count(), 1);
    await stack.getByRole('button', { name: 'Dismiss', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Add', exact: true }).evaluate(element => element === document.activeElement), true, 'last dismissal returns focus to host trigger');
    await page.getByRole('button', { name: 'Action', exact: true }).click();
    await page.getByRole('button', { name: 'Timed', exact: true }).click();
    await page.waitForTimeout(6300);
    assert.equal(await cards.count(), 1, 'ordinary defaults to 6s while action notice persists');
    await stack.getByRole('button', { name: 'View', exact: true }).click();
    await page.getByRole('region', { name: 'Single region' }).getByText('Viewed').waitFor();
    await page.getByRole('button', { name: 'Single', exact: true }).click();
    const single = page.getByRole('region', { name: 'Single region', exact: true });
    const oldId = await single.locator('[data-cui-notice]').getAttribute('data-cui-notice');
    await single.getByRole('button', { name: 'Close single' }).click();
    await page.keyboard.press('F7'); await page.waitForTimeout(300);
    assert.equal(await single.locator('[data-cui-notice]').getAttribute('data-cui-notice'), oldId, 'reopening interrupts the same exiting card');
    assert.equal(await single.locator('[data-ending]').count(), 0); assert.ok((await single.textContent()).includes('Reopened'));
    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    assert.equal(await single.locator('[data-cui-notice]').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(32, 32, 31)');

    // Chapter changes close the shared single notice, while the recovery stack persists.
    await page.goto(`${base}/demo/?lang=en#micro`);
    await page.getByRole('button', { name: 'Show notice', exact: true }).click();
    await page.getByText('This notice closes after 6 seconds.', { exact: true }).waitFor();
    await chooseChapter(page, 'controls'); await chooseChapter(page, 'micro');
    const liveSingleNotices = () => page.locator('main section:not([hidden]) .demo-toast-region [data-cui-notice]:not([inert])');
    const retainedSingle = { micro: await liveSingleNotices().count() };
    await chooseChapter(page, 'recovery');
    await page.getByRole('button', { name: 'Notice with action', exact: true }).click();
    const recovery = page.getByRole('region', { name: 'Notification stack', exact: true });
    await recovery.getByRole('button', { name: 'View', exact: true }).click();
    await page.getByText('Local notes: reading rhythm, spatial continuity and state feedback.', { exact: true }).waitFor();
    assert.equal(await recovery.locator('[data-cui-notice]:not([data-ending])').count(), 1);
    await chooseChapter(page, 'controls'); await chooseChapter(page, 'recovery');
    retainedSingle.recovery = await liveSingleNotices().count();
    assert.equal(await recovery.locator('[data-cui-notice]:not([data-ending])').count(), 1, 'persistent notices survive chapter changes');
    assert.deepEqual(retainedSingle, { micro: 0, recovery: 0 }, 'single notices stay dismissed after returning to either chapter');

    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/demo/?lang=en#micro`);
      // Hash-only navigation intentionally retains chapter state; isolate viewport cases.
      await page.reload();
      await setTheme(page, theme);
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      await page.getByRole('button', { name: 'View design notes', exact: true }).focus();
      const tip = page.getByRole('tooltip', { name: 'View design notes', exact: true }); await tip.waitFor();
      const rect = await tip.boundingBox(); assert.ok(rect.x >= 0 && rect.x + rect.width <= width, 'tip stays inside viewport');
      await page.getByRole('button', { name: 'Show notice', exact: true }).click();
      await setLanguage(page, 'zh-Hans');
      await page.getByText('这条通知将在 6 秒后关闭。', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${theme} hints have no overflow`);
      await chooseChapter(page, 'recovery');
      const actionStyle = await page.getByRole('button', { name: '查看', exact: true }).evaluate(element => ({ font: getComputedStyle(element).fontSize, color: getComputedStyle(element).color }));
      assert.deepEqual(actionStyle, { font: '11px', color: theme === 'light' ? 'rgb(198, 97, 63)' : 'rgb(217, 119, 87)' }, 'demo reset must not override component utilities');
      await page.getByRole('button', { name: '重复通知', exact: true }).click(); await page.getByRole('button', { name: '重复通知', exact: true }).click();
      await page.getByText('设计笔记已保存（×2）', { exact: true }).waitFor();
      await setLanguage(page, 'en');
      await page.getByText('Design notes saved (×2)', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${theme} stack has no overflow`);
    }
    assert.deepEqual(errors, []);
    console.log('React micro: tooltip delay/overflow/Escape, ghost motion, copy fallback/lifecycle, notification ordering/dedupe/geometry/expiry/focus/reopen and responsive bilingual demo passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
