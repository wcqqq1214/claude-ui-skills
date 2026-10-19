const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');

(async () => {
  const { createServer } = await import('vite');
  const route = '/__ssr-consumer/';
  const server = await createServer({
    root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false },
    plugins: [{ name: 'ssr-consumer-fixture', configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (req.url !== route) return next();
        try {
          const { render } = await vite.ssrLoadModule('/tests/fixtures/react-ssr/server.tsx');
          const html = `<!doctype html><html><head><link rel="icon" href="data:,"></head><body><div id="root">${render()}</div><script type="module" src="/tests/fixtures/react-ssr/main.tsx"></script></body></html>`;
          res.setHeader('Content-Type', 'text/html'); res.end(await vite.transformIndexHtml(route, html));
        } catch (error) { next(error); }
      });
    } }],
  });
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}${route}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const response = await page.goto(url), html = await response.text();
    await page.locator('[data-hydrated="true"]').waitFor();
    await page.waitForFunction(() => document.querySelector('[data-failed]') || document.querySelector('[data-working] img')?.getAnimations().length);
    assert.equal(await page.locator('[data-failed]').count(), 0, 'server-rendered WorkingMark hydrates and decodes its browser resource');
    assert.equal(html.includes('file://'), false, 'server HTML never exposes a filesystem image URL');
    assert.deepEqual(errors, [], 'server and first client markup match without hydration errors');
    const image = page.locator('[data-working] img');
    assert.equal(await image.evaluate(element => new URL(element.src).protocol), 'http:');
    assert.ok(await image.evaluate(element => element.naturalWidth > 0));
    assert.equal(await image.evaluate(element => element.getBoundingClientRect().width), 20);
    await page.waitForFunction(() => document.querySelector('[data-working] img').getAnimations()[0]?.playState === 'running');
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    assert.equal(await image.evaluate(element => element.getAnimations()[0].playState), 'paused');
    const paused = await image.evaluate(async element => { const animation = element.getAnimations()[0]; await animation.ready; return animation.currentTime; });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await image.evaluate(element => element.getAnimations()[0].currentTime), paused);
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-working] img').getAnimations()[0].playState === 'running');
    const original = await image.evaluateHandle(element => ({ element, animation: element.getAnimations()[0] }));
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-working] img')?.getAnimations().length === 1);
    assert.equal(await original.evaluate(value => value.element.isConnected), false);
    assert.equal(await original.evaluate(value => value.animation.playState), 'idle', 'Replay cancels the old animation');
    const replay = await image.evaluateHandle(element => element.getAnimations()[0]);
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    assert.equal(await page.locator('[data-working]').count(), 0);
    assert.equal(await replay.evaluate(animation => animation.playState), 'idle', 'unmount cancels playback');
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-working] img')?.getAnimations().length === 1);
    assert.deepEqual(errors, []);

    const failed = await browser.newPage();
    const failures = [];
    failed.on('pageerror', error => failures.push(error.message));
    await failed.route('**/default-loop.webp', route => route.abort());
    await failed.goto(url);
    await failed.locator('[data-failed]').waitFor();
    assert.equal(await failed.locator('[data-working] img').count(), 0, 'decode failure retains the fallback contract');
    assert.deepEqual(failures, []);
    console.log('React SSR: real renderToString/hydration, browser asset decode, StrictMode playback, pause, Replay, unmount and fallback passed');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
