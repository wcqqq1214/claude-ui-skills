// Pinned-order browser gate: PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/pinned-reorder.browser.cjs
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
      await page.mouse.move(p.x, b.y + target*27 + (target===0 ? 2 : 24), {steps:4});
      return p;
    };
    const geometry = await list.locator('.pinned-row').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));
    assert.equal(geometry[1]-geometry[0],27,'26px compact row plus 1px gap');
    await page.locator('#modeTrack button').first().focus();
    await page.mouse.move(0,0);
    assert.equal(await list.locator('.pinned-more').first().evaluate(e=>getComputedStyle(e).opacity),'0');
    await list.locator('.pinned-row').first().hover();
    assert.equal(await list.locator('.pinned-more').first().evaluate(e=>getComputedStyle(e).opacity),'1');
    const title = list.locator('[data-pin="notes"] .pinned-title');
    const saved = await title.innerText();
    await title.locator('span').evaluate(e=>{e.firstChild.nodeValue='A long conversation title that extends past the row controls and must fade';});
    await page.locator('#pinnedStage').evaluate(e=>e.style.width='280px');
    await page.waitForFunction(()=>document.querySelector('[data-pin="notes"] .pinned-title').hasAttribute('data-overflow'));
    assert.notEqual(await title.evaluate(e=>getComputedStyle(e).maskImage),'none');
    assert.notEqual(await title.evaluate(e=>getComputedStyle(e).textOverflow),'ellipsis');
    await title.locator('span').evaluate((e,text)=>{e.firstChild.nodeValue=text;},saved);
    await page.locator('#pinnedStage').evaluate(e=>e.style.width='');
    await page.waitForFunction(()=>!document.querySelector('[data-pin="notes"] .pinned-title').hasAttribute('data-overflow'));
    const once = await start('notes');
    await page.mouse.move(once.x,once.y+90); await page.mouse.up();
    assert.deepEqual(await order(),original,'first threshold event initializes only');
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
    assert.equal(await list.locator('[data-pin="reading"]').evaluate(e=>e.style.transform),'translateY(-27px)');
    assert.equal(await list.locator('[data-pin="reading"]').evaluate(e=>getComputedStyle(e).transitionDuration),'0.12s');
    await page.waitForFunction(()=>document.querySelector('.pinned-ghost').style.transform.includes('translate('));
    assert.equal(await page.locator('.pinned-ghost').evaluate(e=>getComputedStyle(e).willChange),'transform');
    assert.equal(await page.locator('.pinned-ghost-surface').evaluate(e=>getComputedStyle(e).opacity),'0.9');
    assert.equal(await page.locator('.pinned-ghost').evaluate(e=>e.parentElement.id),'pinnedStage');
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
    const outside=await list.boundingBox();
    await page.mouse.move(outside.x+outside.width+10,outside.y+90); await page.mouse.up();
    assert.deepEqual(await order(),original,'horizontal exit does not reorder');
    await reorder('notes',3);
    await list.locator('[data-pin="notes"]').dispatchEvent('pointermove',{pointerId:1,buttons:0});
    assert.deepEqual(await order(),original,'missing button state waits before committing');
    await page.waitForFunction(()=>!document.querySelector('.pinned-ghost'));
    assert.deepEqual(await order(),['reading','weekend','ideas','notes']);
    await page.mouse.up(); await reset();
    for(let i=0;i<8;i++) { await reorder('notes',3); await page.mouse.up(); await reset(); }
    console.log('PASS cancel, horizontal exit, eight reorder/reset cycles and cleanup');

    const primary = key => list.locator(`[data-pin="${key}"] .pinned-main`);
    const trigger = key => list.locator(`[data-pin="${key}"] .pinned-more`);
    const openMenu = async key => { await primary(key).focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); };
    // Roving focus: one main row Tab stop; row actions are not extra Tab stops.
    assert.equal(await list.locator('.pinned-main[tabindex="0"]').count(),1);
    assert.equal(await list.locator('.pinned-more[tabindex="0"]').count(),0);
    await primary('notes').focus();
    await page.keyboard.press('ArrowDown'); assert.equal(await primary('reading').evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.locator('#pinnedMenu').isVisible(),false);
    await page.keyboard.press('End'); assert.equal(await primary('ideas').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight');
    assert.equal(await trigger('notes').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('ArrowLeft'); assert.equal(await primary('notes').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.closest('#pinnedList')===null),true);
    await page.evaluate(()=>document.querySelector('#pinnedStage').dir='rtl');
    await primary('notes').focus(); await page.keyboard.press('ArrowLeft');
    assert.equal(await trigger('notes').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('ArrowRight'); assert.equal(await primary('notes').evaluate(e=>e===document.activeElement),true);
    await page.evaluate(()=>document.querySelector('#pinnedStage').removeAttribute('dir'));
    await reorder('notes',3);
    await trigger('reading').focus(); await page.keyboard.press('Enter');
    await clean(); await page.mouse.up();
    assert.deepEqual(await order(),original,'keyboard menu cancels pending drag');
    await page.keyboard.press('Escape');
    await openMenu('notes');
    assert.equal(await page.locator('#pinnedMenu [data-move="-1"]').isVisible(),false);
    assert.equal(await page.locator('#pinnedMenu [data-move="1"]').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.down('Enter');
    for(let i=0;i<3;i++) await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    assert.deepEqual(await order(),['reading','notes','weekend','ideas']);
    assert.equal(await page.locator('#pinnedMenu').isVisible(),false);
    assert.equal(await primary('notes').evaluate(e=>e===document.activeElement),true);
    await openMenu('notes'); await page.keyboard.press('Home'); await page.keyboard.press('Space');
    assert.deepEqual(await order(),original);
    await openMenu('ideas');
    assert.equal(await page.locator('#pinnedMenu [data-move="1"]').isVisible(),false);
    await page.keyboard.press('Escape');
    assert.equal(await trigger('ideas').evaluate(e=>e===document.activeElement),true);
    await openMenu('reading'); await page.keyboard.press('Tab');
    assert.equal(await page.locator('#pinnedMenu').isVisible(),false);
    assert.equal(await page.evaluate(()=>document.activeElement.closest('#pinnedList')===null),true);
    await openMenu('notes'); await page.locator('#modeTrack button').first().click();
    assert.equal(await page.locator('#pinnedMenu').isVisible(),false);
    console.log('PASS row roving focus, RTL, action navigation, menu boundaries and focus return');

    const popup = page.locator('#pinnedMenu'), menuItem = popup.locator('[data-move="-1"]');
    const pointerMenu = async () => { await primary('reading').hover(); await trigger('reading').click(); };
    for (const theme of ['light', 'dark']) {
      while(await page.locator('html').getAttribute('data-theme')!==theme) await page.locator('#themeBtn').click();
      await pointerMenu();
      assert.equal(await popup.evaluate(e=>e.parentElement===document.body),true);
      assert.equal(await popup.evaluate(e=>e===document.activeElement),true,'pointer opens the popup without highlighting an item');
      assert.equal(await popup.locator('[data-highlighted]').count(),0);
      const values = await menuItem.evaluate(e=>{
        const s=getComputedStyle(e), m=getComputedStyle(e.closest('[role="menu"]'));
        return [s.height,s.padding,s.gap,s.borderRadius,s.fontSize,s.lineHeight,s.fontWeight,s.outlineStyle,
          m.width,m.height,m.borderRadius,m.backgroundColor,m.color,m.transitionDuration,m.animationName];
      });
      // Compact MenuPopup / MenuItem measured from the installed component, not local-menu.
      assert.deepEqual(values,['24px','2.5px 8px','6px','6px','13px','19px','400','none',
        '128px',theme==='dark'?'57px':'56px','10px',theme==='dark'?'rgb(32, 32, 31)':'rgb(255, 255, 255)',
        theme==='dark'?'rgb(240, 239, 236)':'rgb(11, 11, 11)','0s','none']);
      assert.equal(await menuItem.evaluate(e=>getComputedStyle(e).fontVariationSettings),theme==='dark'?'"GRAD" 0, "wght" 360':'"GRAD" 0');
      const a=await trigger('reading').boundingBox(), m=await popup.boundingBox();
      assert.equal(m.y,Math.round(a.y+a.height+6),'6px from the action trigger, rounded to a device pixel');
      assert.equal(m.x,Math.round(a.x+a.width-m.width),'end aligned to the trigger');
      await menuItem.hover();
      assert.equal(await menuItem.getAttribute('data-highlighted'),'');
      assert.equal(await menuItem.evaluate(e=>e===document.activeElement),true);
      assert.equal(await menuItem.evaluate(e=>getComputedStyle(e).backgroundColor),theme==='dark'?'rgba(255, 255, 255, 0.075)':'rgba(11, 11, 11, 0.05)');
      if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,`menu-${theme}.png`),fullPage:true});
      await page.mouse.move(m.x+2,m.y+2);
      assert.equal(await popup.locator('[data-highlighted]').count(),0,'padding clears the previous item highlight');
      assert.equal(await popup.evaluate(e=>e===document.activeElement),true);
      await menuItem.hover();
      await page.mouse.move(0,0);
      assert.equal(await popup.locator('[data-highlighted]').count(),0);
      assert.equal(await popup.evaluate(e=>e===document.activeElement),true);
      await page.keyboard.press('ArrowUp');
      assert.equal(await popup.locator('[data-move="1"]').evaluate(e=>e===document.activeElement),true);
      await page.keyboard.press('Escape');
      assert.equal(await popup.isVisible(),false,'no delayed exit');
    }
    for(let i=0;i<8;i++) {
      await openMenu('reading'); await page.keyboard.press('Escape');
      assert.equal(await popup.isVisible(),false);
      assert.equal(await trigger('reading').getAttribute('aria-expanded'),'false');
    }
    // Portal placement tracks its trigger and flips above near the viewport edge.
    await page.locator('#pinnedStage').evaluate(e=>{e.style.position='fixed';e.style.left='8px';e.style.top='auto';e.style.bottom='5px';e.dir='rtl';});
    await primary('reading').focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
    assert.equal(await popup.getAttribute('data-side'),'top');
    const rtlAnchor=await trigger('reading').boundingBox(), rtlBox=await popup.boundingBox();
    assert.equal(rtlBox.x,Math.round(rtlAnchor.x));
    assert.equal(rtlBox.y,Math.round(rtlAnchor.y-rtlBox.height-6));
    await page.setViewportSize({width:390,height:844});
    assert.equal(await popup.isVisible(),true,'resize repositions the open popup');
    const narrowMenu=await popup.boundingBox();
    assert.ok(narrowMenu.x>=5 && narrowMenu.x+narrowMenu.width<=385);
    await page.keyboard.press('Escape');
    await page.locator('#pinnedStage').evaluate(e=>{e.removeAttribute('style');e.removeAttribute('dir');});
    await page.setViewportSize({width:1200,height:900});
    await openMenu('reading');
    await page.evaluate(()=>{location.hash='#controls';});
    await popup.waitFor({state:'hidden'});
    await page.evaluate(()=>{location.hash='#modes';});
    await page.locator('#modes[data-active]').waitFor();
    console.log('PASS menu geometry, light/dark surfaces, immediate highlight/open/close, repeated opening, RTL and edge placement');

    await page.locator('#modeTrack [data-mode="Code"]').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#modeTrack [aria-current="page"]').getAttribute('data-mode'),'Chat');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#modeTrack [aria-current="page"]').getAttribute('data-mode'),'Cowork');
    await page.locator('#modeCount').click();
    assert.equal(await page.locator('#modeTrack [aria-current="page"]').getAttribute('data-mode'),'Chat');
    await page.locator('#languageBtn').click(); await page.locator('[data-locale="zh-Hans"]').click();
    await openMenu('notes');
    assert.equal(await page.locator('#pinnedMenu [data-move="1"] > span:last-child').innerText(),'下移');
    await page.keyboard.press('Escape');
    await page.locator('#resetPinned').click();
    assert.equal(await page.locator('#pinnedStatus').innerText(),'已恢复原来的顺序');
    while(await page.locator('html').getAttribute('data-theme')!=='dark') await page.locator('#themeBtn').click();
    if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,'dark-desktop.png'),fullPage:true});
    for(const narrow of [390,320]) {
      await page.setViewportSize({width:narrow,height:844});
      await reorder('notes',3); await page.mouse.up(); await reset();
      await openMenu('ideas');
      const box = await page.locator('#pinnedMenu').boundingBox();
      assert.ok(box.x>=0 && box.x+box.width<=narrow);
      if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,`menu-${narrow}.png`),fullPage:true});
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
    console.log('PASS original modes, translations, dark theme, 390/320px and emulated touch drag');
  } finally {
    await browser?.close();
    await new Promise(r => server.close(r));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
