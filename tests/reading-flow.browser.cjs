// Explicit browser gate: PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/reading-flow.browser.cjs
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFile} = require('node:fs/promises');
const {resolve, extname, sep} = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = resolve(__dirname, '..');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.webp':'image/webp'};
(async () => {
  const server = createServer(async (req, res) => {
    try {
      const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const data = await readFile(path);
      res.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream'}).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROME_BIN, headless: true});
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.url() + ': ' + r.status()); });
    const url = `http://127.0.0.1:${server.address().port}/showcase/index.html?lang=en`;
    await page.goto(url + '#workspace');
    await page.evaluate(() => document.fonts.ready);
    const viewport = page.locator('#readingFlowViewport');
    const toggle = page.locator('#readingNotesToggle');
    const handle = page.locator('#readingNotesResize');
    const settled = () => page.waitForFunction(() => !document.querySelector('#readingNotes').getAnimations().length);
    const isOpen = () => page.locator('#readingNotes').isVisible();
    const passage = () => viewport.evaluate(el => {
      const top = el.getBoundingClientRect().top;
      const nodes = [...el.querySelectorAll('h4,p')];
      const i = nodes.findIndex(n => n.getBoundingClientRect().bottom > top);
      const r = nodes[i].getBoundingClientRect();
      return {i, fraction:(top-r.top)/r.height};
    });
    const samePassage = async (before) => {
      const after = await passage();
      assert.equal(after.i, before.i, 'same visible passage');
      assert.ok(Math.abs(after.fraction-before.fraction) < .04, JSON.stringify({before,after}));
    };
    // A native wheel scroll, then layout reflows in both directions.
    await viewport.hover();
    await page.mouse.wheel(0, 470);
    await page.waitForTimeout(250);
    assert.ok(await viewport.evaluate(e => e.scrollTop) > 100);
    const before = await passage();
    await toggle.click(); await settled();
    assert.equal(await isOpen(), true);
    assert.equal(await page.locator('#readingNotesClose').evaluate(e => e === document.activeElement), true);
    await samePassage(before);
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await handle.getAttribute('aria-valuenow'), '268');
    await samePassage(before);
    await page.keyboard.press('Home'); assert.equal(await handle.getAttribute('aria-valuenow'), '200');
    await page.keyboard.press('End'); assert.equal(await handle.getAttribute('aria-valuenow'), '320');
    await page.keyboard.press('Enter'); assert.equal(await handle.getAttribute('aria-valuenow'), '260');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#readingNotesClose').evaluate(e => e === document.activeElement), true);
    await page.keyboard.press('Escape'); await settled();
    assert.equal(await isOpen(), false);
    assert.equal(await toggle.evaluate(e => e === document.activeElement), true);
    await samePassage(before);
    console.log('PASS wheel reading position, keyboard resize, Tab exit and Escape focus return');

    await toggle.click(); await settled();
    const box = await handle.boundingBox();
    await page.mouse.move(box.x+box.width/2, box.y+50); await page.mouse.down();
    await page.mouse.move(box.x-35, box.y+50, {steps:4}); await page.mouse.up();
    const dragged = Number(await handle.getAttribute('aria-valuenow'));
    assert.ok(dragged > 285);
    await samePassage(before);
    // Browser-dispatched pointercancel exercises the cancel handler, not an OS gesture.
    const box2 = await handle.boundingBox();
    await page.mouse.move(box2.x+4, box2.y+50); await page.mouse.down();
    await page.mouse.move(box2.x+55, box2.y+50);
    await handle.dispatchEvent('pointercancel', {pointerId:1}); await page.mouse.up();
    assert.equal(Number(await handle.getAttribute('aria-valuenow')), dragged);
    await samePassage(before);
    for (let i=0;i<8;i++) {
      await toggle.click();
      await page.waitForFunction(() => document.querySelector('#readingNotes').getAnimations().length > 0);
      await toggle.click(); await settled();
      assert.equal(await isOpen(), true);
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), dragged);
    }
    await samePassage(before);
    console.log('PASS pointer resize, cancellation and eight interrupted close/reopen cycles');

    await page.locator('#readingFlowReset').click();
    assert.equal(await isOpen(), false);
    assert.equal(await viewport.evaluate(e => e.scrollTop), 0);
    await viewport.focus(); await page.keyboard.press('PageDown');
    await page.waitForTimeout(250);
    assert.ok(await viewport.evaluate(e => e.scrollTop) > 0);
    await toggle.click(); await settled();
    assert.equal(await handle.getAttribute('aria-valuenow'), '260');
    await page.emulateMedia({reducedMotion:'reduce'});
    await toggle.click(); await toggle.click();
    assert.equal(await isOpen(), true);
    assert.equal(await page.locator('#readingNotes').evaluate(e => e.getAnimations().length), 0);
    assert.equal(await page.locator('#readingNotesClose').evaluate(e => e === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await isOpen(), false);
    await page.emulateMedia({reducedMotion:'no-preference'});
    console.log('PASS reset and live reduced-motion preference');

    // Preserve all old entry points, language and original panel behavior.
    await page.locator('#expandPanel').click();
    assert.equal(await page.locator('#workspaceCard').evaluate(e => e.classList.contains('expanded')), true);
    await page.locator('#expandPanel').click();
    await page.locator('#resizeHandle').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#resizeHandle').getAttribute('aria-valuenow'), '252');
    await page.keyboard.press('Enter');
    await page.locator('#fileSegment [data-value="code"]').click();
    await page.locator('[data-file="tokens"]').click();
    assert.equal(await page.locator('#fileContent pre').count(), 1);
    await toggle.click();
    await page.locator('nav a[href="#controls"]').click();
    assert.equal(await page.locator('#readingNotes').evaluate(e => e.getAnimations().length), 0);
    await page.goBack(); assert.equal(await isOpen(), true);
    const links = await page.locator('#chapterNav a').evaluateAll(a => a.map(e => e.hash));
    assert.equal(links.length, 13);
    for (const hash of links) {
      await page.goto(url + hash);
      assert.equal(await page.locator('.specimen[data-active]').getAttribute('id'), hash.slice(1));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.goto(url);
    assert.equal(await page.locator('.specimen[data-active]').getAttribute('id'), 'type');
    await page.goto(url + '#workspace');
    await toggle.click(); await settled();
    await page.locator('#languageBtn').click();
    await page.locator('[data-locale="zh-Hans"]').click();
    assert.equal(await toggle.innerText(), '收起笔记');
    assert.equal(await isOpen(), true);
    // Reach dark explicitly rather than depending on host/system theme.
    while (await page.locator('html').getAttribute('data-theme') !== 'dark')
      await page.locator('#themeBtn').click();
    if (process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,'reading-desktop.png'),fullPage:true});
    console.log('PASS 13 chapter routes, default route, history, original panel and live language/theme');

    await handle.focus();
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(() => document.activeElement.id === 'readingNotesClose');
    console.log('PASS focus remains usable when the resize handle disappears on small screens');
    for (const width of [390,320]) {
      await page.setViewportSize({width,height:844});
      await page.locator('#readingFlowReset').click();
      await viewport.hover(); await page.mouse.wheel(0,250); await page.waitForTimeout(250);
      const small = await passage();
      await toggle.click(); await settled(); await samePassage(small);
      assert.equal(await handle.isVisible(), false);
      if (process.env.SCREENSHOT_DIR && width===390) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,'reading-mobile-open.png'),fullPage:true});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.keyboard.press('Escape'); await settled(); await samePassage(small);
      if (process.env.SCREENSHOT_DIR && width===390) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,'reading-mobile.png'),fullPage:true});
    }
    // A fresh reduced-motion page must also work before any preference-change event.
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(url + '#workspace');
    await toggle.click();
    assert.equal(await isOpen(), true);
    assert.equal(await page.locator('#readingNotes').evaluate(e => e.getAnimations().length), 0);
    await page.locator('#readingFlowReset').click();
    assert.equal(await isOpen(), false);
    assert.equal(await viewport.evaluate(e => e.scrollTop), 0);
    assert.deepEqual(errors, []);
    console.log('PASS 390px/320px layouts, no page errors or missing assets');
  } finally {
    await browser?.close();
    await new Promise(r => server.close(r));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
