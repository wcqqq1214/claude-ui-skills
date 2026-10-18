// PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/code-running-indicator.browser.cjs
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
    const errors=[];
    for(const touch of [false,true]) {
      const context=await browser.newContext({hasTouch:touch,viewport:{width:1280,height:900}});
      const page=await context.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
      await page.goto(`http://127.0.0.1:${server.address().port}/showcase/index.html?lang=en#modes`);
      await page.evaluate(()=>document.fonts.ready);
      const code=page.locator('#modeTrack [data-mode="Code"]'),chat=page.locator('#modeTrack [data-mode="Chat"]'),cowork=page.locator('#modeTrack [data-mode="Cowork"]');
      const dot=page.locator('.mode-running'),mask=page.locator('.mode-activity-icon');
      // Two frames for layout, then let the mode track's finite animations (the 120ms thumb move, the 300ms
      // background) finish before measuring. Looping and scroll-driven animations never finish, so they are skipped.
      const settle=()=>page.evaluate(async()=>{
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const finite=document.querySelector('#modeTrack').getAnimations({subtree:true}).filter(a=>a.timeline===document.timeline&&a.playState==='running'&&a.effect?.getComputedTiming().endTime!==Infinity);
        await Promise.all(finite.map(a=>a.finished.catch(()=>{})));
      });
      for(const lang of ['en','zh-Hans']) {
        await page.evaluate(l=>DemoI18n.select(l),lang);
        assert.equal(await code.getAttribute('aria-label'),lang==='en'?'Code, working':'Code，正在运行');
        assert.equal(await dot.count(),1);
        assert.ok((await mask.evaluate(e=>getComputedStyle(e).maskImage)).startsWith('radial-gradient'));
        // Focus alone does not clear attention. Enter/Space selects the mode.
        await chat.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
        assert.equal(await code.evaluate(e=>e===document.activeElement),true);
        assert.equal(await dot.count(),1);
        for(const key of ['Enter','Space']) {
          await code.press(key);
          assert.equal(await dot.count(),0);
          assert.equal(await code.getAttribute('aria-label'),'Code');
          assert.equal(await mask.evaluate(e=>getComputedStyle(e).maskImage),'none');
          await page.keyboard.press('ArrowLeft');
          assert.equal(await cowork.evaluate(e=>e===document.activeElement),true);
          assert.equal(await dot.count(),0);
          await cowork.press(key);await settle();
          assert.equal(await dot.count(),1);
          assert.equal(await cowork.getAttribute('aria-current'),'page');
          await chat.click();
        }
        for(let i=0;i<6;i++){await code.click();assert.equal(await dot.count(),0);await chat.click();assert.equal(await dot.count(),1);}
        // Existing two/three item control and width range remain independent.
        await cowork.click();await page.locator('#modeCount').click();
        assert.equal(await cowork.isVisible(),false);assert.equal(await chat.getAttribute('aria-current'),'page');assert.equal(await dot.count(),1);
        await page.locator('#modeCount').click();assert.equal(await cowork.isVisible(),true);
        await page.locator('#modeWidth').focus();await page.keyboard.press('Home');await settle();
        assert.equal(await page.locator('#modeWidth').inputValue(),'160');
        assert.equal(await code.locator('.mode-label').isVisible(),false);
        await page.keyboard.press('End');await settle();
        assert.equal(await page.locator('#modeWidth').inputValue(),'360');
        assert.equal(await code.locator('.mode-label').isVisible(),true);
      }
      // Native mode pills reverse horizontal navigation in RTL, without selecting.
      for(const direction of ['rtl','ltr']) {
        await page.evaluate(dir=>document.documentElement.dir=dir,direction);
        for(const two of [false,true]) {
          if(two)await page.locator('#modeCount').click();
          const buttons=two?[chat,code]:[chat,cowork,code];
          for(let i=0;i<buttons.length;i++)for(const key of ['ArrowLeft','ArrowRight']) {
            await buttons[i].focus();await page.keyboard.press(key);
            const delta=(key==='ArrowRight')===(direction==='ltr')?1:-1;
            assert.equal(await buttons[(i+delta+buttons.length)%buttons.length].evaluate(e=>e===document.activeElement),true);
            assert.equal(await chat.getAttribute('aria-current'),'page');assert.equal(await dot.count(),1);
          }
          await chat.focus();
          for(const modifier of ['metaKey','ctrlKey','altKey']) {
            const result=await chat.evaluate((e,modifier)=>({accepted:e.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',[modifier]:true,bubbles:true,cancelable:true})),focused:e===document.activeElement}),modifier);
            assert.deepEqual(result,{accepted:true,focused:true});
          }
          await code.press('Enter');assert.equal(await dot.count(),0);
          await chat.press('Space');assert.equal(await dot.count(),1);
          if(two)await page.locator('#modeCount').click();
        }
      }
      const thumb=page.locator('.mode-thumb');
      for(const limit of [160,360]) {
        await page.locator('#modeWidth').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},limit);await settle();
        for(const button of [code,chat,code,chat]) {
          await button.click();await settle();
          const alignment=await button.evaluate(e=>{const a=e.getBoundingClientRect(),b=document.querySelector('.mode-thumb').getBoundingClientRect();return Math.abs(a.left-b.left)+Math.abs(a.width-b.width);});
          assert.ok(alignment<=1, `width ${limit}: rounding error ${alignment}`);
        }
      }
      await code.click();await settle();
      assert.equal(await thumb.evaluate(e=>getComputedStyle(e).transitionDuration),'0.12s, 0.3s');
      await chat.click();
      console.log(`PASS ${touch?'touch':'mouse'}: RTL/LTR wrap, hidden item, modifiers, selection semantics, thumb motion`);
      for(const theme of ['light','dark'])for(const width of [1280,390,320]) {
        await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.setViewportSize({width,height:900});
        for(const limit of [160,300,360]) {
          await page.locator('#modeWidth').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},limit);await settle();
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
          const g=await code.evaluate(e=>{const icon=e.querySelector('.study-icon').getBoundingClientRect(),d=e.querySelector('.mode-running').getBoundingClientRect(),b=e.getBoundingClientRect();return {size:[d.width,d.height],offset:[d.x-icon.x,d.y-icon.y],contained:d.left>=b.left&&d.right<=b.right&&d.top>=b.top&&d.bottom<=b.bottom};});
          assert.deepEqual(g,{size:[6,6],offset:[11,-1],contained:true});
        }
      }
      assert.equal(await dot.evaluate(e=>getComputedStyle(e).animationDuration),'1.2s');
      assert.equal(await dot.evaluate(e=>getComputedStyle(e).animationIterationCount),'infinite');
      assert.ok(await dot.evaluate(e=>{const a=e.getAnimations()[0];return Math.abs(a.startTime+performance.timeOrigin%1200)<.01;}));
      // Timeline phase survives remount; phase does not restart at each selection.
      await code.click();await chat.click();await settle();
      assert.ok(await dot.evaluate(e=>{const a=e.getAnimations()[0];return Math.abs(a.startTime+performance.timeOrigin%1200)<.01;}));
      await page.emulateMedia({forcedColors:'active'});await settle();
      assert.equal(await mask.evaluate(e=>getComputedStyle(e).maskImage),'none');
      await code.focus();assert.equal(await code.evaluate(e=>e===document.activeElement),true);
      await page.emulateMedia({forcedColors:'none'});
      await page.evaluate(()=>location.hash='composer');await settle();
      await page.evaluate(()=>location.hash='modes');await settle();
      assert.equal(await dot.count(),1);
      if(process.env.MODE_SCREENSHOT_DIR)await page.screenshot({path:resolve(process.env.MODE_SCREENSHOT_DIR,`modes-${touch?'touch':'mouse'}.png`),fullPage:true});
      console.log(`PASS ${touch?'touch':'mouse'}: language, focus vs selection, repeat switching, 2/3 items, width keyboard, 1280/390/320, phase, chapter return`);
      await context.close();
    }
    assert.deepEqual(errors,[]);console.log('PASS no script or asset errors');
  } finally {
    await browser?.close();
    await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
