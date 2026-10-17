// Explicit browser gate: PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/task-progress.browser.cjs
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
    await page.clock.install();
    await page.goto(url + '#tasks');
    await page.evaluate(() => document.fonts.ready);
    await page.clock.pauseAt(new Date(Date.now()+1000));
    const fold = page.locator('#progressFold'), earlier = page.locator('#progressEarlier');
    const progress = page.locator('#progressList');
    const replay = page.locator('#replayProgress');
    const count = () => page.locator('#progressCount').innerText();
    const advance = async ms => { await page.clock.runFor(ms); if (ms >= 200) await new Promise(r=>setTimeout(r,250)); };
    const status = () => progress.locator('.progress-row').evaluateAll(rows => rows.map(r=>r.dataset.state));
    await progress.scrollIntoViewIfNeeded();
    await advance(50);
    assert.equal(await count(), '3 of 6');
    assert.equal(await fold.innerText(), '1 earlier step\n'+String.fromCodePoint(57387));
    assert.equal(await earlier.evaluate(e=>e.inert), true);
    assert.equal((await earlier.boundingBox()).height, 0);
    assert.equal(await earlier.locator('.progress-row').count(), 1);
    // Native button keys, repeated interruptions, focus and real collapsed geometry.
    await fold.focus(); await page.keyboard.press('Enter'); await advance(250);
    assert.equal(await fold.getAttribute('aria-expanded'), 'true');
    assert.ok((await earlier.boundingBox()).height >= 31);
    assert.equal(await page.evaluate(()=>document.activeElement.id), 'progressFold');
    await page.keyboard.press('Space'); await advance(250);
    assert.equal((await earlier.boundingBox()).height, 0);
    for (let i=0;i<8;i++) { await fold.click(); await advance(30); }
    await advance(250);
    assert.equal(await fold.getAttribute('aria-expanded'), 'false');
    assert.equal(await earlier.evaluate(e=>e.inert),true);
    await fold.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    for (const [theme, inner] of [['light','rgb(249, 249, 247)'],['dark','rgb(11, 11, 11)']]) {
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      const shadow = await page.locator('.progress-fold-label').evaluate(e=>getComputedStyle(e).boxShadow);
      assert.ok(shadow.startsWith(inner + ' 0px 0px 0px 1px inset'), shadow);
    }
    console.log('PASS fold boundary, native Enter/Space, interrupted toggles and focus');

    await replay.click(); await advance(100);
    assert.equal(await count(),'0 of 3');
    assert.equal(await fold.isVisible(),false);
    assert.equal(await progress.locator('[data-building="true"]').count(),1);
    assert.equal(await progress.locator('.progress-sweep').evaluate(e=>getComputedStyle(e,'::after').animationPlayState),'running');
    await advance(1750);
    assert.deepEqual(await status(), ['in_progress','pending','pending']);
    assert.equal(await progress.locator('[data-kind="current"]').count(),1);
    const clay=await progress.locator('.progress-clay').evaluate(e=>({size:getComputedStyle(e).width,duration:getComputedStyle(e).animationDuration,background:getComputedStyle(e).backgroundImage}));
    assert.equal(clay.size,'8px'); assert.equal(clay.duration,'3s'); assert.ok(clay.background.includes('progress-clay.png'));
    await advance(3200);
    assert.deepEqual(await status(), ['completed','completed','in_progress','pending','pending','pending']);
    const entry = await progress.locator('.progress-step-enter').evaluateAll(rows=>rows.map(e=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration})));
    assert.equal(entry.length,3); assert.ok(entry.every(e=>e.name==='progress-step-in'&&e.duration==='0.22s'));
    await advance(1600);
    assert.equal(await fold.isVisible(),true);
    assert.equal(await earlier.locator('.progress-row').count(),1);
    await fold.press('Enter'); await advance(250);
    await page.evaluate(()=>DemoI18n.select('zh-Hans'));
    assert.equal(await fold.getAttribute('aria-expanded'),'true');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'progressFold');
    assert.ok((await fold.innerText()).includes('收起较早的步骤'));
    await advance(5000);
    assert.equal(await count(),'6 / 6');
    assert.equal(await earlier.locator('.progress-row').count(),4);
    assert.equal(await progress.locator('[data-kind="current"]').count(),0);
    assert.equal(await progress.locator('[data-kind="finished"]').count(),1);
    assert.equal(await fold.getAttribute('aria-expanded'),'true','progress updates preserve expanded state');
    assert.equal(await progress.locator('[data-shimmering="true"]').count(),0);
    assert.equal(await progress.locator('.status-shimmer-clone').evaluateAll(nodes=>nodes.every(e=>e.inert&&e.getAttribute('aria-hidden')==='true')),true);
    await replay.click(); await advance(1000); await replay.click(); await advance(1700);
    assert.equal(await count(),'0 / 3','old playback timers cannot update a restarted sample');
    assert.equal(await fold.isVisible(),false);
    await advance(200); assert.equal((await status())[0],'in_progress');
    await page.evaluate(()=>location.hash='controls'); await advance(100);
    const before = await status(); await advance(15000);
    assert.deepEqual(await status(),before,'chapter exit cancels pending state changes');
    await page.evaluate(()=>location.hash='tasks'); await advance(100);
    assert.equal(await page.locator('#effortRange').count(),1);
    assert.equal(await page.locator('#taskGrid button').count(),3);
    await page.locator('#taskGrid button').first().click();
    assert.equal(await page.locator('#taskDetail').isVisible(),true);
    await page.locator('#dragSource').press('Enter');
    assert.equal(await page.locator('#dropHint').innerText(), await page.evaluate(()=>DemoI18n.t('Added: design-notes.md (local page text only)')));
    await page.locator('#resetDrop').click();
    console.log('PASS append/current/completed stages, count folding, language stability, replay cancellation and existing task interactions');

    for (const theme of ['light','dark']) {
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      for (const width of [1280,390,320]) {
        await page.setViewportSize({width,height:900});
        await replay.click(); await advance(7000); await fold.press('Enter'); await advance(250);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        assert.ok(await progress.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
        const cards=await page.locator('.tasks-grid > .card').evaluateAll(cards=>cards.map(e=>e.getBoundingClientRect().toJSON()));
        assert.ok(cards[1].top>=cards[0].bottom,'cards never overlap');
        const text = await progress.locator('.progress-text').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1));
        assert.equal(text,true,'sample text wraps without horizontal clipping');
      }
    }
    console.log('PASS both themes at 1280/390/320 px, expanded list, wrapping and existing card layout');

    await page.emulateMedia({reducedMotion:'reduce'});
    await replay.click(); await advance(300);
    assert.equal(await progress.locator('.progress-sweep').evaluate(e=>getComputedStyle(e).display),'none');
    await advance(6750); await fold.press('Enter'); await advance(30);
    assert.ok((await earlier.boundingBox()).height>0);
    assert.equal(await earlier.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
    assert.equal(await progress.evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
    const label=progress.locator('[data-shimmering="true"]');
    assert.equal(await label.evaluate(e=>getComputedStyle(e).webkitTextFillColor===getComputedStyle(e).color),true);
    await page.keyboard.press('Space'); await advance(30);
    assert.equal((await earlier.boundingBox()).height,0);
    assert.equal(await earlier.evaluate(e=>e.inert),true);
    assert.deepEqual(errors,[]);
    console.log('PASS reduced-motion static feedback, immediate keyboard fold, no active animations and no page/load errors');

    // The app override keeps CSS transitions, unlike the system motion preference.
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(()=>document.documentElement.dataset.reduceMotion='true');
    await replay.click(); await advance(300);
    assert.equal(await progress.locator('.progress-sweep').evaluate(e=>getComputedStyle(e).display),'none');
    await advance(6750);
    assert.equal(await progress.locator('.status-shimmer-clone').evaluate(e=>getComputedStyle(e).display),'none');
    assert.equal(await progress.locator('.progress-clay').evaluate(e=>getComputedStyle(e).animationIterationCount),'1');
    assert.equal(await progress.evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
    assert.equal(await earlier.evaluate(e=>getComputedStyle(e).transitionDuration),'0.2s');
    await fold.press('Enter'); await advance(300);
    assert.ok((await earlier.boundingBox()).height>0);
    await page.evaluate(()=>delete document.documentElement.dataset.reduceMotion); await advance(100);
    assert.equal(await progress.locator('.progress-clay').evaluate(e=>getComputedStyle(e).animationIterationCount),'infinite');
    console.log('PASS app motion override, retained fold transition and preference restoration');

    // Use a real clock for clone replacement: preserved phase, rather than a fresh sweep.
    const motion = await browser.newPage({viewport:{width:1280,height:900}});
    motion.setDefaultTimeout(5000);
    motion.on('pageerror',e=>errors.push(e.message));
    await motion.goto(url+'#tasks');
    const current = motion.locator('.progress-row[data-state="in_progress"] .status-shimmer');
    await motion.waitForFunction(()=>document.querySelector('.progress-row[data-state="in_progress"] .status-shimmer')?.dataset.shimmerMode==='composited');
    await motion.waitForTimeout(400);
    const beforeClone = await current.evaluate(e=>{
      window.auditClone=e.lastElementChild;
      const a=window.auditClone.getAnimations({subtree:true}).find(a=>a.effect.pseudoElement==='::after');
      return a.startTime;
    });
    assert.equal(typeof beforeClone,'number');
    await motion.evaluate(()=>DemoI18n.select('zh-Hans'));
    const afterClone = await current.evaluate(e=>{
      const clone=e.lastElementChild;
      return {same:clone===window.auditClone,inert:clone.inert,text:clone.textContent,
        start:clone.getAnimations({subtree:true}).find(a=>a.effect.pseudoElement==='::after').startTime};
    });
    assert.equal(afterClone.same,false); assert.equal(afterClone.inert,true);
    assert.equal(afterClone.start,beforeClone); assert.ok(afterClone.text.includes('初稿'));
    await current.evaluate(e=>window.auditClone=e.lastElementChild);
    await motion.locator('#progressFold').press('Enter');
    assert.equal(await current.evaluate(e=>e.lastElementChild===window.auditClone),true,'unchanged content retains its clone');
    await motion.evaluate(()=>document.querySelector('#progressList').dataset.playing='false');
    await motion.waitForTimeout(50);
    const pausedTime=await current.evaluate(e=>e.lastElementChild.getAnimations({subtree:true}).find(a=>a.effect.pseudoElement==='::after').currentTime);
    await motion.evaluate(()=>DemoI18n.select('en'));
    const paused=await current.evaluate(e=>{
      const a=e.lastElementChild.getAnimations({subtree:true}).find(a=>a.effect.pseudoElement==='::after');
      return {state:a.playState,time:a.currentTime};
    });
    assert.equal(paused.state,'paused'); assert.equal(paused.time,pausedTime);
    await motion.evaluate(()=>document.querySelector('#progressList').dataset.playing='true');
    await motion.evaluate(()=>document.documentElement.dir='rtl');
    assert.equal(await current.locator('.status-shimmer-clone').evaluate(e=>getComputedStyle(e,'::after').animationName),'progress-shimmer-band-rtl');
    await motion.emulateMedia({forcedColors:'active'});
    assert.equal(await current.locator('.status-shimmer-clone').evaluate(e=>getComputedStyle(e).display),'none');
    await motion.close();

    for (const scenario of ['clamped','no-observer','no-compositing']) {
      const fallback=await browser.newPage();
      fallback.setDefaultTimeout(5000);
      fallback.on('pageerror',e=>errors.push(e.message));
      if (scenario==='clamped') await fallback.route('**/components/tasks.css',async route=>{
        const response=await route.fetch();
        await route.fulfill({response,body:(await response.text())+'\n.progress-text { -webkit-line-clamp: 1; }'});
      });
      if (scenario==='no-compositing') await fallback.addInitScript(()=>{
        const supports=CSS.supports.bind(CSS);
        CSS.supports=(...args)=>args[0]==='(-webkit-mask-clip: text) and (-webkit-app-region: drag)'?false:supports(...args);
      });
      await fallback.goto(url+'#tasks');
      if (scenario==='no-observer') await fallback.evaluate(()=>{
        const Observer=window.ResizeObserver;
        window.ResizeObserver=undefined;
        try {
          const old=document.querySelector('.progress-row[data-state="in_progress"] .status-shimmer');
          const fixture=createProgressShimmer(); old.replaceWith(fixture.element);
          fixture.update(true,'Working without ResizeObserver');
        } finally { window.ResizeObserver=Observer; }
      });
      await fallback.waitForFunction(()=>document.querySelector('.progress-row[data-state="in_progress"] .status-shimmer')?.dataset.shimmerMode==='fallback');
      const label=fallback.locator('.progress-row[data-state="in_progress"] .status-shimmer');
      assert.equal(await label.locator('.status-shimmer-clone').count(),0);
      assert.equal(await label.evaluate(e=>getComputedStyle(e).animationName),'status-shimmer-shine');
      assert.ok((await label.evaluate(e=>getComputedStyle(e).backgroundImage)).includes('linear-gradient'));
      await fallback.evaluate(()=>document.documentElement.dir='rtl');
      assert.equal(await label.evaluate(e=>getComputedStyle(e).animationName),'progress-shimmer-shine-rtl');
      await fallback.emulateMedia({forcedColors:'active'});
      assert.equal(await label.evaluate(e=>getComputedStyle(e).animationName),'none');
      assert.equal(await label.evaluate(e=>getComputedStyle(e).backgroundImage),'none');
      await fallback.emulateMedia({forcedColors:'none',reducedMotion:'reduce'});
      assert.equal(await label.evaluate(e=>getComputedStyle(e).webkitTextFillColor===getComputedStyle(e).color),true);
      assert.equal(await label.evaluate(e=>getComputedStyle(e).animationName),'none');
      assert.equal(await label.evaluate(e=>getComputedStyle(e).backgroundImage),'none');
      await fallback.close();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS shimmer content replacement preserves phase, RTL, forced colors and layout/capability fallbacks');

  } finally {
    await browser?.close(); await new Promise(r=>server.close(r));
  }
})().catch(e=>{ console.error(e); process.exitCode=1; });
