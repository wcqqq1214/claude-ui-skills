const assert = require('node:assert/strict');
async function setChoice(page, trigger, value) {
  if (await trigger.evaluate(node => node.tagName === 'SELECT')) await trigger.selectOption(value);
  else {
    await trigger.click();
    const id = await trigger.getAttribute('aria-controls');
    await page.locator(`[role=listbox][id="${id}"] [role=option][data-value="${value}"]`).click();
  }
  assert.equal(await trigger.getAttribute('data-value'), value);
}
async function setTheme(page, theme) {
  await setChoice(page, page.locator('.demo-theme-select'), theme);
  await page.waitForFunction(theme => document.documentElement.dataset.cuiTheme === (theme === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : theme), theme);
}
async function setLanguage(page, locale) {
  const trigger = page.locator('.demo-topbar button[aria-haspopup=menu]');
  await trigger.click();
  await page.getByRole('menuitemradio', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
  await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
}
async function chooseChapter(page, id) {
  const link = page.locator(`nav a[href="#${id}"]`);
  if (!await link.isVisible()) await page.locator('.demo-chapter-toggle').click();
  await link.click();
  await page.waitForFunction(id => document.querySelector('nav a[aria-current]')?.getAttribute('href') === '#' + id, id);
}
module.exports = { setChoice, setTheme, setLanguage, chooseChapter };
