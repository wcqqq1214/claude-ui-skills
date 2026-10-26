const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
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
    // Existing visitors retain their choices; unsupported values fall through
    // to a valid saved choice or the browser language, as before the migration.
    const preferenceCases = [
      { name: 'legacy preferences', storage: { 'claude-ui-studies.language': 'zh-Hans', 'claude-ui-studies.theme': 'dark' }, language: 'zh-Hans', theme: 'dark' },
      { name: 'current preferences take precedence', storage: { 'claude-ui-studies.language': 'zh-Hans', 'claude-ui-studies.theme': 'dark', 'cui-demo-locale': 'en', 'cui-demo-theme': 'system' }, language: 'en', theme: 'light' },
      { name: 'invalid current values retain valid legacy preferences', storage: { 'claude-ui-studies.language': 'zh-Hans', 'claude-ui-studies.theme': 'dark', 'cui-demo-locale': 'invalid', 'cui-demo-theme': 'invalid' }, language: 'zh-Hans', theme: 'dark' },
      { name: 'unsupported query retains saved language', storage: { 'cui-demo-locale': 'zh-Hans' }, query: '?lang=fr', language: 'zh-Hans', theme: 'light' },
      { name: 'invalid saved language uses browser language', storage: { 'cui-demo-locale': 'invalid' }, browserLocale: 'zh-CN', language: 'zh-Hans', theme: 'light' },
      { name: 'supported query overrides saved language', storage: { 'cui-demo-locale': 'zh-Hans', 'claude-ui-studies.language': 'zh-Hans' }, query: '?lang=en', language: 'en', theme: 'light' },
    ];
    for (const entry of preferenceCases) {
      const preferences = await browser.newContext({ locale: entry.browserLocale ?? 'en-US', colorScheme: 'light' });
      await preferences.addInitScript(storage => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, entry.storage);
      const savedPage = await preferences.newPage(); observe(savedPage);
      await savedPage.goto(`${origin}/claude-ui-skills/${entry.query ?? ''}#controls`);
      await savedPage.waitForFunction(() => document.documentElement.dataset.cuiTheme);
      assert.equal(await savedPage.locator('html').getAttribute('lang'), entry.language, entry.name);
      assert.equal(await savedPage.locator('html').getAttribute('data-cui-theme'), entry.theme, entry.name);
      assert.equal(await savedPage.evaluate(() => localStorage.getItem('cui-demo-locale')), entry.language, `${entry.name}: persist the resolved choice`);
      await preferences.close();
    }
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage(); observe(page);
    const chapters = ['controls', 'type', 'reading', 'feedback', 'micro', 'recovery', 'composer', 'menus', 'workspace', 'modes', 'images', 'gallery', 'tasks'];
    for (const base of ['/', '/claude-ui-skills/']) {
      for (const entry of ['', 'demo/']) {
        await page.goto(`${origin}${base}${entry}?lang=en#controls`);
        await page.getByRole('radiogroup', { name: 'View format', exact: true }).waitFor();
        assert.equal(await page.locator('nav a[aria-current]').getAttribute('href'), '#controls', 'built entries open the merged Controls chapter');
      }
      await page.goto(`${origin}${base}?lang=en#controls`);
      await page.getByRole('switch', { name: 'Switch', exact: true }).waitFor();
      assert.equal(await page.locator('html').getAttribute('data-cui-theme'), 'dark');
      assert.equal(await page.getByRole('navigation').getByRole('link').count(), 13);
      for (const id of chapters) {
        await page.locator(`nav a[href="#${id}"]`).click();
        await page.waitForFunction(id => document.querySelector('nav a[aria-current]')?.getAttribute('href') === '#' + id, id);
        assert.equal(await page.locator('main section:not([hidden])').count(), 1, `${id}: one visible chapter`);
        const section = page.locator('main section:not([hidden])');
        if (id === 'images' || id === 'gallery') {
          // Media chapters show thumbnails; optional explanations start hidden.
          const names = id === 'images' ? ['Enlarge landscape example'] : [1, 2, 3].map(index => `Open gallery image ${index}`);
          for (const name of names) {
            const thumbnail = section.getByRole('button', { name, exact: true });
            assert.equal(await thumbnail.isVisible(), true, `${id}: visible thumbnail action`);
            await thumbnail.locator('img').evaluate(image => image.decode());
            assert.ok(await thumbnail.locator('img').evaluate(image => image.naturalWidth > 0), `${id}: decoded thumbnail`);
          }
        } else assert.ok((await section.innerText()).trim().length > 20, `${id}: rendered content`);
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
      await setLanguage(page, 'zh-Hans');
      await page.locator('nav a[href="#reading"]').click();
      await page.goBack();
      await page.getByRole('switch', { name: '开关', exact: true }).waitFor();
      assert.equal(await page.getByRole('switch', { name: '开关', exact: true }).getAttribute('aria-checked'), checked);
      assert.equal(new URL(page.url()).searchParams.get('lang'), 'zh-Hans');
      await page.goForward();
      await page.waitForFunction(() => document.querySelector('nav a[aria-current]')?.getAttribute('href') === '#reading');
      await page.reload();
      await page.getByRole('button', { name: '语言', exact: true }).waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans');
      await page.goto(`${origin}${base}demo/?lang=en#tasks`);
      await page.waitForFunction(() => document.querySelector('nav a[aria-current]')?.getAttribute('href') === '#tasks');
    }
    // Theme/locale persistence, system updates, invalid hash and narrow layout.
    await setTheme(page, 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    assert.equal(await page.locator('html').getAttribute('data-cui-theme'), 'light');
    await setLanguage(page, 'zh-Hans');
    await page.goto(`${origin}/claude-ui-skills/#unknown`);
    await page.getByRole('heading', { name: '文字与排版', exact: true }).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-cui-theme'), 'light');
    await setTheme(page, 'system');
    await page.waitForFunction(() => document.documentElement.dataset.cuiTheme === 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForFunction(() => document.documentElement.dataset.cuiTheme === 'light');
    await page.setViewportSize({ width: 320, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const picker = page.locator('.demo-chapter-toggle');
    assert.equal(await picker.getAttribute('aria-expanded'), 'false');
    await chooseChapter(page, 'reading');
    assert.equal(await picker.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('main h1').evaluate(el => el === document.activeElement), true, 'closing the narrow picker restores focus before hiding the link');
    await page.evaluate(() => window.scrollTo(0, 1000));
    assert.ok(await page.evaluate(() => scrollY > 0), 'the long narrow chapter has scrolled');
    const historyBeforeReselect = await page.evaluate(() => history.length);
    await chooseChapter(page, 'reading');
    assert.equal(await page.evaluate(() => scrollY), 0, 'reselecting the current chapter returns to the top');
    assert.equal(await page.evaluate(() => history.length), historyBeforeReselect, 'reselection adds no history entry');
    await chooseChapter(page, 'type');
    await page.waitForFunction(() => scrollY === 0);
    const languageButton = page.locator('.demo-topbar button[aria-haspopup=menu]');
    await picker.click();
    await page.locator('nav a').last().focus();
    await page.keyboard.press('Tab');
    assert.equal(await languageButton.evaluate(el => el === document.activeElement), true);
    assert.equal(await picker.getAttribute('aria-expanded'), 'false', 'keyboard focus outside closes the chapter picker');
    await languageButton.press('ArrowUp');
    assert.equal(await page.getByRole('menuitemradio', { name: 'English', exact: true }).evaluate(el => el === document.activeElement), true, 'ArrowUp opens on the last menu item');
    await page.keyboard.press('Escape');
    await languageButton.press('ArrowDown');
    const chinese = page.getByRole('menuitemradio', { name: '简体中文', exact: true });
    assert.equal(await chinese.evaluate(el => el === document.activeElement), true);
    await chinese.press('End');
    assert.equal(await page.getByRole('menuitemradio', { name: 'English', exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await languageButton.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hans', 'focus preview does not commit a language');
    // Translation preserves the reading position through text reflow and the
    // following ResizeObserver frame, including nested horizontal scrollers.
    const localePage = await context.newPage(); observe(localePage);
    await localePage.setViewportSize({ width: 390, height: 500 });
    await localePage.goto(`${origin}/claude-ui-skills/?lang=en#reading`);
    await localePage.evaluate(() => document.fonts.ready);
    const settleLocale = () => localePage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
    await settleLocale();
    await localePage.evaluate(() => { document.documentElement.style.overflowAnchor = 'auto'; window.scrollTo(0, 300); });
    const localeHistory = await localePage.evaluate(() => history.length);
    for (const locale of ['zh-Hans', 'en', 'zh-Hans']) {
      await setLanguage(localePage, locale);
      await settleLocale();
      assert.equal(await localePage.evaluate(() => scrollY), 300, `${locale}: translating the narrow reading page retains its vertical position`);
      assert.equal(await localePage.evaluate(() => document.documentElement.style.overflowAnchor), 'auto', 'translation restores the host overflow-anchor setting');
      assert.equal(await localePage.evaluate(() => history.length), localeHistory, 'choosing a language replaces the current history entry');
    }
    await localePage.evaluate(() => {
      for (const locale of ['en', 'zh-Hans']) {
        const url = new URL(location.href); url.searchParams.set('lang', locale);
        history.replaceState(history.state, '', url); window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
    await settleLocale();
    assert.equal(await localePage.evaluate(() => scrollY), 300, 'batched language changes that return to the current locale preserve the position');
    assert.equal(await localePage.evaluate(() => document.documentElement.style.overflowAnchor), 'auto', 'batched language changes still release scroll anchoring');
    await setLanguage(localePage, 'en');
    await localePage.getByRole('radio', { name: 'Code & tables', exact: true }).click();
    const localeTable = localePage.locator('.demo-reading-code [role="region"]');
    await localeTable.evaluate(element => { element.scrollLeft = 160; window.scrollTo(0, 150); });
    assert.equal(await localeTable.evaluate(element => element.scrollLeft), 160, 'the narrow table can be scrolled horizontally');
    const retainedTable = await localeTable.elementHandle();
    for (const locale of ['zh-Hans', 'en']) {
      await setLanguage(localePage, locale);
      await settleLocale();
      assert.equal(await localePage.evaluate(() => scrollY), 150, `${locale}: code view retains its vertical position`);
      assert.equal(await localeTable.evaluate(element => element.scrollLeft), 160, `${locale}: table translation retains its horizontal position`);
      assert.equal(await localeTable.evaluate((element, previous) => element === previous, retainedTable), true, 'translation retains the table viewport DOM');
    }
    await localePage.close();
    // The demo chrome intentionally changed; retain geometry assertions for the
    // original controls rather than freezing the old card padding and captions.
    await page.setViewportSize({ width: 1280, height: 400 });
    await chooseChapter(page, 'reading');
    await page.evaluate(() => window.scrollTo(0, 300));
    assert.ok(await page.evaluate(() => scrollY > 0));
    await chooseChapter(page, 'reading');
    assert.equal(await page.evaluate(() => scrollY), 0, 'desktop reselect also returns to the top');
    await page.setViewportSize({ width: 1280, height: 720 });
    await chooseChapter(page, 'controls');
    const range = await page.locator('.demo-wide .cui-range').boundingBox();
    assert.equal(range.width, 520, 'demo preserves the original slider width');
    assert.equal(range.height, 48, 'demo preserves the original slider height');
    // Privacy settings may deny storage; rendering and explicit choices still work.
    const denied = await browser.newContext({ locale: 'zh-CN', colorScheme: 'dark' });
    await denied.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } }));
    const deniedPage = await denied.newPage(); observe(deniedPage);
    await deniedPage.goto(`${origin}/`);
    await deniedPage.getByRole('heading', { name: '文字与排版', exact: true }).waitFor();
    await chooseChapter(deniedPage, 'controls');
    await setLanguage(deniedPage, 'en');
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
    console.log('Built root/subpath entries, 13 chapters, local assets, image spring, history/reselection, legacy/current preferences, language fallback and denied storage passed.');
  } finally {
    await browser?.close();
    await new Promise(done => server.close(done));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
