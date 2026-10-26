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
        const request = new URL(req.url, 'http://localhost');
        if (request.pathname !== route) return next();
        try {
          const { render } = await vite.ssrLoadModule('/tests/fixtures/react-ssr/server.tsx');
          const html = `<!doctype html><html><head><meta charset="UTF-8"><link rel="icon" href="data:,"></head><body><div id="root">${render(request.searchParams.get('fixture'))}</div><script type="module" src="/tests/fixtures/react-ssr/main.tsx"></script></body></html>`;
          res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(await vite.transformIndexHtml(route, html));
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
    let releaseArtwork;
    const artwork = new Promise(resolve => { releaseArtwork = resolve; });
    await page.route('**/default-loop.webp', async route => { await artwork; await route.continue(); });
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' }), html = await response.text();
    try {
      await page.locator('[data-hydrated="true"]').waitFor();
      await page.waitForFunction(() => document.querySelector('[data-working] img')?.getAttribute('src')?.includes('default-loop.webp'));
      assert.equal(html.includes('data-failed'), true, 'server markup includes the same loading fallback as the first client render');
      assert.equal(await page.locator('[data-failed]').isVisible(), true, 'hydration preserves the fallback while artwork is pending');
      assert.equal(await page.locator('[data-working] img').isVisible(), false);
      assert.equal(await page.locator('[data-working] img').evaluate(image => image.naturalWidth), 0);
      assert.deepEqual(errors, [], 'loading fallback hydrates without warnings');
    } finally { releaseArtwork(); }
    await page.waitForFunction(() => document.querySelector('[data-working] img')?.getAnimations().length === 1);
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
    await failed.waitForFunction(() => document.querySelector('[data-working]') && !document.querySelector('[data-working] img'));
    assert.equal(await failed.locator('[data-working] img').count(), 0, 'decode failure retains the fallback contract');
    assert.deepEqual(failures, []);
    for (const fixture of ['default-notice', 'render-notice', 'artifact']) {
      const blocks = await browser.newPage();
      const hydrationErrors = [];
      blocks.on('pageerror', error => hydrationErrors.push(error.message));
      blocks.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') hydrationErrors.push(message.text()); });
      const response = await blocks.goto(`${url}?fixture=${fixture}`), markup = await response.text();
      assert.ok(markup.includes('data-ssr-preserve'), `${fixture}: block content exists in server HTML`);
      await blocks.locator('[data-hydrated="true"]').waitFor();
      assert.deepEqual(await blocks.evaluate(() => window.ssrCheck.recoverableErrors), [], `${fixture}: no recoverable hydration errors`);
      assert.deepEqual(hydrationErrors, [], `${fixture}: no hydration or invalid nesting warnings`);
      assert.equal(await blocks.evaluate(() => window.ssrCheck.nodes.length > 0 && window.ssrCheck.nodes.every(node => node.isConnected && document.querySelector('[data-ssr-preserve]') === node)), true, `${fixture}: hydration preserves the actual server DOM`);
      if (fixture !== 'artifact') {
        const message = blocks.locator(fixture === 'default-notice' ? '[data-default-message]' : '[data-rendered-message]');
        assert.equal(await message.evaluate(node => node.parentElement.tagName), 'DIV', 'messages accept block content');
        assert.deepEqual(await message.evaluate(node => {
          const style = getComputedStyle(node.parentElement);
          return { margin: style.margin, fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight };
        }), { margin: '0px', fontSize: '13px', lineHeight: '19px', fontWeight: '500' }, 'flow wrapper retains the original message text geometry');
      } else {
        const metadataStyle = async locator => locator.evaluate(node => {
          const style = getComputedStyle(node);
          return { margin: style.margin, fontSize: style.fontSize, lineHeight: style.lineHeight, padding: style.padding };
        });
        const text = blocks.locator('section[aria-label="Text artifact"] .cui-palette-thumb').locator('> :last-child');
        assert.deepEqual(await metadataStyle(text), { margin: '4px 0px 0px', fontSize: '11px', lineHeight: '17.6px', padding: '0px 4px' }, 'plain subtitle retains thumbnail text geometry');
        const empty = blocks.locator('section[aria-label="Empty artifact"] .cui-palette-thumb').locator('> :last-child');
        assert.equal(await empty.textContent(), '');
        assert.equal(await empty.evaluate(node => node.getBoundingClientRect().height), 0, 'omitted subtitle adds no text line');
        assert.equal(await blocks.locator('section[aria-label="Zero artifact"] .cui-palette-thumb').locator('> :last-child').textContent(), '0', 'falsy renderable subtitles remain visible');
        const paragraph = blocks.locator('[data-subtitle-paragraph]');
        assert.deepEqual(await paragraph.evaluate(node => ({ margin: getComputedStyle(node).margin, padding: getComputedStyle(node).padding })), { margin: '11px 0px', padding: '0px' }, 'subtitle wrapper styles do not leak onto nested paragraphs');
        await blocks.getByRole('button', { name: 'Block artifact actions', exact: true }).click();
        const menu = blocks.getByRole('menu', { name: 'Block artifact actions', exact: true });
        await menu.waitFor();
        assert.equal(await menu.locator('[data-block-subtitle]').count(), 1, 'expanded card also accepts block subtitles');
        assert.equal(await menu.locator('[data-block-subtitle]').evaluate(node => node.parentElement.tagName), 'DIV');
        assert.deepEqual(await metadataStyle(menu.locator('.cui-palette-header > :last-child')), { margin: '4px 0px 0px', fontSize: '11px', lineHeight: '17.6px', padding: '0px' }, 'expanded subtitle retains its text geometry');
        assert.deepEqual(hydrationErrors, [], 'opening a card with block subtitles remains valid');
      }
      await blocks.close();
    }
    console.log('React SSR: real renderToString/hydration, preserved server DOM for block notices and Artifact subtitles, browser asset decode, StrictMode playback, pause, Replay, unmount and fallback passed');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
