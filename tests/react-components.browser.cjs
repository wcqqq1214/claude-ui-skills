const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
// Covers the independent source consumer, demo state, geometry and native inputs.
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(`${base}/tests/fixtures/react-consumer/`);
    const controlled = page.getByRole('radiogroup', { name: 'Controlled', exact: true });
    const independent = page.getByRole('radiogroup', { name: 'Independent', exact: true });
    async function selected(group) { return group.locator('[aria-checked=true]').getAttribute('data-value'); }
    async function aligned(group) {
      await group.evaluate(async root => {
        await Promise.all(root.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const delta = await group.evaluate(root => {
        const thumb = root.querySelector('[data-part=indicator]').getBoundingClientRect();
        const button = root.querySelector('[aria-checked=true]').getBoundingClientRect();
        return { left: Math.abs(thumb.left - button.left), width: Math.abs(thumb.width - button.width), visible: getComputedStyle(root.querySelector('[data-part=indicator]')).visibility };
      });
      assert.equal(delta.visible, 'visible');
      assert.ok(delta.left <= 1 && delta.width <= 1, JSON.stringify(delta));
    }
    assert.equal(await page.getByLabel('Change calls').textContent(), '0', 'StrictMode mount must not emit a change');
    await aligned(controlled);
    assert.equal(await controlled.evaluate(element => element.offsetHeight), 32);
    assert.equal(await independent.evaluate(element => element.offsetHeight), 24);
    assert.equal(await page.getByRole('switch', { name: 'Enabled switch' }).evaluate(element => element.offsetWidth), 36);
    assert.equal(await page.getByRole('switch', { name: 'Disabled switch' }).isDisabled(), true);
    assert.equal(await page.getByLabel('Empty slider').isDisabled(), true);
    await controlled.getByRole('radio', { name: 'A longer label', exact: true }).press('ArrowRight');
    assert.equal(await selected(controlled), 'd', 'arrow skips disabled options');
    assert.equal(await selected(independent), 'a', 'instances are independent');
    await page.keyboard.press('ArrowRight');
    assert.equal(await selected(controlled), 'a', 'wraps');
    await page.keyboard.press('End');
    assert.equal(await selected(controlled), 'd');
    await page.keyboard.press('Home');
    assert.equal(await selected(controlled), 'a');
    assert.equal(await controlled.locator('[tabindex="0"]').count(), 1);
    await page.getByRole('button', { name: 'Parent selection', exact: true }).click();
    assert.equal(await selected(controlled), 'd');
    await aligned(controlled);
    // Interrupt animation in both directions; the final geometry still follows content.
    await controlled.getByRole('radio', { name: 'One', exact: true }).click();
    await controlled.getByRole('radio', { name: 'A longer label', exact: true }).click();
    await controlled.getByRole('radio', { name: 'Four', exact: true }).click();
    await aligned(controlled);
    await page.getByRole('button', { name: 'Translate', exact: true }).click();
    await aligned(controlled);
    await page.getByRole('button', { name: 'Scale', exact: true }).click();
    await aligned(controlled);
    await page.getByRole('button', { name: 'Visibility', exact: true }).click();
    await page.getByRole('button', { name: 'Visibility', exact: true }).click();
    await aligned(controlled);
    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    assert.equal(await controlled.evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(255, 255, 255, 0.05)');
    await page.getByRole('button', { name: 'Scale', exact: true }).click();
    const checkbox = page.getByRole('checkbox', { name: 'Native checkbox' });
    await checkbox.uncheck();
    assert.equal(await checkbox.isChecked(), false);
    await page.getByRole('button', { name: 'Reset checkbox' }).click();
    assert.equal(await checkbox.isChecked(), true);
    const slider = page.getByRole('slider', { name: 'Independent slider', exact: true });
    await slider.press('Home');
    assert.equal(await slider.inputValue(), '0');
    assert.equal(await slider.getAttribute('aria-valuetext'), 'One');
    await slider.press('End');
    assert.equal(await slider.inputValue(), '3');
    const bounds = await slider.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    assert.equal(await slider.locator('..').getAttribute('data-dragging'), 'true');
    await page.mouse.move(bounds.x + bounds.width + 100, bounds.y + 80);
    await page.mouse.up();
    assert.equal(await slider.locator('..').getAttribute('data-dragging'), null, 'release outside clears press feedback');
    await page.mouse.move(bounds.x + 50, bounds.y + 16);
    await page.mouse.down();
    await slider.dispatchEvent('pointercancel', { pointerId: 1 });
    assert.equal(await slider.locator('..').getAttribute('data-dragging'), null, 'cancel clears press feedback');
    await page.mouse.up();
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    assert.equal(await controlled.count(), 0);
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await aligned(controlled);
    assert.equal(await selected(controlled), 'd');
    assert.equal(await selected(independent), 'a');

    for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/demo/?lang=en#controls`);
      await setTheme(page, theme);
      await page.getByRole('switch', { name: 'Switch', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Checkbox', exact: true }).uncheck();
      await page.getByRole('slider', { name: 'Thinking effort' }).press('Home');
      await setLanguage(page, 'zh-Hans');
      assert.equal(await page.getByRole('switch', { name: '开关' }).getAttribute('aria-checked'), 'false');
      assert.equal(await page.getByRole('checkbox', { name: '复选框' }).isChecked(), false);
      assert.equal(await page.getByRole('slider', { name: '思考强度' }).inputValue(), '0');
      assert.equal(await page.getByRole('slider', { name: '思考强度' }).getAttribute('aria-valuetext'), '第 1 级，共 4 级');
      await chooseChapter(page, 'segmented');
      const demoSegment = page.getByRole('radiogroup', { name: '视图格式', exact: true });
      await demoSegment.getByRole('radio', { name: '代码', exact: true }).click();
      await aligned(demoSegment);
      await setLanguage(page, 'en');
      assert.equal(await page.getByRole('radiogroup', { name: 'View format', exact: true }).getByRole('radio', { name: 'Code', exact: true }).getAttribute('aria-checked'), 'true');
      await aligned(page.getByRole('radiogroup', { name: 'View format', exact: true }));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}/${theme}`);
      await page.goBack();
      assert.equal(await page.getByRole('switch', { name: '开关', exact: true }).getAttribute('aria-checked'), 'false', 'chapter history preserves state and restores URL language');
    }
    assert.deepEqual(errors, []);
    console.log('React consumer, keyboard, native inputs, interrupted geometry, themes, languages and narrow layouts passed.');
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
