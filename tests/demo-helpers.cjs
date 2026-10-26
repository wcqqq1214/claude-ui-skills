const assert = require('node:assert/strict');
async function setTheme(page, theme) {
  const select = page.locator('.demo-theme-select');
  await select.selectOption(theme);
  assert.equal(await select.inputValue(), theme);
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
module.exports = { setTheme, setLanguage, chooseChapter };
