const assert = require('node:assert/strict');

async function testWorkspacePreviewIsolation(page, base) {
  const errors = [], onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  try {
    for (const strict of ['off', 'on']) for (const controlled of ['false', 'true']) {
      const context = `${strict}/controlled=${controlled}`;
      await page.goto(`${base}/tests/fixtures/react-workspace/preview-isolation.html?strict=${strict}&controlled=${controlled}`);
      const first = page.getByRole('region', { name: 'First preview workspace', exact: true });
      const second = page.getByRole('region', { name: 'Second preview workspace', exact: true });
      const draft = () => first.getByRole('textbox', { name: 'First draft', exact: true });
      const other = second.getByRole('textbox', { name: 'Second draft', exact: true });
      const article = first.getByRole('article'), retainedArticle = await article.elementHandle();
      const sameArticle = async reason => assert.equal(await article.evaluate((element, previous) => element === previous, retainedArticle), true, `${context}: ${reason}`);
      const select = async file => {
        const button = first.getByRole('button', { name: `File ${file}`, exact: true });
        await button.click();
        assert.equal(await button.getAttribute('aria-pressed'), 'true', `${context}: ${file} is selected`);
        assert.equal(await button.evaluate(element => element === document.activeElement), true, `${context}: selecting a file retains button focus`);
        await sameArticle('changing file retains the article focus region');
      };

      assert.equal(await draft().inputValue(), 'First a', `${context}: first file initializes its own state`);
      assert.equal(await other.inputValue(), 'Second a', `${context}: another workspace initializes independently`);
      await draft().fill('Edited first A');
      const firstInput = await draft().elementHandle();
      await page.getByRole('button', { name: 'Rerender workspaces', exact: true }).evaluate(element => element.click());
      assert.equal(await first.locator('[data-preview-revision]').getAttribute('data-preview-revision'), '1', `${context}: the same preview receives new props`);
      assert.equal(await draft().inputValue(), 'Edited first A', `${context}: a same-file parent render preserves local state`);
      assert.equal(await draft().evaluate((element, previous) => element === previous, firstInput), true, `${context}: a same-file render retains the input DOM`);
      assert.equal(await draft().evaluate(element => element === document.activeElement), true, `${context}: a same-file render retains input focus`);
      await select('A');
      assert.equal(await draft().inputValue(), 'Edited first A', `${context}: selecting the current file does not reset it`);

      await select('B');
      assert.equal(await first.locator('[data-preview-file]').getAttribute('data-preview-file'), 'b');
      assert.equal(await draft().inputValue(), 'First b', `${context}: B does not inherit A's edited state`);
      assert.equal(await draft().evaluate((element, previous) => element === previous, firstInput), false, `${context}: switching file replaces the preview subtree`);
      await draft().fill('Edited first B');
      await other.fill('Edited independent A');
      const otherInput = await other.elementHandle();
      await select('A');
      assert.equal(await draft().inputValue(), 'First a', `${context}: returning to A creates a fresh preview instead of retaining B's state`);
      assert.equal(await other.inputValue(), 'Edited independent A', `${context}: a file change does not reset another workspace`);
      assert.equal(await other.evaluate((element, previous) => element === previous, otherInput), true, `${context}: independent workspace DOM is retained`);

      await draft().fill('Edited before code');
      const beforeCode = await draft().elementHandle();
      await first.getByRole('radio', { name: 'Code', exact: true }).click();
      assert.equal(await first.getByRole('textbox').count(), 0, `${context}: code view replaces the preview`);
      assert.equal(await article.locator('pre').textContent(), 'First a source 1');
      await first.getByRole('radio', { name: 'Preview', exact: true }).click();
      assert.equal(await draft().inputValue(), 'First a', `${context}: returning from code resets preview-local state`);
      assert.equal(await draft().evaluate((element, previous) => element === previous, beforeCode), false, `${context}: view changes create a fresh preview DOM`);
      await sameArticle('changing view retains the article focus region');

      await draft().fill('Retained through Activity');
      const beforeHidden = await draft().elementHandle();
      await page.getByRole('button', { name: 'Hide workspaces', exact: true }).click();
      await first.waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: 'Show workspaces', exact: true }).click();
      await first.waitFor({ state: 'visible' });
      assert.equal(await draft().inputValue(), 'Retained through Activity', `${context}: reconnecting the same file preserves Activity state`);
      assert.equal(await draft().evaluate((element, previous) => element === previous, beforeHidden), true, `${context}: Activity retains the same preview input DOM`);
      assert.equal(await other.inputValue(), 'Edited independent A', `${context}: Activity also preserves the independent workspace`);
      await sameArticle('Activity reconnects the same article focus region');
      assert.deepEqual(errors, [], `${context}: preview replacement and reconnect do not throw`);
    }
  } finally {
    page.removeListener('pageerror', onError);
  }
}

module.exports = { testWorkspacePreviewIsolation };
