const assert = require('node:assert/strict');
const { cp, mkdtemp, rm, symlink } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const { captureNativeBrowserErrors } = require('./browser-errors.cjs');

async function withTailwindHost(run) {
  const root = resolve(__dirname, '..'), target = await mkdtemp(join(tmpdir(), 'cui-tailwind-host-'));
  let server, browser, result;
  const failures = [];
  try {
    await cp(join(root, 'examples/tailwind-host'), target, { recursive: true });
    await cp(join(root, 'src'), join(target, 'ui'), { recursive: true });
    await symlink(join(root, 'node_modules'), join(target, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    try { await promisify(execFile)(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--project', join(target, 'tsconfig.json')], { cwd: target }); }
    catch (error) { throw new Error(`Consumer typecheck failed:\n${error.stdout || ''}${error.stderr || ''}`, { cause: error }); }
    const { build, preview } = await import('vite');
    await build({ root: target, configFile: join(target, 'vite.config.mts'), logLevel: 'warn' });
    server = await preview({ root: target, configFile: join(target, 'vite.config.mts'), preview: { host: '127.0.0.1', port: 0, open: false } });
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    result = await run({ browser, base });
  } catch (error) { failures.push(error); }
  // Each resource gets a cleanup attempt; cleanup must not replace an earlier failure.
  for (const cleanup of [
    () => browser?.close(),
    () => server && new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done())),
    () => rm(target, { recursive: true, force: true }),
  ]) {
    try { await cleanup(); } catch (error) { failures.push(error); }
  }
  if (failures.length) throw failures[0];
  return result;
}

async function main() {
  await withTailwindHost(async ({ browser, base }) => {
    const page = await browser.newPage({ viewport: { width: 320, height: 740 } });
    const errors = [], external = [], assets = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); assets.push(response.url()); });
    page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(base + '/')) external.push(request.url()); });
    await captureNativeBrowserErrors(page, errors);
    await page.goto(base);
    const control = page.getByRole('switch', { name: 'Notifications' }), theme = page.getByRole('button', { name: 'Toggle theme' });
    await control.waitFor();
    await control.evaluate(node => { window.originalSwitch = node; });
    assert.equal(await theme.evaluate(node => getComputedStyle(node).paddingLeft), '16px', 'host Tailwind utilities remain available');
    assert.equal(await control.evaluate(node => node.getBoundingClientRect().height), 20, 'component scan paths emit control utilities');
    assert.equal(await page.locator('main').evaluate(node => getComputedStyle(node).color), 'rgb(11, 11, 11)');
    await control.press('Space');
    await page.getByRole('radio', { name: 'Code', exact: true }).click();
    assert.equal(await page.getByRole('status').textContent(), 'Notifications off; code');
    await theme.click();
    assert.equal(await page.locator('main').evaluate(node => getComputedStyle(node).color), 'rgb(240, 239, 236)');
    assert.equal(await control.getAttribute('aria-checked'), 'false');
    assert.equal(await control.evaluate(node => node === window.originalSwitch), true);
    assert.equal(await page.getByRole('radio', { name: 'Code', exact: true }).getAttribute('aria-checked'), 'true');
    await page.waitForFunction(() => [...document.images].some(image => image.complete && image.naturalWidth > 0));
    await page.evaluate(() => document.fonts.ready);
    assert.ok(assets.some(url => url.endsWith('.webp')), 'sprite asset copied and emitted');
    assert.ok(assets.some(url => url.endsWith('.woff2')), 'icon font copied and emitted');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    console.log('Independent Tailwind host: typecheck, build, host/component utilities, controlled keyboard state, scoped themes and local assets passed.');
  });
}

module.exports = { withTailwindHost };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
