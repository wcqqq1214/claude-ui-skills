// Pinned-order browser gate: PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/workspace.browser.cjs
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
    await page.goto(url + '#modes');
    await page.evaluate(() => document.fonts.ready);
    const list = page.locator('#pinnedList');
    const original = ['notes','reading','weekend','ideas'];
    const order = () => list.locator('[data-pin]').evaluateAll(rows => rows.map(r => r.dataset.pin));
    const clean = async () => {
      assert.equal(await page.locator('.pinned-ghost').count(), 0);
      assert.equal(await list.getAttribute('data-pin-dragging'), null);
      assert.equal(await list.locator('[style*="visibility: hidden"]').count(), 0);
    };
    const reset = async () => { await page.locator('#resetPinned').click(); assert.deepEqual(await order(), original); await clean(); };
    const start = async (key) => {
      const row = list.locator(`[data-pin="${key}"]`);
      await row.scrollIntoViewIfNeeded();
      const b = await row.boundingBox();
      await page.mouse.move(b.x+50,b.y+13); await page.mouse.down();
      return {x:b.x+50,y:b.y+13};
    };
    const reorder = async (key, target) => {
      const p = await start(key), b = await list.boundingBox();
      await page.mouse.move(p.x+4,p.y);
      await page.mouse.move(p.x, b.y + target*26 + (target===0 ? 2 : 24), {steps:4});
      return p;
    };
    const p = await start('notes');
    await page.mouse.move(p.x+3,p.y+3);
    assert.equal(await page.locator('.pinned-ghost').count(),0,'below either-axis threshold');
    await page.mouse.move(p.x+4,p.y+3);
    assert.equal(await page.locator('.pinned-ghost').count(),1,'4px starts drag');
    assert.equal(await page.locator('.pinned-ghost').getAttribute('aria-hidden'),'true');
    assert.equal(await page.locator('.pinned-ghost').evaluate(e=>e.inert),true);
    await page.mouse.up(); await clean(); assert.deepEqual(await order(),original);
    await reorder('notes',3);
    assert.deepEqual(await order(),original,'DOM order commits only on release');
    assert.equal(await list.locator('[data-pin="reading"]').evaluate(e=>e.style.transform),'translateY(-26px)');
    assert.equal(await list.locator('[data-pin="reading"]').evaluate(e=>getComputedStyle(e).transitionDuration),'0.12s');
    if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,'drag-preview.png'),fullPage:true});
    await page.mouse.up(); await clean();
    assert.deepEqual(await order(),['reading','weekend','ideas','notes']);
    await reorder('notes',0); await page.mouse.up(); assert.deepEqual(await order(),original);
    console.log('PASS 3/4px boundary, inert ghost, 120ms neighbor shift, commit and reverse');

    for(const cancel of ['Escape','pointercancel','blur','resize','chapter']) {
      await reorder('notes',3);
      if(cancel==='Escape') await page.keyboard.press('Escape');
      if(cancel==='pointercancel') await list.locator('[data-pin="notes"]').dispatchEvent('pointercancel',{pointerId:1});
      if(cancel==='blur') await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
      if(cancel==='resize') await page.setViewportSize({width:1200,height:900});
      if(cancel==='chapter') await page.evaluate(()=>{location.hash='#controls';});
      await page.mouse.up(); await clean(); assert.deepEqual(await order(),original,cancel);
      if(cancel==='chapter') await page.goto(url+'#modes');
    }
    await reorder('notes',3);
    await page.mouse.move(1,300); await page.mouse.up();
    assert.deepEqual(await order(),original,'horizontal exit does not reorder');
    for(let i=0;i<8;i++) { await reorder('notes',3); await page.mouse.up(); await reset(); }
    console.log('PASS cancel, horizontal exit, eight reorder/reset cycles and cleanup');

    const trigger = key => list.locator(`[data-pin="${key}"] button`);
    await reorder('notes',3);
    await trigger('reading').focus(); await page.keyboard.press('Enter');
    await clean(); await page.mouse.up();
    assert.deepEqual(await order(),original,'keyboard menu cancels pending drag');
    await page.keyboard.press('Escape');
    await trigger('notes').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#pinnedMenu [data-move="-1"]').isVisible(),false);
    assert.equal(await page.locator('#pinnedMenu [data-move="1"]').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.down('Enter');
    for(let i=0;i<3;i++) await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    assert.deepEqual(await order(),['reading','notes','weekend','ideas']);
    assert.equal(await page.locator('#pinnedMenu').isVisible(),false,'held Enter does not reopen');
    assert.equal(await trigger('notes').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('Home'); await page.keyboard.press('Space');
    assert.deepEqual(await order(),original);
    await trigger('ideas').click();
    assert.equal(await page.locator('#pinnedMenu [data-move="1"]').isVisible(),false);
    await page.keyboard.press('Escape');
    assert.equal(await trigger('ideas').evaluate(e=>e===document.activeElement),true);
    await trigger('reading').click(); await page.keyboard.press('Tab');
    assert.equal(await page.locator('#pinnedMenu').isVisible(),false);
    assert.equal(await trigger('weekend').evaluate(e=>e===document.activeElement),true);
    await trigger('notes').click(); await page.locator('#modeTrack button').first().click();
    assert.equal(await page.locator('#pinnedMenu').isVisible(),false);
    console.log('PASS menu boundaries, Enter/Space, held-key guard, arrows, Escape, Tab and focus return');

    await page.locator('#modeTrack [data-mode="Code"]').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#modeTrack [aria-current="page"]').getAttribute('data-mode'),'Chat');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#modeTrack [aria-current="page"]').getAttribute('data-mode'),'Cowork');
    await page.locator('#modeCount').click();
    assert.equal(await page.locator('#modeTrack [aria-current="page"]').getAttribute('data-mode'),'Chat');
    await page.locator('#languageBtn').click(); await page.locator('[data-locale="zh-Hans"]').click();
    await trigger('notes').click();
    assert.equal(await page.locator('#pinnedMenu [data-move="1"]').innerText(),'下移');
    await page.keyboard.press('Escape');
    await page.locator('#resetPinned').click();
    assert.equal(await page.locator('#pinnedStatus').innerText(),'已恢复原来的顺序');
    while(await page.locator('html').getAttribute('data-theme')!=='dark') await page.locator('#themeBtn').click();
    if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,'dark-desktop.png'),fullPage:true});
    await page.emulateMedia({reducedMotion:'reduce'});
    await reorder('notes',3);
    assert.equal(await list.locator('[data-pin="reading"]').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
    await page.mouse.up(); await reset();
    for(const narrow of [390,320]) {
      await page.setViewportSize({width:narrow,height:844});
      await reorder('notes',3); await page.mouse.up(); await reset();
      await trigger('ideas').click();
      const box = await page.locator('#pinnedMenu').boundingBox();
      assert.ok(box.x>=0 && box.x+box.width<=narrow);
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,`mobile-${narrow}.png`),fullPage:true});
    }
    // Touch pointer capture changes ownership at drag start; losing implicit capture must not cancel it.
    const touch = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const phone = await touch.newPage(); await phone.goto(url+'#modes');
    await phone.locator('#pinnedList').scrollIntoViewIfNeeded();
    const bounds = await phone.locator('#pinnedList').boundingBox();
    const cdp = await touch.newCDPSession(phone);
    const touchEvent = async (type,x,y) => cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
    await touchEvent('touchStart',bounds.x+50,bounds.y+13);
    await touchEvent('touchMove',bounds.x+54,bounds.y+13);
    await touchEvent('touchMove',bounds.x+54,bounds.y+100);
    await touchEvent('touchEnd');
    assert.deepEqual(await phone.locator('#pinnedList [data-pin]').evaluateAll(a=>a.map(e=>e.dataset.pin)),['reading','weekend','ideas','notes']);
    assert.equal(await phone.locator('.pinned-ghost').count(),0);
    await touch.close();
    assert.deepEqual(errors,[]);
    console.log('PASS original modes, translations, dark theme, reduced motion, 390/320px and emulated touch drag');
  } finally {
    await browser?.close();
    await new Promise(r => server.close(r));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
