const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
const assert = require('node:assert/strict');
const { withDevBrowser } = require('./dev-browser.cjs');
const { testMenuCallbackLifecycle } = require('./menu-callback-checks.cjs');
const { testSearchInitialFocus } = require('./migration-review-checks.cjs');
const { testSubmenuCaptureHide } = require('./capture-lifecycle-checks.cjs');

async function testMenuActivity(page, base, kinds = ['artifact', 'submenu']) {
  const focused = locator => locator.evaluate(element => element === document.activeElement);
  const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  for (const strict of ['off', 'on']) for (const kind of kinds) {
    const label = `${kind}/StrictMode ${strict}`;
    await page.goto(`${base}/tests/fixtures/react-menus/activity.html?strict=${strict}`);
    const region = page.locator(kind === 'artifact' ? '[data-retained-artifact]' : '[data-retained-submenu]');
    const trigger = region.getByRole('button', { name: kind === 'artifact' ? 'Retained Artifact actions' : 'Retained model settings', exact: true });
    const outside = page.getByRole('textbox', { name: 'Outside menu input' });
    await trigger.waitFor();
    await region.evaluate(element => { window.retainedMenuNodes = [element, element.querySelector('[aria-haspopup="menu"]')]; });
    async function open() {
      await trigger.click();
      if (kind === 'submenu') await region.getByRole('menuitem', { name: /Retained thinking effort/ }).press('ArrowRight');
      await frames();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true', `${label}: fresh opening works`);
      if (kind === 'artifact') assert.equal(await focused(region.getByRole('menuitem', { name: 'Open retained artwork', exact: true })), true, `${label}: normal delayed entry focuses the action`);
      else assert.equal(await focused(region.getByRole('menuitemradio', { name: 'High', exact: true })), true, `${label}: entry focuses the committed option`);
    }
    async function closed(reason) {
      await frames();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false', `${label}: ${reason} dismisses transient open state`);
      assert.equal(await region.getByRole('menu').count(), 0, `${label}: ${reason} leaves no old menu`);
      assert.equal(await region.locator('[data-returning="true"]').count(), 0, `${label}: ${reason} does not restart the return animation`);
      assert.equal(await region.evaluate(element => element === window.retainedMenuNodes[0] && element.querySelector('[aria-haspopup="menu"]') === window.retainedMenuNodes[1]), true, `${label}: ${reason} retains the region and trigger DOM`);
      assert.equal(await page.locator('[data-menu-state]').getAttribute('data-changes'), '0', `${label}: dismissal never commits an action or selection`);
    }
    // Both props change in the same commit: Activity disconnects effects before
    // the inactive setup can run. A later reveal must not resurrect either menu.
    await open();
    await page.locator('[data-menu-hide]').evaluate(element => element.click());
    await page.locator('[data-menu-state][data-visible="false"][data-active="false"]').waitFor();
    assert.equal(await region.evaluate(element => element.isConnected && !element.getClientRects().length), true, `${label}: hidden Activity keeps the original DOM`);
    await outside.focus();
    await page.locator('[data-menu-show]').evaluate(element => element.click());
    await closed('Activity reconnect');
    assert.equal(await focused(outside), true, `${label}: reconnect preserves focus placed outside while hidden`);

    await open();
    await page.locator('[data-menu-cycle]').evaluate(element => element.click());
    await closed('same-task hide/show');
    // Repeat in one task before Artifact's delayed entry can run: disconnect
    // must cancel that old focus request without moving focus to its trigger.
    if (kind === 'artifact') await trigger.evaluate(element => {
      element.focus(); element.click();
      document.querySelector('[data-menu-cycle]').click();
      document.querySelector('[data-menu-outside]').focus();
    });
    else {
      await trigger.click();
      await region.getByRole('menuitem', { name: /Retained thinking effort/ }).press('ArrowRight');
      await page.evaluate(() => {
        document.querySelector('[data-menu-cycle]').click();
        document.querySelector('[data-menu-outside]').focus();
      });
    }
    await closed('repeated same-task reconnect');
    assert.equal(await focused(outside), true, `${label}: old entry work cannot steal outside focus`);

    await open();
    await page.locator('[data-menu-active]').evaluate(element => element.click());
    await page.locator('[data-menu-state][data-active="false"]').waitFor();
    await closed('explicit inactive update');
    await outside.focus();
    await page.locator('[data-menu-active]').evaluate(element => element.click());
    await closed('reactivation');
    assert.equal(await focused(outside), true, `${label}: explicit reactivation preserves outside focus`);
    await open();
    if (kind === 'artifact') await region.getByRole('menuitem', { name: 'Open retained artwork', exact: true }).click();
    else {
      await page.keyboard.press('ArrowUp');
      assert.equal(await focused(region.getByRole('menuitemradio', { name: 'Low', exact: true })), true, `${label}: new submenu entry retains disabled-option skipping`);
      await page.keyboard.press('Enter');
    }
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(await focused(trigger), true, `${label}: a new explicit selection still restores trigger focus`);
    assert.equal(await page.locator('[data-menu-state]').getAttribute('data-changes'), '1');
  }
}

async function testMountHighlights(page, base) {
  const marks = '.cui-feature-anchor-highlight, .cui-feature-anchor-row-fill';
  const title = page.getByRole('heading', { name: 'Mount destination', exact: true });
  const button = name => page.getByRole('button', { name, exact: true });
  async function highlighted(label) {
    await page.waitForFunction(() => document.querySelector('[data-mount-row] h3')?.classList.contains('cui-feature-anchor-highlight'));
    assert.equal(await page.locator('[data-mount-row].cui-feature-anchor-row-fill').count(), 1, `${label}: row and title belong to the same active request`);
    const destination = await title.evaluate(element => {
      const scroller = document.querySelector('[data-mount-scroll]');
      const bounds = scroller.getBoundingClientRect(), target = element.getBoundingClientRect();
      return { focused: document.activeElement === element, scroll: scroller.scrollTop, center: Math.abs((target.top + target.bottom) / 2 - (bounds.top + bounds.bottom) / 2) };
    });
    assert.equal(destination.focused, true, `${label}: the descendant request focuses its destination`);
    assert.ok(destination.scroll > 0 && destination.center < 2, `${label}: destination centers inside its local scroller: ${JSON.stringify(destination)}`);
  }
  async function blocked(label) {
    const result = await page.evaluate(async () => {
      const scroller = document.querySelector('[data-mount-scroll]');
      const focus = document.activeElement, scroll = scroller.scrollTop;
      document.querySelector('[data-mount-saved]').click();
      await new Promise(resolve => setTimeout(resolve, 450));
      return { focusUnchanged: document.activeElement === focus, scrollUnchanged: scroller.scrollTop === scroll, marks: document.querySelectorAll('.cui-feature-anchor-highlight, .cui-feature-anchor-row-fill').length };
    });
    assert.deepEqual(result, { focusUnchanged: true, scrollUnchanged: true, marks: 0 }, `${label}: saved calls cannot focus, scroll, or schedule a highlight`);
  }
  for (const source of ['ref', 'layout']) for (const strict of ['off', 'on']) {
    const label = `${source}/StrictMode ${strict}`;
    const url = `${base}/tests/fixtures/react-menus/mount.html?source=${source}&strict=${strict}`;
    await page.goto(url);
    await highlighted(`${label} first mount`);
    await page.evaluate(() => { window.mountHighlightNodes = [...document.querySelectorAll('[data-mount-scroll], [data-mount-row], [data-mount-row] h3')]; });
    await button('Cancel mounting highlight').click();
    assert.equal(await page.locator(marks).count(), 0, `${label}: cancellation owns the mount request`);
    for (let reconnect = 1; reconnect <= 2; reconnect++) {
      await page.locator('[data-mount-scroll]').evaluate(element => { element.scrollTop = 0; });
      await button('Toggle mounting Activity').click();
      await page.locator('[data-mount-state][data-visible="false"]').waitFor();
      assert.equal(await page.locator(marks).count(), 0, `${label}: hiding clears the prior request`);
      await blocked(`${label} hidden cycle ${reconnect}`);
      await button('Toggle mounting Activity').click();
      await highlighted(`${label} reconnect ${reconnect}`);
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('[data-mount-scroll], [data-mount-row], [data-mount-row] h3')].every((node, index) => node === window.mountHighlightNodes[index])), true, `${label}: reconnect ${reconnect} retains the scroller, row, and title DOM`);
      if (reconnect === 1) await button('Cancel mounting highlight').click();
      else await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      assert.equal(await page.locator(marks).count(), 0, `${label}: ${reconnect === 1 ? 'cancel' : 'pagehide'} owns the reconnected request`);
    }
    // Without a new descendant request, calls made while hidden must not be
    // replayed when that same DOM becomes visible again.
    await page.locator('[data-mount-scroll]').evaluate(element => { element.scrollTop = 0; });
    await button('Toggle mounting Activity').click();
    await page.locator('[data-mount-state][data-visible="false"]').waitFor();
    await button('Toggle automatic request').click();
    await blocked(`${label} hidden without automatic reconnect`);
    await button('Saved highlight then show Activity').click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator(marks).count(), 0, `${label}: hidden calls are not replayed by a same-task Activity reveal`);
    assert.equal(await title.evaluate(element => element === document.activeElement), false);
    assert.equal(await page.locator('[data-mount-scroll]').evaluate(element => element.scrollTop), 0);
    await button('Saved mounting highlight').click();
    await highlighted(`${label} explicit request after reconnect`);
    await button('Cancel mounting highlight').click();
    assert.equal(await page.locator(marks).count(), 0);

    await page.goto(`${url}&inactive`);
    await title.waitFor();
    await page.waitForTimeout(450);
    assert.equal(await page.locator(marks).count(), 0, `${label}: an initially inactive descendant request stays inert`);
    assert.equal(await title.evaluate(element => element === document.activeElement), false);
    assert.equal(await page.locator('[data-mount-scroll]').evaluate(element => element.scrollTop), 0);
    await blocked(`${label} initially inactive`);
    await button('Toggle automatic request').click();
    await button('Saved highlight then activate').click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator(marks).count(), 0, `${label}: inactive calls are not replayed by a same-task activation`);
    assert.equal(await title.evaluate(element => element === document.activeElement), false);
    assert.equal(await page.locator('[data-mount-scroll]').evaluate(element => element.scrollTop), 0);
    await button('Saved mounting highlight').click();
    await highlighted(`${label} explicit request after activation`);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    assert.equal(await page.locator(marks).count(), 0);

    for (const queued of ['cancel', 'replace', 'pagehide']) {
      await page.goto(`${url}&queued=${queued}`);
      await title.waitFor();
      if (queued === 'replace') {
        await page.waitForFunction(() => document.querySelector('[data-mount-second-row] h3')?.classList.contains('cui-feature-anchor-highlight'));
        assert.equal(await page.locator('[data-mount-row].cui-feature-anchor-row-fill, [data-mount-row] .cui-feature-anchor-highlight').count(), 0, `${label}: a queued replacement invalidates the original descendant request`);
        assert.equal(await page.locator('[data-mount-second-row].cui-feature-anchor-row-fill').count(), 1);
        assert.equal(await page.getByRole('heading', { name: 'Replacement mount destination', exact: true }).evaluate(element => document.activeElement === element), true);
      } else {
        await page.waitForTimeout(450);
        assert.equal(await page.locator(marks).count(), 0, `${label}: synchronous ${queued} invalidates an unstarted descendant request`);
        assert.equal(await title.evaluate(element => element === document.activeElement), false, `${label}: cancelled queued work never focuses`);
        assert.equal(await page.locator('[data-mount-scroll]').evaluate(element => element.scrollTop), 0, `${label}: cancelled queued work never scrolls`);
      }
      await button('Cancel mounting highlight').click();
      assert.equal(await page.locator(marks).count(), 0, `${label}: queued ${queued} leaves no unowned row or title`);
    }

    await page.goto(`${url}&cleanup`);
    await highlighted(`${label} before cleanup reentry`);
    await button('Toggle automatic request').click();
    await button('Cancel mounting highlight').click();
    await page.locator('[data-mount-scroll]').evaluate(element => { element.scrollTop = 0; });
    await button('Hide then show mounting Activity').click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator(marks).count(), 0, `${label}: a descendant layout cleanup request cannot replay after same-task hide and show`);
    assert.equal(await title.evaluate(element => element === document.activeElement), false);
    assert.equal(await page.locator('[data-mount-scroll]').evaluate(element => element.scrollTop), 0);
    await button('Saved mounting highlight').click();
    await highlighted(`${label} fresh request after cleanup reentry`);
    await button('Cancel mounting highlight').click();
    assert.equal(await page.locator(marks).count(), 0);

    // Keep the original active-generation callback, then change active while
    // visible before hiding. Its external target stays visibly connected, so
    // only the hook's committed inactive state can reject this stale method.
    await page.goto(url);
    await highlighted(`${label} before inactive generation change`);
    await button('Toggle automatic request').click();
    await button('Cancel mounting highlight').click();
    await page.locator('[data-mount-scroll]').evaluate(element => { element.scrollTop = 0; });
    await button('Toggle mounting active').click();
    await page.locator('[data-mount-state][data-active="false"]').waitFor();
    await button('Toggle mounting Activity').click();
    await page.locator('[data-mount-state][data-visible="false"]').waitFor();
    await button('Inactive external highlight then activate and show').click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator(marks).count(), 0, `${label}: an inactive saved generation cannot queue visible external DOM through same-task activation and reveal`);
    assert.equal(await page.getByRole('heading', { name: 'External mount destination', exact: true }).evaluate(element => element === document.activeElement), false);
    assert.equal(await page.locator('[data-external-scroll]').evaluate(element => element.scrollTop), 0);
    assert.equal(await title.evaluate(element => element === document.activeElement), false);
    assert.equal(await page.locator('[data-mount-scroll]').evaluate(element => element.scrollTop), 0);
    await button('Saved mounting highlight').click();
    await highlighted(`${label} explicit request after inactive generation reconnect`);
    await button('Cancel mounting highlight').click();
    assert.equal(await page.locator(marks).count(), 0);
  }
}

withDevBrowser(async ({ browser, base }) => {
    const capturePage = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await testSubmenuCaptureHide(capturePage, base); await capturePage.close();
    const callbackPage = await browser.newPage();
    await testMenuCallbackLifecycle(callbackPage, base); await callbackPage.close();
    const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await testSearchInitialFocus(page, base);
    await testMenuActivity(page, base);
    await testMountHighlights(page, base);
    await page.goto(`${base}/tests/fixtures/react-menus/`);
    const first = page.getByRole('region', { name: 'First menu' }), second = page.getByRole('region', { name: 'Second menu' });
    const search = page.getByRole('region', { name: 'Search', exact: true }), input = search.getByRole('searchbox');
    const artifact = page.getByRole('region', { name: 'Artifact', exact: true }), trigger = artifact.getByRole('button', { name: 'Artifact actions' });
    const focused = locator => locator.evaluate(element => element === document.activeElement);
    const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await focused(input), true); assert.equal(await input.evaluate(element => element.matches(':focus-visible')), false, 'programmatic autofocus keeps a neutral ring');
    assert.equal(await first.locator('[data-changes]').textContent(), '0', 'mount emits no selection changes');
    await first.getByRole('button', { name: 'Model settings' }).press('ArrowDown');
    const owner = first.getByRole('menuitem', { name: /Thinking effort/ }); assert.equal(await focused(owner), true);
    await owner.press('ArrowRight'); assert.equal(await focused(first.getByRole('menuitemradio', { name: 'High', exact: true })), true);
    // Reopening an already expanded submenu must enter its committed item,
    // including when the owner is focused before a second Right activation.
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Max', exact: true })), true);
    await owner.click();
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'High', exact: true })), true, 'repeated pointer expansion enters the selected option');
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Max', exact: true })), true, 'keyboard preview works after repeated pointer expansion');
    await owner.focus(); await owner.press('ArrowRight');
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'High', exact: true })), true, 'repeated Right expansion enters the selected option');
    assert.equal(await first.locator('[data-changes]').textContent(), '0', 'repeated expansion and preview never commit a value');
    assert.equal(await first.getByRole('menuitemradio', { name: 'High', exact: true }).getAttribute('aria-checked'), 'true');
    await page.keyboard.press('ArrowUp'); assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Low', exact: true })), true, 'disabled Medium is skipped');
    assert.equal(await first.getByRole('menuitemradio', { name: 'High', exact: true }).getAttribute('aria-checked'), 'true');
    assert.equal(await first.locator('output').first().textContent(), 'low / high', 'focus previews without committing');
    await page.keyboard.press('ArrowUp'); assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Max', exact: true })), true);
    await page.keyboard.press('Escape'); assert.equal(await first.getByRole('menuitemradio').count(), 0); assert.equal(await focused(owner), true);
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Home'); await page.keyboard.press('Enter');
    assert.equal(await first.getByRole('menu').count(), 0); assert.equal(await first.locator('[data-changes]').textContent(), '1'); assert.equal(await focused(first.getByRole('button', { name: 'Model settings' })), true);
    await first.getByRole('button', { name: 'Model settings' }).click(); await owner.press('ArrowRight'); assert.equal(await first.getByRole('menuitemradio', { name: 'Low', exact: true }).getAttribute('aria-checked'), 'true');
    await page.keyboard.press('End'); await page.keyboard.press('Space'); assert.equal(await first.locator('[data-changes]').textContent(), '2');
    await second.getByRole('button', { name: 'Other settings' }).click(); await second.getByRole('menuitem').press('ArrowRight');
    assert.equal(await second.getByRole('menuitemradio', { name: 'Max', exact: true }).getAttribute('aria-checked'), 'true');
    assert.equal(await second.getByRole('menu').first().evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(32, 32, 31)');
    await page.getByRole('button', { name: 'Outside', exact: true }).focus(); assert.equal(await second.getByRole('menu').count(), 0, 'focus leaving closes without stealing focus');
    await first.getByRole('button', { name: 'External selection' }).click(); await first.getByRole('button', { name: 'Model settings' }).click(); await owner.press('ArrowRight');
    assert.equal(await first.getByRole('menuitemradio', { name: 'Low', exact: true }).getAttribute('aria-checked'), 'true');
    await page.keyboard.press('ArrowLeft'); assert.equal(await focused(owner), true); await page.keyboard.press('Escape'); assert.equal(await first.getByRole('menu').count(), 0);
    await first.getByRole('button', { name: 'Remove selection', exact: true }).click();
    await first.getByRole('button', { name: 'Model settings' }).click(); await owner.click();
    await page.keyboard.press('End'); await owner.click();
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'Low', exact: true })), true, 'repeated expansion without a committed option enters the first enabled item');
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(first.getByRole('menuitemradio', { name: 'High', exact: true })), true, 'fallback entry retains disabled-item keyboard skipping');
    assert.equal(await first.getByRole('menuitemradio', { checked: true }).count(), 0, 'fallback focus does not create a committed selection');
    assert.equal(await first.locator('[data-changes]').textContent(), '2');
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');

    assert.equal(await search.getByRole('heading', { level: 4 }).count(), 2);
    await input.fill(' '); assert.equal(await search.getByRole('heading', { level: 4 }).count(), 0); assert.equal(await search.getByRole('button').count(), 3, 'whitespace flattens groups without filtering');
    await input.fill(' APPEAR '); assert.equal(await search.getByRole('button').count(), 1);
    await input.fill('no such setting'); assert.equal(await search.getByRole('status').textContent(), 'No matching settings');
    await input.fill('notifications'); await search.getByRole('button', { name: 'Notifications' }).click();
    const destination = search.getByRole('heading', { name: 'Notifications', exact: true });
    assert.equal(await focused(destination), true); assert.equal(await input.inputValue(), '');
    await page.waitForFunction(() => document.querySelector('[data-row="notifications"] h3').classList.contains('cui-feature-anchor-highlight'));
    const position = await destination.evaluate(element => { const rect = element.getBoundingClientRect(), scroll = document.querySelector('[data-scroll]'), bounds = scroll.getBoundingClientRect(); return Math.abs((rect.top + rect.bottom) / 2 - (bounds.top + bounds.bottom) / 2); });
    assert.ok(position < 2, `target centered within local scroller: ${position}`);
    await search.getByRole('button', { name: 'Appearance' }).click();
    assert.equal(await destination.getAttribute('class'), '', 'new selection clears previous highlight');
    await page.waitForFunction(() => document.querySelector('[data-row="appearance"] h3').classList.contains('cui-feature-anchor-highlight'));
    await page.waitForFunction(() => !document.querySelector('[data-row="appearance"] h3').classList.contains('cui-feature-anchor-highlight'));
    await search.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('button', { name: 'Active', exact: true }).click(); await page.waitForTimeout(300); assert.equal(await search.locator('.cui-feature-anchor-highlight').count(), 0, 'inactive cancels pending settling');
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await search.getByRole('button', { name: 'Language' }).click();
    await page.waitForFunction(() => document.querySelector('[data-row="language"] h3').classList.contains('cui-feature-anchor-highlight'));
    await search.getByRole('button', { name: 'Language' }).click();
    assert.equal(await search.locator('.cui-feature-anchor-highlight').count(), 0, 'reselecting the same target restarts settling');
    await page.waitForFunction(() => document.querySelector('[data-row="language"] h3').classList.contains('cui-feature-anchor-highlight'));

    await trigger.press('Alt+Enter'); const card = artifact.getByRole('menu'); await card.waitFor();
    await page.waitForFunction(() => document.activeElement?.textContent === 'Open1');
    await page.keyboard.press('ArrowDown'); assert.equal(await focused(card.getByRole('menuitem', { name: 'Pin' })), true);
    await page.keyboard.press('ArrowDown'); assert.equal(await focused(card.getByRole('menuitem', { name: 'Open' })), true);
    await page.keyboard.press('2'); assert.equal(await card.count(), 1, 'disabled numeric action is ignored'); assert.equal(await artifact.locator('[data-action]').textContent(), '');
    await page.keyboard.press('3'); assert.equal(await card.count(), 0); assert.equal(await artifact.locator('[data-action]').textContent(), 'pin'); assert.equal(await focused(trigger), true);
    await trigger.click(); await frames(); await page.getByRole('button', { name: 'Outside', exact: true }).focus(); assert.equal(await card.count(), 0); assert.equal(await focused(page.getByRole('button', { name: 'Outside', exact: true })), true);
    // Close before deferred menu focus; preserve the current animated rect as the return origin.
    await trigger.focus();
    const rapid = await trigger.evaluate(async element => {
      element.click(); await new Promise(resolve => requestAnimationFrame(resolve));
      const card = document.querySelector('.cui-palette-card');
      for (const animation of card.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = 65; }
      const rect = card.getBoundingClientRect();
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await new Promise(resolve => requestAnimationFrame(resolve));
      const thumb = document.querySelector('.cui-palette-thumb');
      for (const animation of thumb.getAnimations()) { animation.pause(); animation.currentTime = 0; }
      const returned = thumb.getBoundingClientRect();
      return { from: rect.x, to: returned.x, returning: thumb.dataset.returning, focused: document.activeElement === element };
    });
    assert.equal(rapid.returning, 'true'); assert.ok(Math.abs(rapid.from - rapid.to) < 1); assert.equal(rapid.focused, true);
    await frames(); assert.equal(await focused(trigger), true, 'cancelled two-frame autofocus never fires after close');
    await trigger.click(); await frames(); assert.equal(await artifact.locator('[data-returning]').count(), 0, 'reopening clears return motion');
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); assert.equal(await card.count(), 0); assert.equal(await artifact.locator('[data-returning]').count(), 0);
    await artifact.getByRole('button', { name: 'Image failure' }).click(); await trigger.click(); await frames(); await page.keyboard.press('Escape'); assert.equal(await artifact.locator('[data-returning]').count(), 0, 'failed artwork skips return motion');
    await trigger.click(); await page.getByRole('button', { name: 'Mount', exact: true }).click(); await frames(); assert.equal(await card.count(), 0);
    await page.getByRole('button', { name: 'Mount', exact: true }).click(); assert.equal(await first.locator('[data-changes]').textContent(), '0');

    // focus() synchronously calls the host before the settling controller exists.
    // Cancelling or replacing that request must win after the host returns.
    const highlightMarks = '.cui-feature-anchor-highlight, .cui-feature-anchor-row-fill';
    for (const focusCase of ['cancel', 'inactive', 'replace', 'unmount', 'hidden', 'pagehide']) {
      await page.goto(`${base}/tests/fixtures/react-menus/reentry.html?focus=${focusCase}`);
      await page.getByRole('button', { name: 'Saved highlight first', exact: true }).click();
      await page.waitForTimeout(500);
      if (focusCase === 'replace') {
        await page.waitForFunction(() => document.querySelector('[data-target="second"] h3').classList.contains('cui-feature-anchor-highlight'));
        assert.equal(await page.locator('[data-target="first"] .cui-feature-anchor-highlight').count(), 0, 'outer focus request cannot overwrite its nested replacement');
        assert.equal(await page.locator('[data-target="first"].cui-feature-anchor-row-fill').count(), 0);
        assert.equal(await page.locator('[data-target="second"] .cui-feature-anchor-highlight').count(), 1, 'nested destination retains the only active request');
        assert.equal(await page.locator('[data-target="second"].cui-feature-anchor-row-fill').count(), 1);
      } else {
        assert.equal(await page.locator(highlightMarks).count(), 0, `${focusCase} inside focus prevents pending highlight from starting`);
      }
      await page.getByRole('button', { name: 'Cancel highlight', exact: true }).click();
      assert.equal(await page.locator(highlightMarks).count(), 0, `${focusCase}: cancellation owns every row and title`);
      if (focusCase === 'inactive' || focusCase === 'hidden') {
        await page.getByRole('button', { name: 'Saved highlight second', exact: true }).click();
        await page.waitForTimeout(500);
        assert.equal(await page.locator(highlightMarks).count(), 0, `${focusCase}: a saved callback cannot restart disconnected or inactive work`);
        await page.getByRole('button', { name: focusCase === 'hidden' ? 'Toggle Activity' : 'Toggle active', exact: true }).click();
        await page.getByRole('button', { name: 'Saved highlight second', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('[data-target="second"] h3').classList.contains('cui-feature-anchor-highlight'));
        await page.getByRole('button', { name: 'Cancel highlight', exact: true }).click();
        assert.equal(await page.locator(highlightMarks).count(), 0, `${focusCase}: saved methods work after reactivation and still clean up`);
      }
    }

    await page.goto(`${base}/tests/fixtures/react-menus/reentry.html`);
    await page.evaluate(() => { window.retainedHighlightTitle = document.querySelector('[data-target="second"] h3'); });
    await page.getByRole('button', { name: 'Saved highlight second', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-target="second"] h3').classList.contains('cui-feature-anchor-highlight'));
    await page.getByRole('button', { name: 'Toggle Activity', exact: true }).click();
    assert.equal(await page.locator(highlightMarks).count(), 0, 'Activity disconnect clears an established highlight');
    await page.getByRole('button', { name: 'Saved highlight second', exact: true }).click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator(highlightMarks).count(), 0, 'saved methods cannot schedule new work while Activity retains hidden DOM');
    await page.getByRole('button', { name: 'Toggle Activity', exact: true }).click();
    assert.equal(await page.evaluate(() => document.querySelector('[data-target="second"] h3') === window.retainedHighlightTitle), true, 'Activity reconnect retains the original target DOM');
    await page.getByRole('button', { name: 'Saved highlight second', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-target="second"] h3').classList.contains('cui-feature-anchor-highlight'));
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    assert.equal(await page.locator(highlightMarks).count(), 0, 'pagehide clears the reconnected controller');
    await page.getByRole('button', { name: 'Toggle mount', exact: true }).click();
    await page.getByRole('button', { name: 'Saved highlight first', exact: true }).click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator(highlightMarks).count(), 0, 'saved methods remain inert after unmount');

    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) for (const locale of ['en', 'zh-Hans']) {
      await page.setViewportSize({ width, height: 1000 }); await page.goto(`${base}/demo/?lang=${locale}#menus`); await page.reload();
      await setTheme(page, theme); await page.evaluate(() => document.fonts.ready);
      const section = page.locator('main section:not([hidden])'); const labels = locale === 'en' ? ['Model settings', 'Thinking effort', 'Artifact actions'] : ['模型设置', '思考深度', '作品操作菜单'];
      await section.getByRole('button', { name: labels[0], exact: false }).click(); await section.getByRole('menuitem').press('ArrowRight');
      assert.equal(await section.getByRole('menuitemradio').count(), 4);
      await page.keyboard.press('ArrowUp');
      assert.equal(await focused(section.getByRole('menuitemradio', { name: 'Medium', exact: true })), true);
      const preview = locale === 'en' ? 'Focus preview: Medium · Selected: High' : '聚焦预览：Medium · 已选：High';
      assert.equal(await section.getByText(preview, { exact: true }).count(), 1, 'preview includes both focused and committed values');
      assert.equal(await section.getByRole('menuitemradio', { name: 'High', exact: true }).getAttribute('aria-checked'), 'true');
      await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
      await section.getByRole('button', { name: labels[2], exact: true }).click(); await frames();
      assert.equal(await section.getByRole('menu').count(), 1);
      const overflow = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, viewport: innerWidth,
        offenders: [...document.querySelectorAll('body *')].filter(element => element.getClientRects().length).map(element => ({ element: element.tagName, classes: element.className, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })).filter(rect => rect.left < -.5 || rect.right > innerWidth + .5).slice(-15),
      }));
      assert.equal(overflow.width <= overflow.viewport, true, `${width}/${theme}/${locale} has no overflow: ${JSON.stringify(overflow)}`);
      const rect = await section.locator('.cui-palette-card').boundingBox(); assert.ok(rect.x >= 0 && rect.x + rect.width <= width + 1);
      await page.keyboard.press('Escape');
    }
    // Localization and theme updates retain the destination nodes and pending highlight.
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`${base}/demo/?lang=en#menus`); await page.reload();
    await page.getByRole('button', { name: 'Appearance', exact: true }).click();
    await setLanguage(page, 'zh-Hans');
    await setTheme(page, 'dark');
    await page.locator('.cui-feature-anchor-highlight').waitFor();
    assert.equal(await page.locator('.cui-feature-anchor-highlight').textContent(), '外观');
    assert.deepEqual(errors, []); console.log('React menus: independent consumers, keyboard preview/commit, search/filter/focus/settling and synchronous reentry, descendant ref/layout mount and retained Activity requests with StrictMode on/off, interruptible palette return and bilingual responsive layouts passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
