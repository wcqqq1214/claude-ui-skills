// PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/composer-chin.browser.cjs
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFile} = require('node:fs/promises');
const {resolve, extname, sep} = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = resolve(__dirname, '..');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.webp':'image/webp', '.png':'image/png'};
(async () => {
  const server = createServer(async (req, res) => {
    try {
      const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      res.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream'}).end(await readFile(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROME_BIN, headless:true});
    const errors = [];
    for (const touch of [false, true]) {
      const context = await browser.newContext({viewport:{width:1280,height:900},hasTouch:touch});
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(r.url() + ': ' + r.status()); });
      await page.goto(`http://127.0.0.1:${server.address().port}/showcase/index.html?lang=en#composer`);
      await page.evaluate(() => document.fonts.ready);
      const range = page.locator('#composerWidth'), project = page.locator('#composerProject');
      const chin = page.locator('#composerChin'), input = page.locator('#promptInput');
      const mode = () => chin.getAttribute('data-picker-mode');
      const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const width = async value => {
        await range.evaluate((e, value) => { e.value = value; e.dispatchEvent(new Event('input', {bubbles:true})); }, value);
        await settle();
      };
      await input.fill('保留这段草稿\nA second line');
      for (const language of ['en','zh-Hans']) {
        await page.evaluate(language => DemoI18n.select(language), language);
        await width(680);
        assert.equal(await mode(), 'words-and-carets');
        // Observe the actual collapse/recovery boundaries, including the 2px spare-space rule.
        const sequence = [], boundaries = [];
        let last = await mode();
        for (let value=240;value>=Number(await range.getAttribute('min'));value--) {
          await width(value);
          const current = await mode();
          if (current !== last) { sequence.push(current); boundaries.push(value); last=current; }
        }
        assert.deepEqual(sequence, ['words','icons']);
        assert.equal(await project.locator('[data-glyph="Projects"]').count(),1);
        assert.deepEqual(await project.locator('[data-glyph="Projects"]').evaluate(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];}),touch?[20,20]:[16,16]);
        assert.equal(await project.getAttribute('aria-label'),language==='en'?'Project':'项目');
        const recovered = [];
        for (let value=Number(await range.getAttribute('min'));value<=240;value++) {
          await width(value);
          const current = await mode();
          if (current !== last) { recovered.push({mode:current,width:value}); last=current; }
        }
        assert.deepEqual(recovered.map(x=>x.mode),['words','words-and-carets']);
        assert.ok(recovered[0].width >= boundaries[1]+2);
        assert.ok(recovered[1].width >= boundaries[0]+2);
        // Focus and draft survive repeated mode changes and a hidden chapter round trip.
        await project.focus();
        for (let i=0;i<5;i++) { await width(156); await width(680); }
        assert.equal(await page.evaluate(()=>document.activeElement.id),'composerProject');
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('.composer-model').evaluate(e=>e===document.activeElement),true);
        await range.focus(); await page.keyboard.press('Home'); await settle();
        assert.equal(await mode(),'icons');
        await page.keyboard.press('End'); await settle();
        assert.equal(await mode(),'words-and-carets');
        await page.keyboard.press('ArrowLeft');
        assert.equal(await range.inputValue(),'679');
        await page.evaluate(()=>location.hash='controls'); await settle();
        await page.evaluate(()=>location.hash='composer'); await settle();
        assert.equal(await input.innerText(),'保留这段草稿\nA second line');
        assert.equal(await page.locator('.composer-attachment').count(),2);
      }
      console.log(`PASS ${touch?'touch':'mouse'}: three modes in both languages, hysteresis, repeated resizing, keyboard, chapter return and preserved draft`);
      for (const theme of ['light','dark']) {
        await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
        for (const viewport of [1280,390,320]) {
          await page.setViewportSize({width:viewport,height:900});
          for (const target of [156,680]) {
            await width(target);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page fits viewport');
            const geometry = await chin.evaluate(e=>{
              const [a,b]=[...e.querySelectorAll('button')].map(b=>b.getBoundingClientRect());
              const box=e.getBoundingClientRect();
              return {separated:a.right<=b.left,left:a.left>=box.left,right:b.right<=box.right};
            });
            assert.deepEqual(geometry,{separated:true,left:true,right:true});
          }
        }
        await project.focus();
        assert.ok((await project.evaluate(e=>getComputedStyle(e).boxShadow)).includes('6px 1px'));
      }
      // Presses remeasure after resizing; the text itself stays unscaled.
      await page.setViewportSize({width:1280,height:900});
      for (const target of [680,180,168,680]) {
        await width(target);
        for (const button of [project,page.locator('.composer-model')]) {
          const fill = button.locator('.composer-picker-fill');
          for (const method of ['pointer','Space']) {
            if (method==='pointer') { await button.hover(); await page.mouse.down(); }
            else { await button.focus(); await page.keyboard.down('Space'); }
            await fill.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
            const pressed = await button.evaluate(e=>{
              const fill=e.querySelector('.composer-picker-fill');
              const m=new DOMMatrixReadOnly(getComputedStyle(fill).transform);
              return {insetX:(1-m.a)*fill.offsetWidth/2,insetY:(1-m.d)*fill.offsetHeight/2,
                height:e.offsetHeight,transition:getComputedStyle(fill).transitionDuration,
                textTransform:getComputedStyle(e.querySelector('.composer-picker-content')).transform};
            });
            const expected=touch?1:((await mode())==='icons' && button===project ? .75 : .625);
            assert.ok(Math.abs(pressed.insetX-expected)<.001,JSON.stringify(pressed));
            assert.ok(Math.abs(pressed.insetY-expected)<.001,JSON.stringify(pressed));
            assert.equal(pressed.transition,'0.06s');
            assert.equal(pressed.textTransform,'none');
            if (method==='pointer') await page.mouse.up();
            else {
              assert.equal(await button.evaluate(e=>e.dispatchEvent(new KeyboardEvent('keydown',{key:' ',repeat:true,bubbles:true,cancelable:true}))),false);
              await page.keyboard.up('Space');
            }
            assert.equal(await fill.evaluate(e=>getComputedStyle(e).transitionDuration),'0.45s');
            await page.waitForFunction(e=>getComputedStyle(e).transform==='none',await fill.elementHandle());
          }
        }
      }
      // Native outline-hidden restores an outline when forced colors suppress shadows.
      for (const theme of ['light','dark']) {
        await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
        await page.emulateMedia({forcedColors:'active'});
        for (const target of [680,168]) {
          await width(target);
          await project.focus();
          for (const button of [project,page.locator('.composer-model')]) {
            await page.waitForTimeout(250);
            const focus=await button.evaluate(e=>{const s=getComputedStyle(e);return {focused:e.matches(':focus-visible'),style:s.outlineStyle,width:s.outlineWidth,offset:s.outlineOffset,shadow:s.boxShadow};});
            assert.deepEqual(focus,{focused:true,style:'solid',width:'2px',offset:'2px',shadow:'none'});
            await page.keyboard.press('Tab');
          }
        }
        await page.emulateMedia({forcedColors:'none'});
        await project.focus();
        assert.equal(await project.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
        assert.ok((await project.evaluate(e=>getComputedStyle(e).boxShadow)).includes('6px 1px'));
      }
      console.log(`PASS ${touch?'touch':'mouse'}: size-dependent pointer/Space press, release, repeat keys and forced-color focus in both themes`);
      // Changing input density while mounted updates the icon without replacing the trigger.
      const cdp=await context.newCDPSession(page);
      for (const enabled of [!touch,touch]) {
        await project.focus();
        await cdp.send('Emulation.setTouchEmulationEnabled',{enabled});
        // Some headless Chromium environments may keep reporting hover:none after touch emulation.
        // Skip this direction visibly only if the browser's media query does not match the requested input density.
        const reached = await page.evaluate(enabled => matchMedia('(pointer: coarse), (hover: none)').matches === enabled, enabled);
        if (!reached) { console.log(`SKIP ${touch?'touch':'mouse'}: live switch to a ${enabled?'coarse':'fine'} pointer is not available in this browser`); continue; }
        await page.waitForFunction(w=>document.querySelector('#composerWidth').min===w,enabled?'168':'156');
        await width(168);
        assert.equal(await project.locator('[data-glyph="Projects"]').evaluate(e=>e.getBoundingClientRect().width),enabled?20:16);
        assert.equal(await page.evaluate(()=>document.activeElement.id),'composerProject');
      }
      await cdp.detach();
      // Existing attachment lifecycle remains usable at the new minimum frame width.
      await width(156);
      await page.locator('#addMockAttachment').click();
      assert.equal(await page.locator('.composer-attachment').count(),3);
      assert.equal(await page.locator('#addMockAttachment').isDisabled(),true);
      await page.locator('.composer-attachment-remove').first().focus();
      await page.keyboard.press('Delete');
      await page.waitForFunction(()=>document.querySelectorAll('.composer-attachment').length===2);
      assert.equal(await page.locator('#addMockAttachment').isEnabled(),true);
      await page.waitForFunction(()=>!document.querySelector(':root:active-view-transition-type(demo-attachments)'));
      assert.equal(await page.locator('.composer-attachment-remove').first().evaluate(e=>e===document.activeElement),true);
      await width(680);
      assert.equal(await mode(),'words-and-carets');
      assert.equal(await project.locator('.composer-picker-fill').evaluate(e=>getComputedStyle(e).transitionDuration),'0.45s');
      console.log(`PASS ${touch?'touch':'mouse'}: both themes at 1280/390/320, attachment regression`);
      if (process.env.COMPOSER_SCREENSHOT_DIR) {
        await page.setViewportSize({width:1280,height:900});
        await page.screenshot({path:resolve(process.env.COMPOSER_SCREENSHOT_DIR,`demo-${touch?'touch':'mouse'}.png`),fullPage:true});
      }
      await context.close();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS no script or asset errors');
  } finally {
    await browser?.close();
    await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
