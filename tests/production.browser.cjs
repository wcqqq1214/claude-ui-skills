// Exercise the built site through an ordinary static server, without Vite fallback.
const assert = require('node:assert/strict');
const http = require('node:http');
const { readFile, readdir, stat } = require('node:fs/promises');
const { resolve, join, extname, sep } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');

(async () => {
  const root = resolve(__dirname, '../dist');
  await stat(join(root, 'index.html')); // npm test and test:production build first.
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png' };
  const server = http.createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.startsWith('/claude-ui-skills/')) pathname = pathname.slice('/claude-ui-skills'.length);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(root, '.' + pathname);
      if (!file.startsWith(root + sep)) throw new Error('outside root');
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const errors = [];
  const observe = page => {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    page.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith(origin + '/')) errors.push(`External request: ${r.url()}`); });
  };
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage(); observe(page);
    const chapters = ['controls', 'segmented', 'type', 'reading', 'feedback', 'micro', 'recovery', 'composer', 'menus', 'workspace', 'modes', 'images', 'gallery', 'tasks'];
    for (const base of ['/', '/claude-ui-skills/']) {
      await page.goto(`${origin}${base}?lang=en#controls`);
      await page.getByRole('switch', { name: 'Switch', exact: true }).waitFor();
      assert.equal(await page.locator('html').getAttribute('data-cui-theme'), 'dark');
      assert.equal(await page.getByRole('navigation').getByRole('link').count(), 14);
      for (const id of chapters) {
        await page.locator(`nav a[href="#${id}"]`).click();
        await page.waitForFunction(id => document.querySelector('nav a[aria-current]')?.getAttribute('href') === '#' + id, id);
        assert.equal(await page.locator('main section:not([hidden])').count(), 1, `${id}: one visible chapter`);
        assert.ok((await page.locator('main section:not([hidden])').innerText()).trim().length > 20, `${id}: rendered content`);
        const heading = await page.locator('main h1').textContent();
        assert.equal(await page.locator('main section:not([hidden])').getAttribute('aria-label'), heading);
      }
      // Assets in image/gallery chapters and CSS fonts must decode after bundling.
      await page.locator('nav a[href="#images"]').click();
      await page.waitForFunction(() => [...document.querySelectorAll('main section:not([hidden]) img')].every(img => img.complete && img.naturalWidth > 0));
      const release = await page.locator('.cui-image-origin').first().evaluate(el => {
        const style = getComputedStyle(el, '::before');
        return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
      });
      assert.equal(release.duration, '0.45s', 'image press release retains its spring transition');
      assert.ok(release.easing.startsWith('linear('), release.easing);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => [...document.fonts].some(font => font.status === 'error')), false);
      await page.locator('nav a[href="#controls"]').click();
      await page.getByRole('switch', { name: 'Switch', exact: true }).click();
      const checked = await page.getByRole('switch', { name: 'Switch', exact: true }).getAttribute('aria-checked');
      await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('zh-Hans');
      await page.locator('nav a[href="#reading"]').click();
      await page.goBack();
      await page.getByRole('switch', { name: '开关', exact: true }).waitFor();
      assert.equal(await page.getByRole('switch', { name: '开关', exact: true }).getAttribute('aria-checked'), checked);
      assert.equal(new URL(page.url()).searchParams.get('lang'), 'zh-Hans');
      await page.goForward();
      await page.waitForFunction(() => document.querySelector('nav a[aria-current]')?.getAttribute('href') === '#reading');
      await page.reload();
      await page.getByRole('combobox', { name: '语言', exact: true }).waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
      await page.goto(`${origin}${base}demo/?lang=en#tasks`);
      await page.waitForFunction(() => document.querySelector('nav a[aria-current]')?.getAttribute('href') === '#tasks');
    }
    // Theme/locale persistence, system updates, invalid hash and narrow layout.
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
    await page.emulateMedia({ colorScheme: 'dark' });
    assert.equal(await page.locator('html').getAttribute('data-cui-theme'), 'light');
    await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('zh-Hans');
    await page.goto(`${origin}/claude-ui-skills/#unknown`);
    await page.getByRole('switch', { name: '开关', exact: true }).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-cui-theme'), 'light');
    await page.getByRole('combobox', { name: '主题', exact: true }).selectOption('system');
    await page.waitForFunction(() => document.documentElement.dataset.cuiTheme === 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForFunction(() => document.documentElement.dataset.cuiTheme === 'light');
    await page.setViewportSize({ width: 320, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    // Privacy settings may deny storage; rendering and explicit choices still work.
    const denied = await browser.newContext({ locale: 'zh-CN', colorScheme: 'dark' });
    await denied.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } }));
    const deniedPage = await denied.newPage(); observe(deniedPage);
    await deniedPage.goto(`${origin}/`);
    await deniedPage.getByRole('switch', { name: '开关', exact: true }).waitFor();
    await deniedPage.getByRole('combobox', { name: '语言', exact: true }).selectOption('en');
    await deniedPage.getByRole('switch', { name: 'Switch', exact: true }).waitFor();
    assert.equal(new URL(deniedPage.url()).searchParams.get('lang'), 'en');
    // Fetch every emitted file through the subpath, including optional font faces.
    async function files(directory, prefix = '') {
      const result = [];
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const name = prefix + entry.name;
        if (entry.isDirectory()) result.push(...await files(join(directory, entry.name), name + '/'));
        else result.push(name);
      }
      return result;
    }
    for (const file of await files(root)) {
      const response = await fetch(`${origin}/claude-ui-skills/${file}`);
      assert.equal(response.status, 200, file);
      assert.equal((await response.arrayBuffer()).byteLength, (await stat(join(root, file))).size, file);
    }
    assert.deepEqual(errors, []);
    console.log('Built root/subpath entries, 14 chapters, local assets, image spring, history, preferences and denied storage passed.');
  } finally {
    await browser?.close();
    await new Promise(done => server.close(done));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
