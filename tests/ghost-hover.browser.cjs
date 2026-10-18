// PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/ghost-hover.browser.cjs
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
      const path = resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      res.writeHead(200,{'Content-Type':types[extname(path)] || 'application/octet-stream'}).end(await readFile(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
    const page = await browser.newPage({viewport:{width:1280,height:900}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400) errors.push(r.url());});
    const url=`http://127.0.0.1:${server.address().port}/showcase/index.html?lang=zh-Hans#micro`;
    await page.goto(url); await page.evaluate(()=>document.fonts.ready);
    const button=page.locator('#ghostButton'), eyes=page.locator('.ghost-eyes');
    const moveOut=()=>page.mouse.move(0,0);
    const animation=()=>eyes.evaluate(e=>getComputedStyle(e).animationName);
    assert.equal(await button.getAttribute('aria-label'),'幽灵按钮');
    assert.equal(await animation(),'none');
    for(let repeat=0;repeat<3;repeat++) {
      await button.hover();
      await page.waitForFunction(()=>document.querySelector('.ghost-eyes').getAnimations().length===1);
      const sample=await eyes.evaluate(e=>{
        const a=e.getAnimations()[0], style=getComputedStyle(e);
        const outline=e.nextElementSibling.getBoundingClientRect();
        return {name:style.animationName,duration:a.effect.getTiming().duration,iteration:style.animationIterationCount,start:a.currentTime,outline:[outline.x,outline.y,outline.width,outline.height]};
      });
      assert.equal(sample.name,'icon-ghost-look-around');assert.equal(sample.duration,2400);assert.equal(sample.iteration,'infinite');
      assert.ok(sample.start<500,'re-entry creates a fresh cycle');
      const positions=await eyes.evaluate(e=>{
        const a=e.getAnimations()[0];a.pause();
        const sampled=[0,700,1400,1900].map(t=>{a.currentTime=t;const m=new DOMMatrix(getComputedStyle(e).transform);return [m.e,m.f];});
        // Discard the scripted pause so the next hover starts from a single fresh animation.
        a.cancel();
        return sampled;
      });
      assert.deepEqual(positions,[[-1.5,0],[1.5,0],[0,-1.5],[0,0]]);
      await page.mouse.down();
      assert.equal(await animation(),'none');
      assert.equal(await eyes.evaluate(e=>getComputedStyle(e).transform),'none');
      await page.waitForFunction(()=>Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('.ghost-button-fill')).transform).a-.9375)<.00001);
      assert.equal(await button.locator('.ghost-button-fill').evaluate(e=>getComputedStyle(e).transform),'matrix(0.9375, 0, 0, 0.9375, 0, 0)');
      assert.deepEqual(await eyes.evaluate(e=>{const r=e.nextElementSibling.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}),sample.outline);
      await page.mouse.up();assert.equal(await animation(),'icon-ghost-look-around');
      assert.equal(page.url(),url);await moveOut();assert.equal(await animation(),'none');
    }
    await page.locator('#tipTarget').focus();await page.keyboard.press('Tab');
    assert.equal(await button.evaluate(e=>e===document.activeElement&&e.matches(':focus-visible')),true);
    assert.equal(await animation(),'none');await page.keyboard.down('Space');await page.waitForFunction(()=>Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('.ghost-button-fill')).transform).a-.9375)<.00001);
    assert.equal(await button.locator('.ghost-button-fill').evaluate(e=>getComputedStyle(e).transform),'matrix(0.9375, 0, 0, 0.9375, 0, 0)');
    await page.keyboard.up('Space');await page.keyboard.press('Enter');assert.equal(page.url(),url);
    await page.keyboard.press('Tab');assert.equal(await page.locator('#overflowWidth').evaluate(e=>e===document.activeElement),true);
    for(const theme of ['light','dark'])for(const width of [1280,390,320]) {
      await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.setViewportSize({width,height:844});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.deepEqual(await button.evaluate(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];}),[32,32]);
      await button.hover();assert.equal(await animation(),'icon-ghost-look-around');await moveOut();
    }
    await page.locator('#tipTarget').focus();await page.waitForTimeout(350);
    assert.equal(await page.locator('#demoTooltip').evaluate(e=>getComputedStyle(e).visibility),'visible');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#tipTarget').getAttribute('aria-describedby'),null);
    await page.locator('#toastBtn').click();await page.locator('#closeToast').click();await page.locator('#toast').waitFor({state:'hidden'});
    await page.locator('#languageBtn').click();await page.locator('[data-locale="en"]').click();assert.equal(await button.getAttribute('aria-label'),'Ghost button');
    assert.deepEqual(errors,[]);
    console.log('PASS repeat hover, eye positions, press/reset, stationary contour, keyboard, 1280/390/320 light/dark, language, existing tooltip/notice; no browser errors');
  } finally { await browser?.close(); await new Promise(r=>server.close(r)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
