const assert = require('node:assert/strict');

async function testStreamParagraphGeometry(page, base) {
  for (const strict of ['off', 'on']) for (const width of [1280, 621, 620, 390]) {
    const context = `${strict}/${width}px`;
    await page.setViewportSize({ width, height: 1000 });
    // A distinct document per width prevents hash navigation from reusing an
    // already-running demo sequence (which may reset during measurement).
    const response = await page.goto(`${base}/tests/fixtures/react-visual-parity/demo.html?lang=en&strict=${strict}&width=${width}#type`);
    assert.ok(response, `${context}: viewport checks load a fresh document`);
    await page.evaluate(() => document.fonts.ready);
    const stream = page.getByRole('region', { name: 'Streaming text example', exact: true });
    await stream.scrollIntoViewIfNeeded();
    // Use the real demo arrival timer, so this checks appended paragraphs as
    // well as the static introduction instead of a synthetic copy of the DOM.
    // Capture presence and geometry in one task even if a slow machine lets
    // the sequence reach another replay cycle before the next protocol call.
    const snapshot = await page.waitForFunction(() => {
      const nodes = document.querySelectorAll('[aria-label="Streaming text example"] p');
      return nodes.length >= 2 ? [...nodes].map(node => ({ minHeight: getComputedStyle(node).minHeight, height: node.getBoundingClientRect().height })) : false;
    });
    const paragraphs = await snapshot.jsonValue();
    await snapshot.dispose();
    assert.ok(paragraphs.length >= 2, `${context}: the real stream contains its introduction and appended content`);
    for (const [index, paragraph] of paragraphs.entries()) {
      // Legacy .reading p reserves the introduction's desktop height, while
      // #streamParagraphs p deliberately removes it for appended content.
      const reservesHeight = index === 0 && width > 620;
      assert.equal(paragraph.minHeight, reservesHeight ? '73px' : '0px', `${context}: ${index === 0 ? 'introduction' : `appended paragraph ${index}`} retains the baseline minimum height`);
      if (reservesHeight) assert.ok(paragraph.height >= 73, `${context}: the introduction reserves its desktop space`);
    }
    assert.equal(await page.locator('.demo-type-body').evaluate(node => getComputedStyle(node).minHeight), '73px', `${context}: the stream rule does not change the separate body-fade specimen`);
  }
}

async function testWorkspaceReadoutTheme(page, base) {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const strict of ['off', 'on']) {
    await page.goto(`${base}/tests/fixtures/react-visual-parity/?strict=${strict}`);
    const workspace = page.getByRole('region', { name: 'Workspace sample', exact: true });
    const handle = workspace.getByRole('separator', { name: 'Resize file list', exact: true });
    const readout = workspace.locator('.cui-workspace-width');
    for (const [theme, expected] of [['Light theme', 'rgb(198, 97, 63)'], ['Dark theme', 'rgb(217, 119, 87)'], ['Custom clay', 'rgb(71, 119, 163)']]) {
      const context = `${strict}/${theme}`;
      await page.getByRole('button', { name: theme, exact: true }).click();
      await handle.press('ArrowRight');
      assert.equal(await handle.evaluate(node => node.matches(':focus-visible')), true, `${context}: keyboard resizing visibly focuses the separator`);
      assert.equal(await readout.evaluate(node => getComputedStyle(node).color), expected, `${context}: keyboard focus uses the scoped clay color`);
      await page.getByRole('button', { name: 'Outside focus', exact: true }).click();
      const box = await handle.boundingBox(), x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      try {
        await page.mouse.move(x + 24, y);
        assert.equal(await workspace.locator('[data-resizing]').count(), 1, `${context}: a real pointer drag is active`);
        assert.equal(await handle.evaluate(node => node.matches(':focus-visible')), false, `${context}: dragging is checked independently of keyboard focus`);
        assert.equal(await readout.evaluate(node => getComputedStyle(node).color), expected, `${context}: pointer dragging uses the scoped clay color`);
      } finally { await page.mouse.up(); }
    }
  }
}

async function testPinnedTextWeight(page, base) {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const strict of ['off', 'on']) {
    await page.goto(`${base}/tests/fixtures/react-visual-parity/?strict=${strict}`);
    const pins = page.getByRole('region', { name: 'Pinned sample', exact: true });
    for (const [theme, expected] of [['Light theme', '500'], ['Dark theme', '460']]) {
      await page.getByRole('button', { name: theme, exact: true }).click();
      assert.deepEqual(await pins.locator('.cui-pinned-main').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fontWeight)), [expected, expected], `${strict}/${theme}: source-only pinned conversation names keep the baseline medium weight`);
    }
  }
}

module.exports = { testStreamParagraphGeometry, testWorkspaceReadoutTheme, testPinnedTextWeight };
