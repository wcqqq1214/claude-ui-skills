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
    // Exercise the production controller with a deterministic animation clock.
    // These assertions preserve the original authored seam/entry/exit contract.
    const { createStatusPlayback } = await server.ssrLoadModule('/src/components/feedback/statusPlayback.ts');
    const originalImage = global.Image, originalSetTimeout = global.setTimeout, originalClearTimeout = global.clearTimeout;
    const timers = new Map(); let timerId = 0;
    global.Image = class { decode() { return Promise.resolve(); } };
    global.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, {fn, delay}); return id; };
    global.clearTimeout = id => timers.delete(id);
    try {
      const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
      function harness() {
        timers.clear(); const entries = [], animations = [], host = { dataset: {} }; let completed = 0;
        const strip = { style: {}, animate(_frames, timing) {
          let resolve, reject;
          const animation = { currentTime: 0, timing, finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
            cancel() { reject(Error('cancelled')); }, pause() {}, play() {}, end() { this.currentTime = timing.duration; resolve(); } };
          animations.push(animation); return animation;
        } };
        const mark = createStatusPlayback(host, strip, activity => entries.push(activity), () => completed++);
        mark.pause(false);
        const current = () => animations.at(-1), end = async () => { current().end(); await flush(); };
        return {mark, host, entries, current, end, completed: () => completed,
          start: async activity => { mark.start(activity); await flush(); await end(); await end(); },
          select: async activity => { mark.select(activity); await flush(); },
          fire: async () => { assert.equal(timers.size, 1); const [id, timer] = [...timers][0]; timers.delete(id); timer.fn(); await flush(); },
        };
      }
      {
        const h = harness(); h.mark.start('think'); h.mark.finish(); h.mark.dispose(); await flush();
        assert.equal(h.completed(), 0, 'StrictMode cleanup suppresses immediate completion from its probe mount');
        const live = harness(); live.mark.start('think'); live.mark.finish(); await flush();
        assert.equal(live.completed(), 1); live.mark.dispose();
        const ImageWithDecode = global.Image;
        global.Image = class { decode() { return Promise.reject(Error('missing artwork')); } };
        const failed = harness(); failed.mark.start('code'); await flush();
        assert.equal(failed.host.dataset.phase, 'dot');
        failed.mark.finish(); await flush(); assert.equal(failed.completed(), 1, 'failed decoding cannot strand completion');
        failed.mark.dispose(); global.Image = ImageWithDecode;
      }
      for (const [activity, time, expected] of [
        ['think', 1749, 54 * 33.3333 - 1749], ['think', 1750, null],
        ['code', 1000, 37 * 33.3333 - 1000], ['code', 1900, null], ['read', 1000, null], ['write', 1000, null],
      ]) {
        const h = harness(); await h.start(activity); h.current().currentTime = time;
        await h.select(activity === 'read' ? 'write' : 'read');
        assert.equal(timers.size, expected === null ? 0 : 1);
        if (expected !== null) { assert.equal([...timers.values()][0].delay, expected); await h.fire(); }
        else await h.end();
        assert.equal(h.host.dataset.phase, activity + '-out');
        assert.deepEqual(h.entries, [activity]); h.mark.dispose(); await flush();
      }
      {
        const h = harness(); h.mark.start('code'); await flush(); await h.end();
        await h.select('read'); assert.equal(h.host.dataset.phase, 'code-in');
        await h.end(); assert.equal(h.host.dataset.phase, 'code-loop'); await h.fire();
        await h.select('write'); await h.select('think'); await h.end();
        assert.equal(h.host.dataset.phase, 'think-in'); assert.deepEqual(h.entries, ['code', 'think']);
        await h.end(); await h.select('code'); assert.equal(timers.size, 1);
        h.mark.pause(true); assert.equal(timers.size, 0, 'hidden mark cancels wall-clock seam');
        h.mark.pause(false); assert.equal(timers.size, 1, 'resume recomputes seam from animation time');
        await h.select('think'); assert.equal(timers.size, 0);
        h.mark.finish(); await h.end(); assert.equal(h.host.dataset.phase, 'think-out');
        await h.select('read'); await h.end(); assert.equal(h.host.dataset.phase, 'read-in'); assert.equal(h.completed(), 0);
        h.mark.finish(); await h.end(); await h.end(); assert.equal(h.host.dataset.phase, 'done'); assert.equal(h.completed(), 1);
        h.mark.start('code'); await flush(); const stale = h.current(); h.mark.start('write'); await flush(); stale.end(); await flush();
        assert.equal(h.host.dataset.phase, 'grow'); await h.end(); assert.equal(h.host.dataset.phase, 'write-in');
        h.mark.dispose(); await flush(); assert.equal(timers.size, 0);
      }
    } finally { global.Image = originalImage; global.setTimeout = originalSetTimeout; global.clearTimeout = originalClearTimeout; }

    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${base}/tests/fixtures/react-feedback/`);
    const mark = page.locator('.cui-status-mark');
    const phase = value => page.waitForFunction(value => document.querySelector('.cui-status-mark').dataset.phase === value, value);
    await phase('think-loop');
    assert.equal(await page.locator('#entered').textContent(), 'think');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForTimeout(80);
    const pausedTime = await mark.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime);
    await page.waitForTimeout(100);
    assert.equal(await mark.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime), pausedTime);
    await page.getByRole('button', { name: 'code', exact: true }).click();
    assert.equal(await page.locator('#entered').textContent(), 'think');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await phase('code-in'); assert.equal(await page.locator('#entered').textContent(), 'code');
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await phase('done'); assert.equal(await page.locator('#completed').textContent(), '1');
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await phase('code-loop');
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await page.waitForTimeout(100); await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await phase('grow'); assert.equal(await page.locator('#completed').textContent(), '1');
    const trigger = page.getByRole('button', { name: 'Details', exact: true });
    const region = page.getByRole('region', { name: 'Details', exact: true });
    await trigger.focus(); await trigger.press('Enter'); await region.waitFor();
    await region.getByRole('textbox').fill('retained');
    await region.getByRole('button', { name: 'Close from inside' }).click();
    assert.equal(await trigger.evaluate(element => element === document.activeElement), true, 'collapse returns focus from the panel');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await trigger.press('Space');
    assert.equal(await region.getByRole('textbox').inputValue(), 'retained');
    assert.equal(await page.getByRole('button', { name: 'Other details' }).getAttribute('aria-expanded'), 'false');
    const mask = page.locator('.cui-skeleton > div').first();
    const oldMask = await mask.evaluate(element => element.style.clipPath);
    assert.ok(oldMask.includes('300'), 'shared sweep covers the measured row');
    await page.getByRole('button', { name: 'Resize' }).click();
    await page.waitForFunction(() => document.querySelector('.cui-skeleton > div').style.clipPath.includes('200'));
    assert.notEqual(await mask.evaluate(element => element.style.clipPath), oldMask);
    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    assert.equal(await page.locator('[data-cui-skeleton-line]').first().evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(255, 255, 255, 0.075)');

    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/demo/?lang=en#feedback`);
      await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption(theme);
      await page.getByRole('button', { name: '3 design observations collected Expand to see the process' }).click();
      await page.getByRole('region', { name: '3 design observations collected Expand to see the process' }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${theme} no page overflow`);
      await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('zh-Hans');
      assert.equal(await page.getByRole('button', { name: '已整理 3 项设计观察 展开查看过程' }).getAttribute('aria-expanded'), 'true', 'locale preserves disclosure');
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`${base}/demo/?lang=en#feedback`); await phase('think-loop');
    await page.getByRole('link', { name: 'Typography', exact: false }).click();
    await page.waitForTimeout(100);
    const hiddenTime = await mark.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime);
    await page.waitForTimeout(150);
    assert.equal(await mark.evaluate(element => element.firstElementChild.getAnimations()[0].currentTime), hiddenTime, 'hidden chapter pauses authored motion');
    assert.deepEqual(errors, []);
    console.log('React feedback: authored seams, latest handoff, completion/replay, pause, StrictMode, source-only geometry, disclosure focus and responsive bilingual demo passed');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
