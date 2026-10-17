// PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_BIN=/path/to/chrome node tests/icon-alignment.browser.cjs
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
    browser = await chromium.launch({executablePath:process.env.CHROME_BIN, headless:true});
    for (const width of [1280,390,320]) for (const theme of ['light','dark']) {
      const page = await browser.newPage({viewport:{width,height:900}, colorScheme:theme, reducedMotion:width===320?'reduce':'no-preference'});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(r.url()); });
      const go = async chapter => {
        await page.goto(`http://127.0.0.1:${server.address().port}/showcase/index.html?lang=${width===1280?'en':'zh-Hans'}#${chapter}`);
        await page.evaluate(() => document.fonts.ready);
      };
      const centered = async (selector, relativeToHost=false) => {
        const offsets = await page.locator(selector).evaluateAll((icons, host) => icons.map(icon => {
          const parent = host ? icon.parentElement : icon.closest('button');
          const a=icon.getBoundingClientRect(), b=parent.getBoundingClientRect();
          return {glyph:icon.dataset.glyph,dy:Math.abs(a.y+a.height/2-b.y-b.height/2), dx:Math.abs(a.x+a.width/2-b.x-b.width/2)};
        }), relativeToHost);
        assert.ok(offsets.length,selector);
        for (const o of offsets) {
          assert.ok(o.dy<0.1,`${selector} ${o.glyph} vertical offset ${o.dy}`);
          if (relativeToHost || selector.includes('pinned-more') || selector.includes('paletteOpen')) assert.ok(o.dx<0.1,`${selector} ${o.glyph} horizontal offset ${o.dx}`);
        }
      };
      await go('modes');
      await centered('#modeTrack .study-icon');
      await page.locator('.pinned-main').first().focus();
      await page.keyboard.press('ArrowRight');
      await centered('.pinned-more .study-icon');
      for (let i=0;i<3;i++) {
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#pinnedMenu').isVisible(),true);
        await centered('#pinnedMenu .study-icon',true);
        await page.keyboard.press('Escape');
      }
      await go('menus');
      await centered('#paletteOpen .study-icon');
      await go('reading');
      const samples = await page.locator('.reading-baseline-line').evaluateAll(rows=>rows.map(row=>{
        const icon=row.querySelector('.study-icon').getBoundingClientRect();
        const guide=row.querySelector('.reading-baseline-guide').getBoundingClientRect();
        return icon.bottom-guide.top;
      }));
      assert.equal(samples.length,2);
      assert.ok(Math.abs(samples[1]-samples[0]-2)<0.1,`baseline offset ${samples}`);
      await go('workspace');
      for (let i=0;i<4;i++) {
        await page.locator('#expandPanel').click();
        await centered('#expandPanel .study-icon',true);
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(errors,[]);
      await page.close();
      console.log(`PASS icon slot centers, keyboard menus, inline 2px baseline and dynamic panel icons: ${width}px ${theme}`);
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
