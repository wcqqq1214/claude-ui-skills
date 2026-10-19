const { setTheme, setLanguage, chooseChapter } = require('./demo-helpers.cjs');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false } }); await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      window.attachmentTransitions = [];
      const nativeStart = document.startViewTransition?.bind(document);
      if (nativeStart) document.startViewTransition = options => {
        const record = { applied: 0, ready: false, exit: false };
        window.attachmentTransitions.push(record);
        const transition = nativeStart({ ...options, update: () => { record.applied++; return options.update(); } });
        transition.ready.then(() => { record.ready = true; record.exit = document.getAnimations().some(animation => animation.animationName === 'cui-attachment-out'); }).catch(() => {});
        return transition;
      };
    });
    await page.goto(`${base}/tests/fixtures/react-composer/`); await page.evaluate(() => document.fonts.ready);
    const first = page.getByRole('region', { name: 'First composer', exact: true }), second = page.getByRole('region', { name: 'Second composer', exact: true });
    const editor = first.getByRole('textbox'), popup = first.getByRole('listbox', { name: 'References' });
    const draft = async () => JSON.parse(await first.locator('[data-draft]').textContent());
    assert.equal(await first.locator('[data-changes]').textContent(), '0', 'StrictMode initialization emits no draft edits');
    async function expectDraft(text, message) {
      assert.equal((await draft()).text, text, `${message}: editing callback`);
      await first.getByRole('button', { name: 'Read draft', exact: true }).click();
      assert.equal((await draft()).text, text, `${message}: getDraft`);
    }
    for (const keys of [['Enter', 'Enter'], ['Shift+Enter', 'Shift+Enter'], ['Enter', 'Shift+Enter'], ['Shift+Enter', 'Enter'], ['Enter', 'Shift+Enter', 'Enter']]) {
      for (const [start, end] of [['First', 'Third'], ['', 'Third'], ['First', ''], ['', '']]) {
        await first.getByRole('button', { name: 'Clear draft', exact: true }).click();
        await editor.fill(start); await editor.press('End');
        for (const key of keys) await editor.press(key);
        if (end) await editor.pressSequentially(end);
        await expectDraft(`${start}${'\n'.repeat(keys.length)}${end}`, `${keys.join('/')} preserves middle, leading, trailing and empty paragraphs`);
      }
    }
    await first.getByRole('button', { name: 'Clear draft', exact: true }).click();
    await editor.fill('First'); await editor.press('End'); await editor.press('Shift+Enter');
    await expectDraft('First\n', 'soft break omits only the native caret placeholder');
    await editor.focus(); await editor.press('Backspace');
    await expectDraft('First', 'backspace removes the soft break');
    await editor.focus(); await editor.press('ControlOrMeta+z');
    await expectDraft('First\n', 'undo restores the soft break');
    await editor.focus(); await editor.press('ControlOrMeta+Shift+z');
    await expectDraft('First', 'redo removes the soft break again');
    await first.getByRole('button', { name: 'Clear draft', exact: true }).click();
    await editor.fill('First'); await editor.press('End'); await editor.press('Enter'); await editor.press('Enter'); await editor.pressSequentially('Third');
    await editor.evaluate(element => { const range = document.createRange(); range.setStart(element.firstChild, 2); range.setEnd(element.lastChild.firstChild, 2); getSelection().removeAllRanges(); getSelection().addRange(range); });
    await editor.press('Shift+Enter');
    await expectDraft('Fi\nird', 'soft break replaces a real selection spanning an empty paragraph');
    await editor.focus(); await editor.press('ControlOrMeta+z');
    await expectDraft('First\n\nThird', 'undo restores the selected paragraphs without DOM rewriting');
    await first.getByRole('button', { name: 'Use trailing newline default', exact: true }).click();
    await first.getByRole('button', { name: 'Read draft', exact: true }).click();
    assert.equal((await draft()).text, 'First\n', 'defaultText trailing newlines are authored content');
    await editor.evaluate(element => { element.focus(); const range = document.createRange(); range.setStart(element.firstChild, 5); range.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(range); });
    await editor.press('Shift+Enter');
    await expectDraft('First\n\n', 'soft break before an authored trailing newline retains both');
    await editor.focus(); await editor.press('ControlOrMeta+z');
    await expectDraft('First\n', 'undo retains the original trailing newline');
    await editor.focus(); await editor.press('ControlOrMeta+Shift+z');
    await expectDraft('First\n\n', 'redo retains both trailing newlines');
    await first.getByRole('button', { name: 'Clear draft', exact: true }).click();
    await editor.focus();
    await editor.evaluate(element => { const data = new DataTransfer(); data.setData('text/plain', '\nFirst\n\n'); element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data })); });
    await expectDraft('\nFirst\n\n', 'plain-text paste retains leading and trailing blank lines');
    await editor.evaluate(element => { element.focus(); const range = document.createRange(); range.selectNodeContents(element); range.collapse(false); getSelection().removeAllRanges(); getSelection().addRange(range); });
    await editor.press('ArrowLeft'); await editor.press('Shift+Enter');
    await expectDraft('\nFirst\n\n\n', 'soft break next to pasted trailing newlines retains authored content');
    await editor.focus(); await editor.press('ControlOrMeta+z');
    await expectDraft('\nFirst\n\n', 'undo restores the pasted trailing newlines');
    await first.getByRole('button', { name: 'Clear draft', exact: true }).click();
    await editor.fill('@'); await popup.waitFor();
    assert.equal(await popup.getByRole('option').count(), 2);
    const firstId = await editor.getAttribute('aria-activedescendant');
    await editor.press('ArrowUp'); assert.equal(await editor.getAttribute('aria-activedescendant'), firstId);
    await editor.press('ArrowDown'); const lastId = await editor.getAttribute('aria-activedescendant'); assert.notEqual(lastId, firstId);
    await editor.press('ArrowDown'); assert.equal(await editor.getAttribute('aria-activedescendant'), lastId);
    await editor.press('Enter'); assert.equal(await popup.count(), 0);
    const atoms = editor.locator('[data-cui-mention]'); assert.equal(await atoms.count(), 1);
    assert.equal((await draft()).mentions[0].id, 'layout'); assert.ok((await draft()).text.includes('Layout notes'));
    assert.equal(/[\uE000-\uF8FF]/.test((await draft()).text), false, 'serialized draft excludes icon glyphs');
    assert.equal(await editor.evaluate(element => element === document.activeElement), true);
    await editor.press('Backspace'); await editor.press('Backspace');
    assert.equal(await atoms.count(), 0, 'reference deletes atomically after its separating space');
    await editor.press('ControlOrMeta+z'); assert.equal(await atoms.count(), 1, 'browser undo restores reference');
    await first.getByRole('button', { name: 'Clear draft', exact: true }).click(); await editor.fill('@land'); await popup.waitFor(); await editor.press('Tab');
    assert.equal(await atoms.count(), 1); assert.equal(await editor.evaluate(element => element === document.activeElement), true);
    await editor.press('Enter'); await editor.press('Enter');
    await expectDraft('Landscape illustration \n\n', 'mention titles keep their separating space and empty paragraphs');
    assert.deepEqual((await draft()).mentions, [{ id: 'landscape', title: 'Landscape illustration' }]);
    await editor.focus(); await editor.press('ControlOrMeta+z');
    await expectDraft('Landscape illustration ', 'native undo restores the mention before the grouped paragraph edit');
    await editor.focus(); await editor.press('ControlOrMeta+Shift+z');
    await expectDraft('Landscape illustration \n\n', 'native redo restores the empty paragraph');
    const atomTitle = await atoms.first().getAttribute('title');
    await atoms.first().click(); assert.notEqual(await atoms.first().getAttribute('data-selected'), null);
    await atoms.first().click({ button: 'right' });
    const menu = first.getByRole('menu'); await menu.waitFor(); await menu.press('ArrowDown');
    assert.equal(await first.getByRole('menuitem', { name: 'Delete reference' }).evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Escape'); assert.equal(await menu.count(), 0); assert.equal(await editor.evaluate(element => element === document.activeElement), true);
    await atoms.first().click({ button: 'right' }); await menu.waitFor(); await menu.press('ArrowDown'); await page.keyboard.press('Enter');
    assert.equal(await atoms.count(), 0); await editor.press('ControlOrMeta+z'); assert.equal(await atoms.count(), 1);
    await first.getByRole('button', { name: 'Language', exact: true }).click(); assert.equal(await atoms.first().getAttribute('title'), atomTitle, 'localization never rewrites existing atoms');
    await first.getByRole('button', { name: 'Language', exact: true }).click();
    await editor.fill('@'); await popup.waitFor(); await editor.press('Escape'); await editor.press('ArrowLeft'); await editor.press('ArrowRight'); assert.equal(await popup.count(), 0, 'dismissed bare @ stays dismissed');
    await editor.press('l'); await popup.waitFor();
    await editor.evaluate(element => element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
    assert.equal(await popup.count(), 0);
    await editor.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })));
    assert.equal(await atoms.count(), 0, 'IME Enter cannot insert a mention');
    await editor.evaluate(element => element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))); await popup.waitFor();
    await editor.press('Escape');
    await editor.evaluate(element => { const data = new DataTransfer(); data.setData('text/plain', '<b>plain</b>'); data.setData('text/html', '<span data-cui-mention="fake">fake</span>'); element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data })); });
    assert.equal(await atoms.count(), 0); assert.ok((await editor.textContent()).includes('<b>plain</b>'));
    await editor.fill('保留这段草稿\nA second line');
    const before = await draft(); await first.getByRole('button', { name: 'Visibility', exact: true }).click(); await first.getByRole('button', { name: 'Read draft', exact: true }).click(); assert.deepEqual(await draft(), before);
    await first.getByRole('button', { name: 'Visibility', exact: true }).click(); assert.equal(await editor.innerText(), before.text);
    await second.getByRole('textbox').fill('@'); await second.getByRole('listbox').waitFor(); assert.equal(await popup.count(), 0, 'independent editor owns its popup');
    await second.getByRole('textbox').press('Tab'); assert.equal(await second.locator('[data-cui-mention]').count(), 1);

    const width = first.getByRole('slider', { name: 'Width' });
    const setWidth = async value => { await width.evaluate((element, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, String(value)); element.dispatchEvent(new Event('input', { bubbles: true })); }, value); await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); };
    const chin = first.locator('.cui-composer-chin'), project = first.getByRole('button', { name: 'Project', exact: true });
    await project.focus();
    const folded = [], boundaries = []; let previous = await chin.getAttribute('data-picker-mode');
    for (let value = 240; value >= 156; value--) { await setWidth(value); const mode = await chin.getAttribute('data-picker-mode'); if (mode !== previous) { folded.push(mode); boundaries.push(value); previous = mode; } }
    assert.deepEqual(folded, ['words', 'icons']); assert.equal(await project.evaluate(element => element === document.activeElement), true);
    const recovered = [];
    for (let value = 156; value <= 240; value++) { await setWidth(value); const mode = await chin.getAttribute('data-picker-mode'); if (mode !== previous) { recovered.push({ mode, width: value }); previous = mode; } }
    assert.deepEqual(recovered.map(item => item.mode), ['words', 'words-and-carets']); assert.ok(recovered[0].width >= boundaries[1] + 2); assert.ok(recovered[1].width >= boundaries[0] + 2);
    await editor.fill(Array.from({ length: 16 }, (_, index) => `Line ${index}`).join('\n')); assert.equal(await editor.evaluate(element => element.clientHeight), 130);
    await setWidth(680);
    await first.getByRole('button', { name: 'Add attachment', exact: true }).click(); assert.equal(await first.locator('[data-cui-attachment]').count(), 3);
    const remove = () => first.getByRole('button', { name: /^Remove / }).first();
    await remove().focus(); await page.keyboard.down('Delete');
    await page.waitForFunction(() => document.querySelector('[aria-label="First composer"]').querySelectorAll('[data-cui-attachment]').length === 2);
    await page.keyboard.down('Delete'); assert.equal(await first.locator('[data-cui-attachment]').count(), 2, 'held delete does not remove the newly focused tile'); await page.keyboard.up('Delete');
    assert.equal(await remove().evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Control+Delete'); assert.equal(await first.locator('[data-cui-attachment]').count(), 2);
    await remove().press('Delete'); await page.waitForFunction(() => document.querySelector('[aria-label="First composer"]').querySelectorAll('[data-cui-attachment]').length === 1);
    await remove().press('Backspace'); assert.equal(await first.locator('[data-cui-attachment]').count(), 0); assert.equal(await editor.evaluate(element => element === document.activeElement), true);
    assert.equal(await second.locator('[data-cui-attachment]').count(), 2);
    const transitions = await page.evaluate(() => window.attachmentTransitions);
    if (await page.evaluate(() => typeof document.startViewTransition === 'function' && CSS.supports('selector(:active-view-transition-type(cui-attachments))'))) {
      assert.equal(transitions.length, 2, 'last tile skips snapshot transition');
      assert.ok(transitions.every(item => item.applied === 1));
      assert.ok(transitions.some(item => item.ready && item.exit), 'real view-transition exit uses authored scale/fade keyframes');
    }
    await first.getByRole('button', { name: 'Add attachment', exact: true }).click(); assert.equal(await first.locator('[data-cui-attachment]').count(), 1);
    // The unsupported-API path still updates and returns focus synchronously.
    await page.evaluate(() => { document.startViewTransition = undefined; });
    await remove().focus(); await remove().press('Delete'); assert.equal(await first.locator('[data-cui-attachment]').count(), 0);
    await page.getByRole('button', { name: 'Mount', exact: true }).click(); await page.getByRole('button', { name: 'Mount', exact: true }).click(); assert.equal(await first.locator('[data-changes]').textContent(), '0');
    // Simulate a delayed browser snapshot callback after its React owner is gone.
    const removedBefore = await page.locator('#removed').textContent();
    await page.evaluate(() => {
      window.delayedUpdates = [];
      document.startViewTransition = options => { window.delayedUpdates.push(options.update); return { ready: Promise.resolve(), updateCallbackDone: new Promise(() => {}), finished: Promise.resolve(), skipTransition() {} }; };
      const supports = CSS.supports.bind(CSS); CSS.supports = query => query.includes('cui-attachments') || supports(query);
    });
    await remove().focus(); await remove().press('Delete');
    assert.equal(await page.evaluate(() => window.delayedUpdates.length), 1);
    await page.getByRole('button', { name: 'Mount', exact: true }).click();
    await page.evaluate(() => { for (const update of window.delayedUpdates) { update(); update(); } });
    assert.equal(await page.locator('#removed').textContent(), removedBefore, 'unmount invalidates delayed removal callbacks');

    for (const touch of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, hasTouch: touch }); const demo = await context.newPage();
      demo.on('pageerror', error => errors.push(error.message));
      for (const w of [1280, 390, 320]) for (const theme of ['light', 'dark']) {
        await demo.setViewportSize({ width: w, height: 1000 }); await demo.goto(`${base}/demo/?lang=en#composer`); await demo.reload();
        await setTheme(demo, theme); await demo.evaluate(() => document.fonts.ready);
        const draft = demo.locator('.cui-composer-editor'); await draft.fill('Keep my draft');
        const slider = demo.getByRole('slider', { name: 'Width limit' }); await slider.focus(); await slider.press('Home');
        await demo.waitForFunction(() => document.querySelector('.cui-composer-chin').dataset.pickerMode === 'icons');
        assert.equal(await demo.locator('.cui-composer-project').evaluate(element => element.offsetWidth), touch ? 32 : 24);
        assert.equal(await demo.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'narrow composer does not overflow');
        await slider.press('End'); await setLanguage(demo, 'zh-Hans');
        assert.equal(await draft.innerText(), 'Keep my draft');
        const cnEditor = demo.getByRole('textbox', { name: '演示输入框' });
        await cnEditor.fill('@'); const suggestions = demo.getByRole('listbox'); await suggestions.waitFor();
        const rect = await suggestions.boundingBox(); assert.ok(rect.x >= 15 && rect.x + rect.width <= w - 15, `${w}/${theme}/touch:${touch} popup is clamped`);
        await cnEditor.press('Enter'); assert.equal(await cnEditor.locator('[data-cui-mention]').count(), 1);
      }
      await context.close();
    }
    assert.deepEqual(errors, []); console.log('React composer: native editing/undo, IME/paste, independent instances, responsive picker hysteresis, attachment removal/focus and bilingual mouse/touch layouts passed');
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
