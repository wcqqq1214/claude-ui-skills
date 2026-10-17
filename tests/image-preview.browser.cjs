// PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/image-preview.browser.cjs
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFile, mkdir} = require('node:fs/promises');
const {resolve, extname, sep} = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = resolve(__dirname, '..');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'};
(async () => {
  const server = createServer(async (req, res) => {
    try {
      const path = resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      res.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream'}).end(await readFile(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
  const errors=[];
  try {
    for (const touch of [false,true]) {
      const context=await browser.newContext({hasTouch:touch,viewport:{width:1280,height:900}});
      const page=await context.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
      await page.addInitScript(()=>{
        const start=document.startViewTransition.bind(document);
        window.previewTransitions=[];
        document.startViewTransition=callback=>{
          const transition=start(callback), record={};
          window.previewTransitions.push(record);
          transition.ready.then(()=>{
            record.ready=true;
            const css=getComputedStyle(document.documentElement,'::view-transition-image-pair(demo-image-preview)');
            record.duration=css.animationDuration;record.name=css.animationName;
            record.frames=document.getAnimations().filter(a=>a.animationName?.startsWith('image-preview-decoration')).map(a=>a.effect.getKeyframes());
          }).catch(e=>{record.skipped=e.name;});
          return transition;
        };
      });
      const url=`http://127.0.0.1:${server.address().port}/showcase/index.html?lang=zh-Hans#images`;
      await page.goto(url);await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.locator('.image-zoom-icon').count(),0);
      const thumbnail=await page.locator('#imageOrigin img').evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,fit:getComputedStyle(e).objectFit};});
      assert.deepEqual(thumbnail,{width:480,height:312,fit:'contain'});
      const origin=page.locator('#imageOrigin'),dialog=page.locator('#imageDialog');
      for (const theme of ['light','dark']) {
        await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
        await origin.focus();
        const ring=await origin.evaluate(e=>({outline:getComputedStyle(e).outlineStyle,shadow:getComputedStyle(e,'::after').boxShadow}));
        assert.equal(ring.outline,'none');
        assert.ok(ring.shadow.includes('rgb(42, 120, 214) 0px 0px 0px 1px'));
        assert.ok(ring.shadow.includes(theme==='light'?'rgb(205, 226, 251)':'rgba(24, 79, 149, 0.6)'));
      }
      await page.emulateMedia({forcedColors:'active'});
      assert.equal(await origin.locator('.image-origin-body').evaluate(e=>getComputedStyle(e,'::after').outlineStyle),'solid');
      await page.emulateMedia({forcedColors:'none'});
      const box=await origin.boundingBox();
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
      await page.mouse.down();
      const press=await origin.evaluate(e=>({fill:getComputedStyle(e,'::before').transitionDuration,ring:getComputedStyle(e,'::after').transitionDuration,body:getComputedStyle(e.querySelector('.image-origin-body')).transitionDuration,imageClip:getComputedStyle(e.querySelector('img')).clipPath}));
      assert.deepEqual(press,{fill:'0.06s',ring:'0.06s',body:'0.06s',imageClip:'none'});
      await page.mouse.move(0,0);await page.mouse.up();
      const settled=()=>page.waitForFunction(()=>!document.documentElement.classList.contains('image-preview-active'));
      const open=async()=>{await origin.click();await dialog.waitFor({state:'visible'});await settled();};
      const close=async(method='escape')=>{
        if(method==='escape')await page.keyboard.press('Escape');
        else if(method==='image')await page.locator('#largeImage').click();
        else if(method==='backdrop')await dialog.click({position:{x:2,y:2}});
        else await page.locator('#closeImage').click();
        await dialog.waitFor({state:'hidden'});await settled();
        assert.equal(await origin.evaluate(e=>e===document.activeElement),true);
        assert.equal(await page.locator('#imageOrigin img').evaluate(e=>getComputedStyle(e).visibility),'visible');
        assert.equal(await page.locator('[style*="view-transition-name"]').count(),0);
      };
      for(const theme of ['light','dark'])for(const width of [1280,390,320]){
        await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
        await open();
        const metrics=await page.locator('#imagePreviewSurface').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {radius:s.borderRadius,shadow:s.boxShadow,inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};});
        assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--image-preview-source-inset')),'0%');
        assert.equal(metrics.radius,'6px');assert.equal(metrics.inside,true);assert.equal(metrics.overflow,false);
        assert.ok(metrics.shadow.includes('0.3')&&metrics.shadow.includes('0.25'));
        const layout=await page.evaluate(()=>{
          const image=document.querySelector('#largeImage').getBoundingClientRect(),button=document.querySelector('#closeImage'),r=button.getBoundingClientRect();
          return {imageWidth:image.width,size:[r.width,r.height],offset:[r.x-image.x,r.y-image.y],icon:getComputedStyle(button.querySelector('.study-icon')).fontSize};
        });
        assert.ok(Math.abs(layout.imageWidth-(width===1280?640:width-32))<.1);
        assert.deepEqual(layout.size,touch?[32,32]:[24,24]);assert.equal(layout.icon,touch?'20px':'16px');
        assert.ok(layout.offset.every((v,i)=>Math.abs(v-(width===1280?[646,0]:[width-(touch?70:62),6])[i])<.1));
        if(process.env.IMAGE_SCREENSHOT_DIR && !touch && theme==='light' && width!==390){
          await mkdir(process.env.IMAGE_SCREENSHOT_DIR,{recursive:true});
          await page.screenshot({path:resolve(process.env.IMAGE_SCREENSHOT_DIR,`preview-${width}.png`)});
        }
        await close();
      }
      const records=await page.evaluate(()=>window.previewTransitions);
      assert.equal(records.length,12);assert.ok(records.every(r=>r.ready));
      for(let i=0;i<records.length;i++){
        assert.equal(records[i].duration,i%2?'0.25s':'0.35s');
        const frames=records[i].frames[0];assert.ok(frames?.length>=2);
        assert.equal(frames[0].borderTopLeftRadius,i%2?'6px':'9px');
        assert.equal(frames.at(-1).borderTopLeftRadius,i%2?'9px':'6px');
      }
      await page.setViewportSize({width:1280,height:900});
      for(const method of ['button','image','backdrop','escape']){await open();await close(method);}
      for(const key of ['Enter','Space']){
        await origin.focus();await page.keyboard.press(key);await dialog.waitFor({state:'visible'});await settled();
        assert.equal(await page.locator('#closeImage').evaluate(e=>e===document.activeElement),true);
        await page.keyboard.press('Tab');
        assert.equal(await dialog.evaluate(e=>document.activeElement.id==='closeImage'),true);
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.locator('#closeImage').evaluate(e=>e===document.activeElement),true);
        await close();
      }
      // Toolbar keys keep the sole close action focused; activation closes on Enter/Space.
      for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End']){
        await open();await page.keyboard.press(key);
        assert.equal(await page.locator('#closeImage').evaluate(e=>e===document.activeElement),true);await close();
      }
      for(const key of ['Enter','Space']){
        await open();await page.keyboard.press(key);await dialog.waitFor({state:'hidden'});await settled();
        assert.equal(await origin.evaluate(e=>e===document.activeElement),true);
      }
      // A newer modal owns focus; closing this preview must not take it back.
      await open();
      await page.evaluate(()=>{
        const overlay=document.createElement('dialog');overlay.id='focusFixture';
        overlay.innerHTML='<input aria-label="Focus fixture">';document.body.append(overlay);overlay.showModal();
        document.querySelector('#closeImage').click();
      });
      await dialog.waitFor({state:'hidden'});await settled();
      assert.equal(await page.evaluate(()=>document.activeElement===document.querySelector('#focusFixture input')),true);
      await page.evaluate(()=>{const e=document.querySelector('#focusFixture');e.close();e.remove();});
      await open();
      await origin.evaluate(e=>{window.detachedOrigin={element:e,parent:e.parentElement,next:e.nextSibling};e.remove();});
      await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await settled();
      assert.notEqual(await page.evaluate(()=>document.activeElement.id),'closeImage');
      await page.evaluate(()=>{const {element,parent,next}=window.detachedOrigin;parent.insertBefore(element,next);delete window.detachedOrigin;});
      await open();await close();
      // Check the responsive breakpoint, RTL anchoring and short windows.
      for(const [width,height] of [[639,900],[640,900],[768,900],[1280,360]])for(const dir of ['ltr','rtl']){
        await page.setViewportSize({width,height});await page.evaluate(v=>document.documentElement.dir=v,dir);
        await open();
        const geometry=await page.evaluate(()=>{
          const a=document.querySelector('#imagePreviewSurface').getBoundingClientRect(),b=document.querySelector('#closeImage').getBoundingClientRect();
          return {width:a.width,height:a.height,x:a.x,buttonX:b.x,buttonY:b.y-a.y,buttonWidth:b.width,right:a.right};
        });
        assert.ok(geometry.height<=height-64+.1);
        assert.equal(geometry.buttonY,width<640?6:0);
        assert.equal(geometry.buttonX,width<640?(dir==='ltr'?geometry.right-geometry.buttonWidth-6:geometry.x+6):(dir==='ltr'?geometry.right+6:geometry.x-geometry.buttonWidth-6));
        await close();
      }
      await page.evaluate(()=>document.documentElement.removeAttribute('dir'));
      await page.setViewportSize({width:1280,height:900});
      // Interrupt before the entering transition finishes, then open again.
      for(let i=0;i<3;i++){
        await origin.click();await dialog.waitFor({state:'visible'});await page.keyboard.press('Escape');
        await dialog.waitFor({state:'hidden'});await settled();await open();await close();
      }
      // The origin may leave the viewport while a preview is open.
      await open();await page.locator('#imageOrigin').evaluate(e=>e.style.transform='translateY(-3000px)');
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>document.documentElement.classList.contains('image-preview-no-origin'));
      await settled();assert.equal(await dialog.evaluate(e=>e.open),false);
      await origin.evaluate(e=>e.style.removeProperty('transform'));
      await open();await close();
      // Geometry: contain letterboxing, non-centered placement, and scale-down.
      await page.locator('#imageOrigin img').evaluate(e=>{e.style.width='240px';e.style.height='360px';e.style.maxHeight='none';e.style.objectFit='contain';e.style.objectPosition='25% 75%';});
      await open();
      const geometry=await page.evaluate(()=>({inset:document.documentElement.style.getPropertyValue('--image-preview-source-inset'),radius:document.documentElement.style.getPropertyValue('--image-preview-source-radius')}));
      assert.notEqual(geometry.inset,'0%');assert.equal(geometry.radius,'0px');await close();
      await page.locator('#imageOrigin img').evaluate(e=>e.removeAttribute('style'));
      await page.emulateMedia({forcedColors:'active'});await origin.focus();await page.keyboard.press('Enter');
      await dialog.waitFor({state:'visible'});await settled();
      assert.equal(await page.locator('#closeImage').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
      assert.equal(await page.locator('#closeImage').evaluate(e=>getComputedStyle(e).outlineWidth),'2px');await close();
      await page.emulateMedia({forcedColors:'none'});
      const count=await page.evaluate(()=>previewTransitions.length);await open();await close();
      assert.equal(await page.evaluate(()=>previewTransitions.length),count+2);
      // Returning from pagehide must not leave a stale open request or hidden source.
      await origin.click();await dialog.waitFor({state:'visible'});
      await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
      await settled();assert.equal(await dialog.evaluate(e=>e.open),false);await open();await close();
      const afterReset=await page.evaluate(()=>previewTransitions.length);
      // Without View Transition support, use the immediate open/close fallback.
      await page.evaluate(()=>document.startViewTransition=undefined);await open();await close();
      assert.equal(await page.evaluate(()=>previewTransitions.length),afterReset);
      await page.evaluate(()=>location.hash='gallery');await page.evaluate(()=>location.hash='images');await open();await close();
      if(touch){
        await origin.tap();await dialog.waitFor({state:'visible'});await settled();
        await page.locator('#closeImage').tap();await dialog.waitFor({state:'hidden'});await settled();
        assert.equal(await origin.evaluate(e=>e===document.activeElement),true);
      }
      console.log(`PASS ${touch?'touch':'mouse'}: decoration, 1280/390/320 light/dark, keyboard/focus ownership, RTL/breakpoint/short viewport, dismissal, repeat/interruption, offscreen origin, contain and unsupported fallback`);
      await context.close();
    }
    assert.deepEqual(errors,[]);console.log('PASS no script or asset errors');
  } finally {await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
