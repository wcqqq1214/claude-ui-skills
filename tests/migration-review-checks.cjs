const assert = require('node:assert/strict');

async function testStandaloneButtons(page, base) {
  const failures = [];
  for (const strict of ['off', 'on']) {
    await page.goto(`${base}/tests/fixtures/react-visual-parity/?strict=${strict}`);
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: `${theme} theme`, exact: true }).click();
      const expectations = [
        ['Model settings', '12px', theme === 'Light' ? '500' : '460', true],
        ['Search result', '12px', theme === 'Light' ? '500' : '460', true],
        ['Chat mode', '13px', theme === 'Light' ? '400' : '360', true],
        ['design-notes.md', '11px', theme === 'Light' ? '500' : '460', true],
        ['Disclosure title', '18px', theme === 'Light' ? '400' : '360', true],
        ['Undo action', '11px', theme === 'Light' ? '500' : '460', false],
      ];
      for (const [name, fontSize, fontWeight, textColor] of expectations) {
        const button = page.getByRole('button', { name, exact: true });
        await button.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {}))));
        const actual = await button.evaluate(node => {
          const style = getComputedStyle(node);
          const probe = document.createElement('span'); node.append(probe); probe.style.color = 'var(--cui-text)';
          probe.style.fontFamily = 'var(--cui-font-sans)';
          const color = getComputedStyle(probe).color, family = getComputedStyle(probe).fontFamily; probe.remove();
          return { family: style.fontFamily, size: style.fontSize, weight: style.fontWeight, color: style.color, text: color, expectedFamily: family };
        });
        try {
          assert.equal(actual.family, actual.expectedFamily);
          assert.equal(actual.size, fontSize);
          assert.equal(actual.weight, fontWeight);
          if (textColor) assert.equal(actual.color, actual.text);
        } catch (error) { failures.push(`${strict}/${theme}/${name}: ${error.message}`); }
      }
      // Component-local styling must not silently install a host button reset.
      const host = await page.getByRole('button', { name: 'Outside focus', exact: true }).evaluate(node => getComputedStyle(node).fontFamily);
      assert.doesNotMatch(host, /system-ui/);
      // Host customization of a component's root must still reach its buttons.
      await page.locator('.consumer-typography').evaluateAll(nodes => nodes.forEach(node => { node.style.fontFamily = 'monospace'; }));
      for (const [name] of expectations) {
        assert.equal(await page.getByRole('button', { name, exact: true }).evaluate(node => getComputedStyle(node).fontFamily), 'monospace', `${strict}/${theme}/${name}: root font customization is inherited`);
      }
      await page.locator('.consumer-typography').evaluateAll(nodes => nodes.forEach(node => node.style.removeProperty('font-family')));
    }
  }
  assert.deepEqual(failures, []);
}

async function testAccordionTypography(page, base) {
  for (const strict of ['off', 'on']) {
    await page.goto(`${base}/tests/fixtures/react-visual-parity/?strict=${strict}`);
    const section = page.getByRole('region', { name: 'Accordion typography', exact: true });
    const trigger = section.getByRole('button', { name: 'Custom disclosure', exact: true });
    const draft = section.getByRole('textbox', { name: 'Disclosure draft' });
    await trigger.waitFor();
    await trigger.evaluate(node => { window.typographyTrigger = node; });
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: `${theme} theme`, exact: true }).click();
      const regular = theme === 'Light' ? '400' : '360';
      const expected = [
        ['Custom disclosure', '12px', '500', '19.2px', 'mono'],
        // text-xs supplies both the font size and its default line height.
        ['Size override', '12px', regular, '16px', 'sans'],
        ['Weight override', '18px', '500', '32.4px', 'sans'],
        ['Line height override', '18px', regular, '28.8px', 'sans'],
        ['Family override', '18px', regular, '32.4px', 'mono'],
      ];
      async function typography(phase) {
        for (const [name, size, weight, lineHeight, family] of expected) {
          const actual = await section.getByRole('button', { name, exact: true }).evaluate((node, family) => {
            const probe = document.createElement('span'); probe.style.fontFamily = `var(--cui-font-${family})`; node.append(probe);
            const expectedFamily = getComputedStyle(probe).fontFamily; probe.remove();
            const style = getComputedStyle(node);
            return { size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight, family: style.fontFamily, expectedFamily };
          }, family);
          assert.deepEqual(actual, { size, weight, lineHeight, family: actual.expectedFamily, expectedFamily: actual.expectedFamily }, `${strict}/${theme}/${phase}/${name}: explicit utilities override defaults; unspecified properties inherit`);
        }
      }
      await typography('visible');
      await draft.fill('retained draft');
      const toggle = page.getByRole('button', { name: 'Toggle typography Activity', exact: true });
      await toggle.click(); await section.waitFor({ state: 'hidden' });
      await toggle.click(); await section.waitFor({ state: 'visible' });
      assert.equal(await trigger.evaluate(node => node === window.typographyTrigger), true, 'Activity retains the trigger DOM');
      assert.equal(await draft.inputValue(), 'retained draft');
      assert.equal(await toggle.evaluate(node => node === document.activeElement), true, 'reconnection preserves outside focus');
      await typography('reconnected');
    }
  }
}

async function testSearchInitialFocus(page, base) {
  for (const strict of ['off', 'on']) for (const autoFocus of [true, false]) {
    const context = `${strict}/autoFocus=${autoFocus}`;
    await page.goto(`${base}/tests/fixtures/react-menus/search-focus.html?strict=${strict}${autoFocus ? '' : '&no-focus'}`);
    const input = page.getByRole('searchbox', { name: 'Retained search' });
    const outside = page.getByRole('textbox', { name: 'Outside search' });
    await input.waitFor();
    assert.equal(await input.evaluate(node => node === document.activeElement), autoFocus, `${context}: initial focus`);
    await input.fill('retained query');
    await input.evaluate(node => { window.retainedSearch = node; });
    async function host(name) { await page.getByRole('button', { name, exact: true }).evaluate(node => node.click()); }
    for (let cycle = 0; cycle < 2; cycle++) {
      await host('Hide search'); await outside.fill('outside draft');
      await host('Show search'); await input.waitFor();
      assert.equal(await outside.evaluate(node => node === document.activeElement), true, `${context}: reconnect preserves external focus`);
      assert.equal(await input.evaluate(node => node === window.retainedSearch), true, `${context}: retained DOM`);
      assert.equal(await input.inputValue(), 'retained query');
      await host('Rerender');
      await page.waitForFunction(value => document.querySelector('input[type=search]').placeholder === String(value), cycle + 1);
      assert.equal(await outside.evaluate(node => node === document.activeElement), true, `${context}: rerender preserves focus`);
    }
    await host('Toggle autofocus'); await host('Toggle autofocus');
    assert.equal(await outside.evaluate(node => node === document.activeElement), true, `${context}: changing autofocus after mount does not steal focus`);
    await host('Toggle mount'); await input.waitFor({ state: 'detached' });
    await host('Toggle mount'); await input.waitFor();
    assert.equal(await input.evaluate(node => node === document.activeElement), autoFocus, `${context}: fresh mount follows autofocus`);
  }
}

async function testGalleryEffects(page, base) {
  const errors = [];
  const onError = error => errors.push(error.message);
  const onConsole = message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); };
  page.on('pageerror', onError); page.on('console', onConsole);
  await page.addInitScript(() => {
    const mode = new URLSearchParams(location.search).get('transitions');
    if (mode === 'unavailable') document.startViewTransition = undefined;
    if (mode === 'throws') document.startViewTransition = () => { throw new Error('Unavailable'); };
  });
  try {
    for (const strict of ['off', 'on']) for (const effect of ['layout', 'passive']) for (const transitions of ['native', 'unavailable', 'throws']) {
      const context = `${strict}/${effect}/${transitions}`;
      await page.goto(`${base}/tests/fixtures/react-gallery/effect.html?strict=${strict}&effect=${effect}&transitions=${transitions}`);
      const dialog = page.getByRole('dialog', { name: 'Effect gallery', includeHidden: true });
      const settle = () => page.waitForFunction(() => !document.querySelector('style[data-cui-gallery-transition]') && ![...document.querySelectorAll('.cui-gallery-rail, .cui-gallery-slide img')].some(node => node.getAnimations().some(animation => animation.playState === 'running')));
      async function host(name) { await page.getByRole('button', { name, exact: true, includeHidden: true }).evaluate(node => node.click()); }
      async function opened() {
        await dialog.waitFor({ state: 'visible' }); await settle();
        await page.waitForFunction(() => document.querySelector('[aria-label="Open dusk"]').getAttribute('aria-expanded') === 'true');
        assert.equal(await dialog.locator('.cui-gallery-filename').textContent(), 'dusk.svg', context);
        assert.equal(await page.getByRole('button', { name: 'Open dusk', includeHidden: true, exact: true }).getAttribute('aria-expanded'), 'true', context);
      }
      await opened();
      assert.deepEqual(JSON.parse(await page.locator('[data-effect-changes]').textContent()), [true], `${context}: initial effect probe delivers one opening`);
      await dialog.locator('.current').press('Enter');
      assert.equal(await dialog.locator('.current').getAttribute('aria-pressed'), 'true', `${context}: close exercises zoom cleanup too`);
      await dialog.evaluate(node => { window.effectDialog = node; });
      await host('Effect close'); await dialog.waitFor({ state: 'hidden' }); await settle();
      await page.waitForFunction(() => document.querySelector('[aria-label="Open dusk"]').getAttribute('aria-expanded') === 'false');
      await page.getByRole('textbox', { name: 'Outside gallery' }).fill('outside draft');
      await host('Effect open'); await opened();
      await host('Hide gallery'); await dialog.waitFor({ state: 'hidden' });
      await host('Show gallery'); await opened();
      assert.equal(await dialog.evaluate(node => node === window.effectDialog), true, `${context}: effect opening works on retained DOM`);
      await host('Effect close'); await dialog.waitFor({ state: 'hidden' }); await settle();
      await page.waitForFunction(() => document.querySelector('[aria-label="Open dusk"]').getAttribute('aria-expanded') === 'false');
      assert.deepEqual(JSON.parse(await page.locator('[data-effect-changes]').textContent()), [true, false, true, true, false], `${context}: cleanup stays silent and each requested transition delivers once`);
    }
    for (const strict of ['off', 'on']) for (const cancel of ['pagehide', 'inactive', 'hide', 'unmount', 'initial-inactive']) {
      await page.goto(`${base}/tests/fixtures/react-gallery/effect.html?strict=${strict}&effect=layout&transitions=unavailable&${cancel === 'initial-inactive' ? cancel : `cancel=${cancel}`}`);
      await page.locator('[data-effect-changes]').waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.deepEqual(JSON.parse(await page.locator('[data-effect-changes]').textContent()), [], `${strict}/${cancel}: cancelled initial request stays silent`);
      assert.equal(await page.locator('dialog[open]').count(), 0, `${strict}/${cancel}: no stale opening`);
    }
    assert.deepEqual(errors, [], 'imperative open/close inside effects must not emit React lifecycle warnings');
  } finally { page.off('pageerror', onError); page.off('console', onConsole); }
}
async function testDemoOriginalCopy(page, base) {
  const { chooseChapter, setLanguage } = require('./demo-helpers.cjs');
  for (const strict of ['off', 'on']) {
    await page.goto(`${base}/tests/fixtures/react-visual-parity/demo.html?lang=en&strict=${strict}#controls`);
    for (const locale of ['en', 'zh-Hans']) {
      if (locale !== 'en') await setLanguage(page, locale);
      const slider = page.getByRole('slider', { name: locale === 'en' ? 'Effort' : '思考强度', exact: true });
      await slider.press('Home');
      for (let index = 1; index <= 4; index++) {
        assert.equal(await slider.getAttribute('aria-valuetext'), locale === 'en' ? `Level ${index} of 4` : `第 ${index} 档，共 4 档`);
        if (index < 4) await slider.press('ArrowRight');
      }
      assert.equal(await page.getByText(locale === 'en' ? 'The fill follows the thumb, which grows while pressed.' : '填色跟随滑块移动，按住时轻微放大。', { exact: true }).count(), 1);
    }
    await chooseChapter(page, 'type');
    for (const [locale, name] of [['zh-Hans', '回到底部'], ['en', 'Scroll to bottom']]) {
      if (locale === 'en') await setLanguage(page, locale);
      assert.equal(await page.getByRole('button', { name, exact: true, includeHidden: true }).count(), 1, `${strict}/${locale}: original return-button name`);
    }
  }
}

module.exports = { testAccordionTypography, testStandaloneButtons, testSearchInitialFocus, testGalleryEffects, testDemoOriginalCopy };
