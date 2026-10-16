// Explicit browser gate: PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/effort-popover.browser.cjs
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

    const url = `http://127.0.0.1:${server.address().port}/showcase/index.html?lang=en#controls`;
    await page.goto(url);
    await page.locator('#controlsSlow').click(); // Use normal playback speed for this check.
    const trigger = page.locator('#effortPopoverTrigger'), popup = page.locator('#effortPopover'),
      input = page.locator('#effortRange'), value = page.locator('#effortPopoverValue');
    const selected = () => value.textContent();
    const current = () => input.inputValue();
    const opened = () => popup.evaluate(e => e.open);
    const active = () => page.evaluate(() => document.activeElement.id);
    const settled = () => page.waitForFunction(() =>
      document.querySelector('#effortAnimatedLabel').children.length === 1 &&
      document.querySelector('#effortAnimatedLabel').getAnimations({subtree:true}).every(a => a.playState === 'finished'));
    assert.equal(await page.locator('.slider-card').count(), 1);
    assert.equal(await page.locator('.menus-effort-example').count(), 0);
    assert.equal(await page.locator('#chapterNav a').count(), 13);
    await trigger.click();
    assert.equal(await active(), 'effortPopover');
    assert.equal(await current(), '2');
    assert.equal(await popup.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
    const rail = await page.locator('#effortPopoverTrack .range-carriage').boundingBox();
    const point = i => ({x:rail.x + rail.width * i / 3, y:rail.y + rail.height / 2});
    await page.mouse.move(point(2).x,point(2).y); await page.mouse.down();
    await page.mouse.move(point(0).x,point(0).y,{steps:7});
    assert.equal(await current(), '0');
    assert.equal(await selected(), 'High', 'pointer movement previews without committing');
    await page.mouse.up();
    assert.equal(await selected(), 'Low'); assert.equal(await opened(), true);
    await settled();
    assert.equal(await page.locator('#effortAnimatedLabel .effort-label-layer').first().textContent(), 'Low');
    // A new pointer gesture is cancelled without changing the committed setting.
    await page.mouse.move(point(0).x,point(0).y); await page.mouse.down();
    await page.mouse.move(point(3).x,point(3).y,{steps:7});
    assert.equal(await current(), '3');
    await page.locator('#effortPopoverTrack').dispatchEvent('pointercancel',{pointerId:1});
    await page.mouse.up();
    assert.equal(await current(), '0'); assert.equal(await selected(), 'Low');
    await page.keyboard.press('Escape'); assert.equal(await active(), 'effortPopoverTrigger');
    await trigger.press('Enter'); assert.equal(await active(), 'effortRange');
    for (const [key,level] of [['ArrowRight','Medium'],['ArrowUp','High'],['End','Max'],['ArrowRight','Max'],['Home','Low'],['Shift+ArrowRight','Max'],['PageDown','Low']]) {
      await page.keyboard.press(key); assert.equal(await selected(),level,key); assert.equal(await opened(),true);
    }
    await page.keyboard.press('Tab'); assert.ok(['effortRange','effortPopover'].includes(await active()));
    await page.keyboard.press('Shift+Tab'); assert.ok(['effortRange','effortPopover'].includes(await active()));
    await page.keyboard.press('Escape');
    console.log('PASS pointer preview/commit/cancel, keyboard commit/bounds, modal focus and Escape return');
    for(let i=0;i<10;i++) {
      await trigger.press('Enter'); await page.keyboard.press(i%2?'Home':'End'); await page.keyboard.press('Escape');
      assert.equal(await opened(),false);
      assert.equal(await page.locator('#effortAnimatedLabel').evaluate(e=>e.getAnimations({subtree:true}).length),0);
    }
    await trigger.press('Enter');
    for(let i=0;i<12;i++) await page.keyboard.press(i%2?'Home':'End');
    await settled();
    assert.equal(await page.locator('#effortAnimatedLabel').evaluate(e=>e.children.length),1);
    assert.equal(await selected(),'Low');
    // A pointer starts within the popup and ends outside: keep the popup open.
    const nextRail = await page.locator('#effortPopoverTrack .range-carriage').boundingBox();
    await page.mouse.move(nextRail.x,nextRail.y+16); await page.mouse.down();
    await page.mouse.move(nextRail.x+nextRail.width+80,nextRail.y+16,{steps:5}); await page.mouse.up();
    assert.equal(await opened(),true); assert.equal(await selected(),'Max');
    await page.mouse.click(1200,40); assert.equal(await opened(),false);
    await trigger.click(); assert.equal(await current(),'3');
    await page.keyboard.press('Escape');
    await page.goto(url.replace('#controls','#menus'));
    await page.locator('#modelMenuButton').click(); await page.locator('#effortMenuButton').click();
    await page.locator('[data-effort="Medium"]').click();
    assert.match(await page.locator('#effortSelection').innerText(),/Medium/);
    await page.locator('#paletteOpen').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('#paletteCard').isVisible(),false);
    await page.goto(url); await trigger.click();
    assert.equal(await current(),'3','same-document chapter return retains committed value');
    // Programmatic chapter exit closes an open modal and clears animation state.
    await page.evaluate(()=>{location.hash='menus';});
    await page.waitForFunction(()=>!document.querySelector('#effortPopover').open);
    await page.goto(url); await page.reload();
    await trigger.click(); assert.equal(await current(),'2','reload resets the local sample');
    await page.keyboard.press('Escape');
    console.log('PASS rapid interruption, outside release/dismissal, reset, original submenu and artifact actions');
    await page.locator('#languageBtn').click(); await page.locator('[data-locale="zh-Hans"]').click();
    await trigger.press('Enter'); await page.keyboard.press('End'); await page.keyboard.press('Escape');
    assert.equal(await trigger.getAttribute('aria-label'),'思考强度：Max');
    for(const theme of ['light','dark']) {
      while(await page.locator('html').getAttribute('data-theme')!==theme) await page.locator('#themeBtn').click();
      await trigger.click();
      if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,`effort-${theme}.png`),fullPage:true});
      await page.keyboard.press('Escape');
    }
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:640}); await trigger.click();
      const box=await popup.boundingBox();
      assert.ok(box.x>=0 && box.x+box.width<=width && box.y>=0 && box.y+box.height<=640);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,`effort-${width}.png`),fullPage:true});
      await page.keyboard.press('Escape');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await trigger.press('Enter'); await page.keyboard.press('Home'); await page.keyboard.press('End');
    assert.equal(await selected(),'Max');
    assert.equal(await page.locator('#effortAnimatedLabel').evaluate(e=>e.getAnimations({subtree:true}).length),0);
    assert.equal(await page.locator('#effortPopoverTrack .range-thumb').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
    await page.keyboard.press('Escape');
    assert.deepEqual(errors,[]);
    console.log('PASS language/theme, 390/320px layouts, reduced motion and no browser/resource errors');
  } finally {
    await browser?.close();
    await new Promise(r => server.close(r));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
