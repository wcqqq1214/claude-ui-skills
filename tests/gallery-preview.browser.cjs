// PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/gallery-preview.browser.cjs
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFile} = require('node:fs/promises');
const {resolve, extname, sep} = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = resolve(__dirname, '..');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'};
(async () => {
  const server = createServer(async (req,res) => {
    try {
      const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
      res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'}).end(await readFile(path));
    }catch{res.writeHead(404).end();}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
  const errors=[];
  try{
    const page=await browser.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
    await page.addInitScript(()=>{
      const start=document.startViewTransition.bind(document);
      window.galleryTransitions=[];
      document.startViewTransition=callback=>{
        const t=start(callback),record={};window.galleryTransitions.push(record);
        t.ready.then(()=>{record.duration=getComputedStyle(document.documentElement,'::view-transition-group(root)').animationDuration;}).catch(()=>{});
        return t;
      };
    });
    const url=`http://127.0.0.1:${server.address().port}/showcase/index.html?lang=zh-Hans#gallery`;
    await page.goto(url);await page.evaluate(()=>document.fonts.ready);
    const dialog=page.locator('#galleryDialog'), opener=page.locator('[data-gallery="0"]');
    const settle=()=>page.waitForFunction(()=>!document.documentElement.classList.contains('gallery-crossfade'));
    const open=async()=>{await opener.click();await dialog.waitFor({state:'visible'});await settle();};
    const close=async()=>{await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await settle();assert.equal(await opener.evaluate(e=>e===document.activeElement),true);};
    for(const motion of ['no-preference','reduce'])for(const width of [1280,640,639,390,320]){
      await page.setViewportSize({width,height:800});
      await page.emulateMedia({reducedMotion:motion,colorScheme:width%2?'dark':'light'});
      await page.evaluate(()=>window.galleryTransitions=[]);
      await open();
      assert.equal(await page.locator('#closeGallery').evaluate(e=>e===document.activeElement),true);
      assert.equal(await page.locator('#galleryFilename').textContent(),'landscape.svg');
      const metrics=await page.evaluate(()=>{
        const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
        const css=s=>getComputedStyle(document.querySelector(s));
        return {close:rect('#closeGallery'),prev:rect('#galleryPrev'),next:rect('#galleryNext'),nav:rect('.gallery-navigation'),filename:rect('#galleryFilename'),bottom:rect('.gallery-bottom'),image:rect('.gallery-slide.current img'),radius:css('.gallery-slide.current img').borderRadius,closeBg:css('#closeGallery').backgroundColor,prevRadius:css('#galleryPrev').borderRadius,railDuration:css('#galleryRail').transitionDuration,slideDuration:css('.gallery-slide img').transitionDuration,overflow:document.documentElement.scrollWidth>innerWidth,transitions:window.galleryTransitions};
      });
      assert.equal(metrics.radius,'16px');assert.equal(metrics.prevRadius,'8px');
      assert.deepEqual([metrics.close.w,metrics.close.h,metrics.close.x,metrics.close.y],[32,32,width-48,16]);
      assert.deepEqual([metrics.prev.w,metrics.prev.h],[36,36]);
      assert.equal(metrics.bottom.h,56);assert.equal(metrics.bottom.bottom,776);
      assert.ok(Math.abs(metrics.nav.x+metrics.nav.w/2-width/2)<.1);
      assert.equal(metrics.closeBg,'rgba(0, 0, 0, 0)');assert.equal(metrics.overflow,false);
      assert.ok(metrics.image.w<=width*.75+.1&&metrics.image.h<=560.1);
      if(width<640){assert.equal(metrics.filename.bottom,metrics.bottom.y);assert.equal(metrics.filename.x,24);assert.equal(metrics.filename.right,width-24);}
      else {assert.equal(metrics.filename.x,24);assert.ok(metrics.filename.right<metrics.nav.x);}
      assert.equal(metrics.railDuration,motion==='reduce'?'0s':'0.3s');
      assert.equal(metrics.slideDuration,motion==='reduce'?'0s':'0.3s');
      if(motion==='reduce')assert.equal(metrics.transitions.length,0);
      else assert.equal(metrics.transitions[0].duration,'0.18s');
      // Tab order includes the aria-disabled endpoint.
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.gallery-slide.current').evaluate(e=>e===document.activeElement),true);
      await page.keyboard.press('Enter');assert.equal(await page.locator('.gallery-slide.current').getAttribute('aria-pressed'),'true');
      await page.keyboard.press('Tab');assert.equal(await page.locator('#galleryPrev').evaluate(e=>e===document.activeElement),true);
      await page.keyboard.press('Enter');assert.equal(await page.locator('.gallery-slide.current').getAttribute('aria-pressed'),'true');
      await page.keyboard.press('Tab');await page.keyboard.press('Enter');
      assert.equal(await page.locator('#galleryNext').evaluate(e=>e===document.activeElement),true);
      assert.equal(await page.locator('#galleryCount').textContent(),'2 / 3');
      assert.equal(await page.locator('#galleryFilename').textContent(),'landscape-dusk.svg');
      assert.equal(await page.locator('.gallery-slide.current').getAttribute('aria-pressed'),'false');
      assert.equal(await page.locator('.gallery-slide[aria-hidden="true"][role]').count(),0);
      await page.keyboard.press('End');await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#galleryCount').textContent(),'3 / 3');
      assert.equal(await page.locator('#galleryNext').getAttribute('aria-disabled'),'true');
      await page.keyboard.press('Tab');assert.equal(await page.locator('#closeGallery').evaluate(e=>e===document.activeElement),true);
      await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('#galleryNext').evaluate(e=>e===document.activeElement),true);
      await page.keyboard.press('Home');await close();await open();await close();
      console.log(`PASS gallery chrome, filename, keyboard, reset, repeat: ${width}px ${motion}`);
    }
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width:1280,height:800});
    // Immediate close/reopen must leave no stale transition or lost modal.
    for(let i=0;i<4;i++){
      await page.evaluate(()=>{document.querySelector('[data-gallery="0"]').click();document.querySelector('#closeGallery').click();document.querySelector('[data-gallery="1"]').click();});
      await dialog.waitFor({state:'visible'});await settle();
      assert.equal(await page.locator('#galleryFilename').textContent(),'landscape-dusk.svg');
      await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await settle();
    }
    await open();await page.locator('.gallery-slide.current img').click();
    const img=page.locator('.gallery-slide.current img');
    const before=await img.getAttribute('style');
    await page.mouse.move(640,400);await page.mouse.down();await page.mouse.move(690,435,{steps:8});await page.mouse.up();
    assert.notEqual(await img.getAttribute('style'),before);
    assert.equal(await page.locator('.gallery-slide.current').getAttribute('aria-pressed'),'true');
    await page.locator('#galleryNext').click();assert.equal(await page.locator('.gallery-slide.current').getAttribute('aria-pressed'),'false');
    await close();
    await page.evaluate(()=>document.documentElement.dir='rtl');await open();
    await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#galleryCount').textContent(),'2 / 3');
    await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#galleryCount').textContent(),'1 / 3');await close();
    await page.evaluate(()=>document.documentElement.dir='ltr');
    // Ellipsis must keep long captions away from navigation at either side of the breakpoint.
    for(const width of [320,639,640,1280]){
      await page.setViewportSize({width,height:800});await open();
      const fits=await page.evaluate(()=>{const f=document.querySelector('#galleryFilename');f.textContent='A'.repeat(250)+'.svg';const a=f.getBoundingClientRect(),n=document.querySelector('.gallery-navigation').getBoundingClientRect();return a.x>=0&&a.right<=innerWidth&&(a.bottom<=n.top||a.right<=n.left);});
      assert.equal(fits,true);await close();
    }
    // Older engines still open/close and restore focus without View Transitions.
    await page.evaluate(()=>document.startViewTransition=undefined);await open();await close();
    assert.deepEqual(errors,[]);console.log('PASS fast toggles, drag/reset, RTL, long filenames, View Transition fallback; no browser errors');
  }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
