const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    for (const syncActive of [false, true]) {
      const activityPage = await browser.newPage({ viewport: { width: 1280, height: 1000 } }), activityErrors = [];
      activityPage.on('pageerror', error => activityErrors.push(error.message));
      await activityPage.goto(`${base}/tests/fixtures/react-reading/?activity${syncActive ? '&sync-active' : ''}`);
      if (process.env.READING_ACTIVITY_ONLY !== 'scroll') {
        const activityDialog = activityPage.locator('[data-activity-host] dialog'), expandActivity = activityPage.getByRole('button', { name: 'Expand Activity table', exact: true });
        const retainedDialog = await activityDialog.elementHandle();
        await retainedDialog.evaluate(element => { element.dataset.closes = '0'; element.addEventListener('close', () => { element.dataset.closes = String(Number(element.dataset.closes) + 1); }); });
        await expandActivity.click();
        assert.equal(await activityDialog.evaluate(element => element.open && element.matches(':modal')), true);
        const hidden = await activityPage.evaluate(() => {
          document.querySelector('[data-hide]').click();
          const element = document.querySelector('[data-activity-host] dialog'), outside = document.querySelector('[data-outside]');
          outside.focus();
          const state = { modal: element.open || element.matches(':modal'), outsideFocused: document.activeElement === outside };
          // Open the other modal in the same task, before the old close dispatch.
          [...document.querySelectorAll('button')].find(button => button.textContent === 'Expand other table').click();
          return state;
        });
        assert.equal(hidden.modal, false, 'Activity cleanup releases the native modal even when active changes during hiding');
        assert.equal(hidden.outsideFocused, true, 'a retained hidden dialog cannot leave the rest of the page inert');
        await activityPage.waitForFunction(() => Number(document.querySelector('[data-activity-host] dialog').dataset.closes) === 1);
        const otherDialog = activityPage.getByRole('dialog', { name: 'Other table', exact: true });
        assert.equal(await otherDialog.evaluate(element => element.open && element.contains(document.activeElement)), true, 'cleanup close events do not steal another modal\'s focus');
        await otherDialog.getByRole('button', { name: 'Close other table', exact: true }).click();
        await activityPage.locator('[data-show]').evaluate(element => element.click());
        await activityPage.waitForFunction(() => document.querySelector('[data-activity-host] dialog').open);
        assert.equal(await retainedDialog.evaluate(element => element === document.querySelector('[data-activity-host] dialog') && element.isConnected), true);
        assert.equal(await activityDialog.getByRole('cell', { name: '100ms', exact: true }).count(), 1, 'a close delivered while effects are detached cannot erase the retained open intent');
        for (let repeat = 0; repeat < 2; repeat++) {
          const closes = await retainedDialog.evaluate(element => Number(element.dataset.closes));
          await activityPage.locator('[data-reconnect]').evaluate(element => element.click());
          await activityPage.waitForFunction(closes => Number(document.querySelector('[data-activity-host] dialog').dataset.closes) > closes, closes);
          assert.equal(await retainedDialog.evaluate(element => element.open && element.matches(':modal') && element.contains(document.activeElement)), true, 'an old queued close cannot clear the newly shown dialog or move its focus');
          assert.equal(await activityDialog.getByRole('cell', { name: '100ms', exact: true }).count(), 1);
        }
        await retainedDialog.evaluate(element => element.close());
        await activityPage.waitForFunction(() => !document.querySelector('[data-activity-host] dialog .cui-table'));
        assert.equal(await expandActivity.evaluate(element => element === document.activeElement), true, 'external close still clears expanded content and restores trigger focus');
        for (const showImmediately of [false, true]) {
          await expandActivity.click();
          const closes = await retainedDialog.evaluate(element => Number(element.dataset.closes));
          const closedBeforeHiding = await activityPage.evaluate(showImmediately => {
            const element = document.querySelector('[data-activity-host] dialog'), outside = document.querySelector('[data-outside]');
            // Native close dispatch is queued: the external close and Activity
            // cleanup must happen in this same task, before that event arrives.
            element.close();
            document.querySelector('[data-hide]').click();
            outside.focus();
            const state = { modal: element.open || element.matches(':modal'), outsideFocused: document.activeElement === outside };
            if (showImmediately) document.querySelector('[data-show]').click();
            return state;
          }, showImmediately);
          assert.equal(closedBeforeHiding.modal, false);
          assert.equal(closedBeforeHiding.outsideFocused, true);
          await activityPage.waitForFunction(closes => Number(document.querySelector('[data-activity-host] dialog').dataset.closes) > closes, closes);
          if (!showImmediately) {
            assert.equal(await retainedDialog.evaluate(element => element.isConnected && !element.open), true, 'the external close is delivered while Activity retains the hidden dialog');
            await activityPage.locator('[data-show]').evaluate(element => element.click());
          }
          await activityPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          assert.equal(await retainedDialog.evaluate(element => element === document.querySelector('[data-activity-host] dialog') && element.isConnected), true);
          assert.equal(await activityDialog.evaluate(element => element.open || element.matches(':modal')), false, `an external close before hiding clears open intent (${showImmediately ? 'immediate' : 'after close dispatch'} show)`);
          assert.equal(await activityDialog.locator('.cui-table').count(), 0, 'a genuinely dismissed table does not keep expanded content');
          assert.equal(await activityPage.locator('[data-outside]').evaluate(element => element === document.activeElement), true, 'the dismissed table cannot reclaim focus on show or old close delivery');
        }
        await expandActivity.click();
        await activityPage.locator('[data-active]').evaluate(element => element.click());
        await activityPage.waitForFunction(() => !document.querySelector('[data-activity-host] dialog').open && !document.querySelector('[data-activity-host] dialog .cui-table'));
        await activityPage.locator('[data-active]').evaluate(element => element.click());
        assert.equal(await activityDialog.evaluate(element => element.open), false, 'a committed active=false clears open intent');
        await expandActivity.click(); await activityPage.keyboard.press('Escape');
        await activityPage.waitForFunction(() => !document.querySelector('[data-activity-host] dialog .cui-table'));
        assert.equal(await expandActivity.evaluate(element => element === document.activeElement), true, 'Escape keeps the ordinary focus-return path');
      }
      const activityScroll = activityPage.getByRole('region', { name: 'Activity scroll', exact: true }), retainedScroll = await activityScroll.elementHandle();
      const bottom = () => activityScroll.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop);
      await activityPage.waitForFunction(() => { const element = document.querySelector('[aria-label="Activity scroll"]'); return element.scrollHeight - element.clientHeight - element.scrollTop <= 2; });
      await activityScroll.evaluate(element => { element.scrollTop = 150; element.dispatchEvent(new Event('scroll')); });
      const paused = await activityScroll.evaluate(element => element.scrollTop);
      await activityPage.locator('[data-reconnect]').evaluate(element => element.click());
      await activityPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await retainedScroll.evaluate(element => element === document.querySelector('[aria-label="Activity scroll"]') && element.isConnected), true);
      assert.equal(await activityScroll.evaluate(element => element.scrollTop), paused, 'Activity reconnection preserves a paused reading position when resetKey is unchanged');
      await activityPage.locator('[data-append]').evaluate(element => element.click());
      await activityPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await activityScroll.evaluate(element => element.scrollTop), paused, 'the paused follow mode also survives reconnection');
      await activityPage.getByRole('button', { name: 'Return Activity', exact: true }).click();
      await activityPage.locator('[data-reconnect]').evaluate(element => element.click());
      await activityPage.locator('[data-append]').evaluate(element => element.click());
      await activityPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.ok(await bottom() <= 2, 'a following reader keeps following after reconnection');
      await activityScroll.evaluate(element => { element.scrollTop = 150; element.dispatchEvent(new Event('scroll')); });
      await activityPage.locator('[data-reset]').evaluate(element => element.click());
      await activityPage.waitForFunction(() => { const element = document.querySelector('[aria-label="Activity scroll"]'); return element.scrollHeight - element.clientHeight - element.scrollTop <= 2; });
      await activityScroll.evaluate(element => { element.scrollTop = 150; element.dispatchEvent(new Event('scroll')); });
      await activityPage.locator('[data-hide]').evaluate(element => element.click());
      await activityPage.locator('[data-reset]').evaluate(element => element.click());
      await activityPage.locator('[data-append]').evaluate(element => element.click());
      await activityPage.locator('[data-show]').evaluate(element => element.click());
      await activityPage.waitForFunction(() => { const element = document.querySelector('[aria-label="Activity scroll"]'); return element.scrollHeight - element.clientHeight - element.scrollTop <= 2; });
      assert.ok(await bottom() <= 2, 'a resetKey change while hidden is applied on reconnection');
      await activityPage.locator('[data-follow]').evaluate(element => element.click());
      await activityScroll.evaluate(element => { element.scrollTop = 150; element.dispatchEvent(new Event('scroll')); });
      await activityPage.locator('[data-reset]').evaluate(element => element.click());
      assert.equal(await activityScroll.evaluate(element => element.scrollTop), 0, 'an explicit reset still returns to the top when content following is disabled');
      await activityScroll.evaluate(element => { element.scrollTop = 150; element.dispatchEvent(new Event('scroll')); });
      await activityPage.locator('[data-hide]').evaluate(element => element.click());
      await activityPage.locator('[data-reset]').evaluate(element => element.click());
      await activityPage.locator('[data-show]').evaluate(element => element.click());
      assert.equal(await activityScroll.evaluate(element => element.scrollTop), 0, 'a hidden reset also resets static content on reconnect');
      assert.deepEqual(activityErrors, []);
      await activityPage.close();
    }
    console.log('Reading Activity: retained dialogs release/reconnect safely and scroll position/follow mode survive unchanged resetKey.');
    if (process.env.READING_ACTIVITY_ONLY) return;
    // Use the native clipboard in a separate context: mocked execCommand success
    // would miss the browser silently retaining old text outside a modal.
    const nativeContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const nativePage = await nativeContext.newPage();
    await nativePage.goto(`${base}/tests/fixtures/react-reading/`);
    await nativePage.getByRole('button', { name: 'Open copy modal', exact: true }).click();
    await nativePage.evaluate(async () => {
      window.nativeClipboard = navigator.clipboard;
      await window.nativeClipboard.writeText('before modal copy');
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
      const range = document.createRange(); range.selectNodeContents(document.querySelector('[data-modal-selection]'));
      getSelection().removeAllRanges(); getSelection().addRange(range);
    });
    const modal = nativePage.getByRole('dialog', { name: 'Copy modal', exact: true });
    const modalCopy = modal.getByRole('button', { name: 'Copy modal source', exact: true });
    await modalCopy.focus(); await modalCopy.press('Enter');
    assert.equal(await nativePage.evaluate(() => window.nativeClipboard.readText()), '  modal\n\tcode\n', 'fallback copies the exact source within the active native modal');
    assert.equal(await modal.getByRole('status').textContent(), 'Modal copied');
    assert.equal(await modalCopy.evaluate(element => element === document.activeElement), true, 'modal fallback restores button focus');
    assert.equal(await nativePage.evaluate(() => getSelection().toString()), 'Read these words.', 'modal fallback restores the previous document selection');
    assert.equal(await nativePage.locator('textarea').count(), 0, 'temporary fallback input is removed');
    await nativePage.evaluate(async () => {
      await window.nativeClipboard.writeText('keep clipboard when selection fails');
      window.nativeTextareaSelect = HTMLTextAreaElement.prototype.select;
      HTMLTextAreaElement.prototype.select = function () {};
    });
    await modalCopy.press('Enter');
    assert.equal(await modal.getByRole('status').textContent(), 'Modal failed', 'unavailable input selection cannot report copy success');
    assert.equal(await nativePage.evaluate(() => window.nativeClipboard.readText()), 'keep clipboard when selection fails');
    assert.equal(await modalCopy.evaluate(element => element === document.activeElement), true, 'failed fallback still restores focus');
    assert.equal(await nativePage.evaluate(() => getSelection().toString()), 'Read these words.');
    assert.equal(await nativePage.locator('textarea').count(), 0, 'failed fallback also removes its temporary input');
    await nativePage.evaluate(() => { HTMLTextAreaElement.prototype.select = window.nativeTextareaSelect; });
    await modal.getByRole('button', { name: 'Close copy modal', exact: true }).click();
    const nativeCopy = nativePage.getByRole('button', { name: 'Copy source', exact: true });
    await nativeCopy.focus(); await nativeCopy.press('Enter');
    assert.equal(await nativePage.evaluate(() => window.nativeClipboard.readText()), '  first\n\tsecond\n', 'native fallback still copies outside a modal');
    assert.equal(await nativePage.getByRole('status').textContent(), 'Copied');
    assert.equal(await nativeCopy.evaluate(element => element === document.activeElement), true);
    await nativeContext.close();
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      window.clipboardRequests = [];
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: text => new Promise((resolve, reject) => window.clipboardRequests.push({ text, resolve, reject })) }, configurable: true });
    });
    await page.goto(`${base}/tests/fixtures/react-reading/`);
    assert.equal(await page.locator('.cui-grapheme').count(), 5, 'graphemes preserve combining characters and emoji');
    const copy = page.getByRole('button', { name: 'Copy source' });
    await copy.focus(); await copy.press('Enter');
    assert.equal(await page.evaluate(() => window.clipboardRequests[0].text), '  first\n\tsecond\n');
    await page.evaluate(() => window.clipboardRequests[0].resolve());
    await page.waitForFunction(() => document.querySelector('[role=status]').textContent === 'Copied');
    assert.equal(await copy.locator('[data-glyph]').getAttribute('data-glyph'), 'Check');
    await copy.press('Enter'); await copy.press('Enter');
    await page.evaluate(() => { window.clipboardRequests[2].reject(new Error('denied')); window.clipboardRequests[1].resolve(); });
    await page.waitForFunction(() => document.querySelector('[role=status]').textContent === 'Failed');
    await page.waitForTimeout(2100);
    assert.equal(await page.getByRole('status').textContent(), 'Failed', 'old success timer cannot clear latest failure');
    await copy.press('Enter');
    await page.evaluate(() => window.clipboardRequests[3].resolve());
    await page.waitForFunction(() => document.querySelector('[role=status]').textContent === 'Copied');
    await page.waitForFunction(() => document.querySelector('[role=status]').textContent === '');
    assert.equal(await copy.locator('[data-glyph]').getAttribute('data-glyph'), 'Copy');
    const expand = page.getByRole('button', { name: 'Expand', exact: true });
    assert.equal(await expand.isVisible(), true);
    await expand.click();
    const dialog = page.getByRole('dialog', { name: 'Independent table' });
    await dialog.waitFor();
    assert.equal(await dialog.getByRole('cell', { name: '100ms' }).count(), 1);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await expand.evaluate(element => element === document.activeElement), true, 'dialog returns focus');
    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    await expand.click();
    assert.equal(await dialog.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(32, 32, 31)', 'dialog inherits the scoped dark popover surface');
    await dialog.getByRole('button', { name: 'Close table' }).click();
    await dialog.waitFor({ state: 'hidden' });
    const scroll = page.getByRole('region', { name: 'Live content' });
    const gap = () => scroll.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop);
    await page.waitForFunction(() => { const element = document.querySelector('[aria-label="Live content"]'); return element.scrollHeight - element.clientHeight - element.scrollTop < 2; });
    await scroll.press('Home');
    await page.getByRole('button', { name: 'Return', exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('[aria-label="Live content"]').scrollTop === 0);
    const before = await scroll.evaluate(element => element.scrollTop);
    await page.getByRole('button', { name: 'Append', exact: true }).click();
    await page.waitForTimeout(80);
    assert.equal(await scroll.evaluate(element => element.scrollTop), before, 'appending cannot steal a paused reading position');
    assert.ok(await gap() > 200);
    await page.getByRole('button', { name: 'Return', exact: true }).click();
    assert.ok(await gap() <= 2);
    assert.equal(await scroll.evaluate(element => element === document.activeElement), true);
    await page.getByRole('button', { name: 'Append', exact: true }).click();
    await page.waitForTimeout(80);
    assert.ok(await gap() <= 2, 'following resumes');
    await scroll.press('Home');
    await page.waitForFunction(() => document.querySelector('[aria-label="Return"] img')?.getAnimations().some(animation => animation.playState === 'running'));
    await page.getByRole('button', { name: 'Return', exact: true }).locator('img').evaluate(element => {
      window.beforeReplayMark = element.getAnimations().find(animation => animation.playState === 'running');
      window.beforeReplayMark.currentTime = 500;
    });
    // Invoke the host reset without scrolling the example out of view. The
    // original replay cancels its mark, rather than resuming the old phase.
    await page.getByRole('button', { name: 'Replay following', exact: true }).evaluate(element => element.click());
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.deepEqual(await page.evaluate(() => ({ state: window.beforeReplayMark.playState, time: window.beforeReplayMark.currentTime })), { state: 'idle', time: null }, 'resetKey cancels the old native animation');
    await scroll.press('Home');
    await page.waitForFunction(() => document.querySelector('[aria-label="Return"] img')?.getAnimations().some(animation => animation.playState === 'running'));
    assert.equal(await page.getByRole('button', { name: 'Return', exact: true }).locator('img').evaluate(element => element.getAnimations().some(animation => animation.playState === 'running' && animation !== window.beforeReplayMark)), true, 'the next visible busy mark uses a fresh animation lifecycle');
    await copy.focus(); await copy.press('Enter');
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await page.evaluate(() => window.clipboardRequests[4].resolve());
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    assert.equal(await page.getByRole('status').textContent(), '', 'late completion does not cross component lifetimes');

    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/demo/?lang=en#reading`);
      await setTheme(page, theme);
      await page.evaluate(() => document.fonts.ready);
      const numbers = page.locator('[data-number-sample]');
      await numbers.first().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('[data-number-sample="0"]').textContent !== '00:00.00');
      const sameFrame = await numbers.evaluateAll(elements => elements.map(element => element.textContent));
      assert.equal(sameFrame[0], sameFrame[1]);
      const baseline = await page.locator('.demo-baseline-line').evaluateAll(rows => rows.map(row => row.querySelector('.cui-icon').getBoundingClientRect().bottom - row.querySelector('.demo-baseline-guide').getBoundingClientRect().top));
      assert.ok(Math.abs(baseline[1] - baseline[0] - 2) < .2, `baseline ${baseline}`);
      await page.getByRole('radio', { name: 'Code & tables', exact: true }).click();
      const frozen = await numbers.first().textContent();
      await page.waitForTimeout(120);
      assert.equal(await numbers.first().textContent(), frozen, 'hidden number sample pauses');
      await page.getByRole('button', { name: 'Expand table ↗' }).click();
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await setLanguage(page, 'zh-Hans');
      assert.equal(await page.getByRole('radio', { name: '代码与表格', exact: true }).getAttribute('aria-checked'), 'true');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `reading overflow ${width}/${theme}`);
      await chooseChapter(page, 'type');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `typography overflow ${width}/${theme}`);
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`${base}/demo/?lang=en#type`);
    const heading = page.locator('.demo-type-heading');
    await heading.scrollIntoViewIfNeeded();
    const waitForHeadingPlayback = () => page.waitForFunction(() => document.querySelector('.demo-type-heading').getAnimations({ subtree: true }).some(animation => animation.playState === 'running'));
    const finishHeadingPlayback = () => heading.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => animation.finish()));
    await waitForHeadingPlayback(); await finishHeadingPlayback();
    for (const locale of ['zh-Hans', 'en', 'zh-Hans', 'en']) {
      await setLanguage(page, locale);
      assert.equal(await heading.evaluate(element => element.getAnimations({ subtree: true }).length), 0, `${locale} language changes replace the title without replaying it`);
    }
    await page.getByRole('button', { name: 'Replay grapheme reveal', exact: true }).click();
    await waitForHeadingPlayback(); await finishHeadingPlayback();
    await setLanguage(page, 'zh-Hans');
    await page.getByRole('button', { name: '重播逐字浮现', exact: true }).click();
    await waitForHeadingPlayback(); await finishHeadingPlayback();
    await setLanguage(page, 'en'); await setLanguage(page, 'zh-Hans');
    assert.equal(await heading.evaluate(element => element.getAnimations({ subtree: true }).length), 0, 'returning to a manually replayed language also stays static');
    await setLanguage(page, 'en');
    await chooseChapter(page, 'controls'); await chooseChapter(page, 'type');
    await heading.scrollIntoViewIfNeeded();
    await waitForHeadingPlayback();
    const stream = page.locator('[role=region][aria-label="Streaming text example"]');
    await stream.scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Replay scroll following' }).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="Streaming text example"]').textContent.includes('As content unfolds'));
    await chooseChapter(page, 'controls');
    const stopped = await stream.textContent();
    await page.waitForTimeout(800);
    assert.equal(await stream.textContent(), stopped, 'hidden chapter stops demo arrival timers');
    await chooseChapter(page, 'type');
    await stream.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('[aria-label="Streaming text example"]').textContent.includes('As content unfolds'));
    assert.deepEqual(errors, []);
    console.log('Reading consumer, clipboard races, native dialog focus/theme, graphemes, scroll ownership, counter lifecycle and responsive chapters passed.');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
