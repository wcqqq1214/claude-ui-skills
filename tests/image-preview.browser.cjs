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
      const origin=page.locator('#imageOrigin'),dialog=page.locator('#imageDialog');
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
        assert.equal(metrics.radius,'6px');assert.equal(metrics.inside,true);assert.equal(metrics.overflow,false);
        assert.ok(metrics.shadow.includes('0.3')&&metrics.shadow.includes('0.25'));
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
        assert.equal(frames[0].borderTopLeftRadius,i%2?'6px':'7px');
        assert.equal(frames.at(-1).borderTopLeftRadius,i%2?'7px':'6px');
      }
      await page.setViewportSize({width:1280,height:900});
      for(const method of ['button','image','backdrop','escape']){await open();await close(method);}
      for(const key of ['Enter','Space']){
        await origin.focus();await page.keyboard.press(key);await dialog.waitFor({state:'visible'});await settled();
        assert.equal(await page.locator('#closeImage').evaluate(e=>e===document.activeElement),true);
        await page.keyboard.press('Tab');
        assert.equal(await dialog.evaluate(e=>document.activeElement===document.body || e.contains(document.activeElement)),true);
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.locator('#closeImage').evaluate(e=>e===document.activeElement),true);
        await close();
      }
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
      await page.locator('#imageOrigin img').evaluate(e=>{e.style.height='360px';e.style.objectFit='contain';e.style.objectPosition='25% 75%';});
      await open();
      const geometry=await page.evaluate(()=>({inset:document.documentElement.style.getPropertyValue('--image-preview-source-inset'),radius:document.documentElement.style.getPropertyValue('--image-preview-source-radius')}));
      assert.notEqual(geometry.inset,'0%');assert.equal(geometry.radius,'0px');await close();
      await page.locator('#imageOrigin img').evaluate(e=>e.removeAttribute('style'));
      for(const width of [1280,390,320]){
        await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
        const count=await page.evaluate(()=>previewTransitions.length);
        await open();await close();assert.equal(await page.evaluate(()=>previewTransitions.length),count);
        assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.animationName?.startsWith('image-preview')).length),0);
      }
      await page.emulateMedia({reducedMotion:'no-preference'});
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
      console.log(`PASS ${touch?'touch':'mouse'}: decoration, 1280/390/320 light/dark, keyboard, dismissal, repeat/interruption, offscreen origin, contain, reduced motion and unsupported fallback`);
      await context.close();
    }
    assert.deepEqual(errors,[]);console.log('PASS no script or asset errors');
  } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
