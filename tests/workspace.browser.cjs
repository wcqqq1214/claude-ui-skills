// Explicit browser gate: PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/workspace.browser.cjs
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
    assert.equal(await page.locator('#readingFlow').count(), 0);
    const handle = page.locator('#resizeHandle');
    const expand = page.locator('#expandPanel');
    const width = async () => Number(await handle.getAttribute('aria-valuenow'));
    const reset = async () => { await handle.focus(); await page.keyboard.press('Enter'); };
    assert.equal(await width(), 244);
    // Update the displayed width on each move; commit only past 3px.
    for (const [delta, expected] of [[3,244],[4,248]]) {
      await reset();
      const box = await handle.boundingBox(), x = box.x+box.width/2, y = box.y+30;
      await page.mouse.move(x,y); await page.mouse.down();
      await page.mouse.move(x+delta,y);
      assert.equal(await width(), 244+delta, 'live geometry before release');
      await page.mouse.up(); assert.equal(await width(), expected, 'commit boundary');
    }
    await reset();
    await page.keyboard.press('ArrowRight'); assert.equal(await width(),252);
    await page.keyboard.press('Shift+ArrowRight'); assert.equal(await width(),284);
    await page.keyboard.press('Home'); assert.equal(await width(),160);
    await page.keyboard.press('End');
    assert.equal(await width(), await page.locator('#workspaceLayout').evaluate(e=>Math.round(Math.min(520,e.getBoundingClientRect().width*.6))));
    await page.keyboard.press('ArrowLeft');
    assert.equal(await width(), Number(await handle.getAttribute('aria-valuemax'))-8);
    await page.keyboard.press('Enter'); assert.equal(await width(),244);
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space'); assert.equal(await width(),244);
    await page.keyboard.press('Shift+ArrowRight'); await handle.dblclick(); assert.equal(await width(),244);
    await handle.focus(); await page.keyboard.press('Control+ArrowRight'); assert.equal(await width(),244);
    console.log('PASS 3/4px commit boundary, 8/32px arrows, Home/End, Enter/Space/double-click reset');

    // Existing local pointer-cancel and keyboard-region behavior remain usable.
    const box=await handle.boundingBox();
    await page.mouse.move(box.x+6,box.y+30); await page.mouse.down();
    await page.mouse.move(box.x+66,box.y+30);
    await handle.dispatchEvent('pointercancel',{pointerId:1}); await page.mouse.up();
    assert.equal(await width(),244);
    await page.locator('#fileList .file').first().focus(); await page.keyboard.press('F6');
    assert.equal(await page.evaluate(()=>document.activeElement.closest('#fileSegment')!==null),true);
    await page.keyboard.press('F6'); assert.equal(await page.evaluate(()=>document.activeElement.id),'fileContent');
    await handle.focus(); await page.keyboard.press('Shift+ArrowRight');
    await page.locator('#fileSegment [data-value="code"]').click();
    await page.locator('[data-file="tokens"]').click();
    for(let i=0;i<8;i++) {
      await expand.click(); assert.equal(await page.locator('#fileList').evaluate(e=>e.inert),true);
      await expand.click(); assert.equal(await width(),276);
      assert.equal(await page.locator('#fileSegment [data-value="code"]').getAttribute('aria-checked'),'true');
    }
    assert.equal(await page.locator('#fileContent pre').count(),1);
    console.log('PASS cancellation, F6, eight expand/restore cycles and selected file/view continuity');

    await page.goto(url+'#type');
    const viewport=page.locator('#typeScroll');
    await viewport.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('#streamParagraphs').childElementCount>=5);
    await viewport.hover(); await page.mouse.wheel(0,-400); await page.waitForTimeout(300);
    const snapshot=await page.evaluate(()=>({top:document.querySelector('#typeScroll').scrollTop,count:document.querySelector('#streamParagraphs').childElementCount}));
    await page.waitForFunction(count=>document.querySelector('#streamParagraphs').childElementCount>count,snapshot.count);
    await page.waitForTimeout(80);
    assert.ok(Math.abs(await viewport.evaluate(e=>e.scrollTop)-snapshot.top)<=1,'released viewport stays put as content grows');
    await page.locator('#typeBottom').click();
    assert.ok(await viewport.evaluate(e=>e.scrollHeight-e.clientHeight-e.scrollTop)<=1);
    console.log('PASS existing stream follow releases on upward wheel and resumes on explicit return');

    await page.goto(url+'#workspace');
    await page.locator('#languageBtn').click(); await page.locator('[data-locale="zh-Hans"]').click();
    assert.equal(await page.locator('#workspace h2').innerText(),'文件面板');
    while(await page.locator('html').getAttribute('data-theme')!=='dark') await page.locator('#themeBtn').click();
    if(process.env.SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,'source-workspace-desktop.png'),fullPage:true});
    await expand.click(); await expand.click(); await reset(); assert.equal(await width(),244);
    const links=await page.locator('#chapterNav a').evaluateAll(a=>a.map(e=>e.hash));
    assert.equal(links.length,13);
    for(const hash of links) {
      await page.goto(url+hash);
      assert.equal(await page.locator('.specimen[data-active]').getAttribute('id'),hash.slice(1));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    }
    await page.goto(url);
    assert.equal(await page.locator('.specimen[data-active]').getAttribute('id'),'type');
    for(const narrow of [390,320]) {
      await page.setViewportSize({width:narrow,height:844}); await page.goto(url+'#workspace');
      assert.equal(await handle.isVisible(),false);
      await page.locator('[data-file="tokens"]').click();
      await expand.click(); await expand.click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      if(process.env.SCREENSHOT_DIR && narrow===390) await page.screenshot({path:resolve(process.env.SCREENSHOT_DIR,'source-workspace-mobile.png'),fullPage:true});
    }
    assert.deepEqual(errors,[]);
    console.log('PASS original chapter anchors, languages, themes, 390/320px layouts');
  } finally {
    await browser?.close();
    await new Promise(r => server.close(r));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
