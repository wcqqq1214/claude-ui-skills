// Run from cua_repl with a localhost tab on #composer and its viewport capability.
// All interaction uses the documented CUA browser API; evaluation is read-only DOM inspection.
import assert from 'node:assert/strict';
export default async function verifyMentions(tab, viewport) {
  const editor = tab.playwright.getByRole('textbox');
  const popup = tab.playwright.locator('#composerMentionList');
  const mentions = tab.playwright.locator('#promptInput .composer-mention');
  const option = tab.playwright.locator('#composerMentionOption');
  const title = await option.locator('.composer-mention-title').innerText();
  const focused = () => tab.playwright.evaluate(() => document.activeElement.id);
  const logs = [];
  for (const key of ['Enter','Tab']) {
    await editor.fill('@');
    assert.equal(await popup.isVisible(),true);
    await editor.press('ArrowDown'); await editor.press('ArrowUp'); await editor.press(key);
    assert.equal(await mentions.count(),1); assert.equal(await focused(),'promptInput');
    assert.equal(await popup.isVisible(),false);
    await editor.press('Backspace'); assert.equal(await mentions.count(),1);
    await editor.press('Backspace'); assert.equal(await mentions.count(),0);
    await editor.press('ControlOrMeta+z'); assert.equal(await mentions.count(),1);
  }
  logs.push('Enter/Tab, one-row clamped arrows, atomic backspace and undo');
  await editor.fill('@'); await editor.press('Escape');
  assert.equal(await popup.isVisible(),false); assert.equal(await editor.innerText(),'@');
  await editor.fill('@' + title[0]); await editor.press('Escape');
  await editor.pressSequentially(title[1]); assert.equal(await popup.isVisible(),false);
  await editor.press('Backspace'); await editor.press('Backspace');
  assert.equal(await popup.isVisible(),true);
  await editor.fill('@zzzznomatch'); assert.equal(await popup.isVisible(),false);
  await editor.fill('@'); await option.click();
  await editor.pressSequentially(' review'); assert.match(await editor.innerText(),/review$/);
  assert.equal(await mentions.count(),1);
  await editor.pressSequentially(' @'); await editor.press('Enter');
  assert.equal(await mentions.count(),2);
  await mentions.first().click({button:'right'});
  assert.equal(await focused(),'composerMentionMenu');
  await tab.playwright.locator('#composerMentionMenu').press('ArrowDown');
  await tab.playwright.getByRole('menuitem').press('Enter');
  assert.equal(await mentions.count(),1); assert.equal(await focused(),'promptInput');
  assert.match(await editor.innerText(),/review/);
  logs.push('Escape, no-match, mouse selection, repeated references, context Delete and focus');
  await editor.fill('first line'); await editor.press('Enter');
  await editor.pressSequentially('@'); await editor.press('Enter');
  assert.equal(await mentions.count(),1); assert.match(await editor.innerText(),/^first line/);
  await editor.pressSequentially(' tail');
  const draft = await editor.innerText();
  for (const width of [390,320,1280]) {
    await viewport.set({width,height:844});
    const slider = tab.playwright.locator('#composerWidth');
    await slider.press('Home'); await slider.press('End');
    assert.equal(await editor.innerText(),draft);
    await editor.press('End'); await editor.pressSequentially(' @');
    assert.equal(await popup.isVisible(),true);
    const box = await popup.evaluate(e => { const r=e.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight}; });
    assert.ok(box.left>=15 && box.right<=box.width-15 && box.top>=15 && box.bottom<=box.height-15,JSON.stringify(box));
    await editor.press('Escape'); await editor.press('Backspace'); await editor.press('Backspace');
    assert.equal(await editor.innerText(),draft);
    assert.ok(await tab.playwright.evaluate(() => document.documentElement.scrollWidth<=innerWidth));
  }
  logs.push('Multiline editing and 390/320/1280px popup containment, width-control draft retention');
  await editor.fill('@');
  await tab.playwright.getByRole('link',{name:'02 基础控件'}).click();
  assert.equal(await popup.isVisible(),false);
  await tab.playwright.getByRole('link',{name:'03 输入框与附件'}).click();
  assert.equal(await editor.innerText(),'@');
  await editor.fill('');
  logs.push('Chapter exit closes popup; returning preserves draft; empty reset');
  return {title,passed:logs};
};
