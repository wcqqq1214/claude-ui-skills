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
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
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
    await page.getByRole('button', { name: 'Repeat', exact: true }).click(); await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Repeat', exact: true }).click();
    await page.getByRole('button', { name: 'Repeat', exact: true }).click();
    assert.equal(await stack.locator('[data-cui-notice]:not([data-ending])').count(), 1);
    assert.ok((await front().textContent()).includes('×3')); assert.equal(await front().getAttribute('aria-live'), 'off');
    await page.waitForTimeout(500); assert.equal(await front().count(), 1, 'repeat resets deadline');
    await page.waitForFunction(() => !document.querySelector('[aria-label="Stack"] [data-cui-notice]'));
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
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
