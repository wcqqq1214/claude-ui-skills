// Local CUA browser regression: use actual input, read-only DOM assertions.
import assert from 'node:assert/strict';
export default async function verifyEditing(tab, viewport) {
  const editor = tab.playwright.locator('#promptInput');
  const placeholder = tab.playwright.locator('#composerPlaceholder');
  const send = tab.playwright.locator('.composer-send');
  const logs = [];
  await editor.fill('');
  assert.equal(await placeholder.isVisible(),true);
  assert.equal(await placeholder.evaluate(e => [getComputedStyle(e).position,getComputedStyle(e).pointerEvents,e.getAttribute('aria-hidden')].join('|')),'absolute|none|true');
  await editor.click(); await editor.pressSequentially('Hello');
  assert.equal(await editor.innerText(),'Hello'); assert.equal(await placeholder.isVisible(),false);
  await editor.press('Enter'); await editor.pressSequentially('第二行');
  await editor.press('Shift+Enter'); await editor.pressSequentially('third');
  assert.match(await editor.innerText(),/^Hello\n第二行\nthird$/);
  assert.equal(await send.isEnabled(),false);
  await editor.fill(''); await editor.press('Enter');
  assert.equal(await placeholder.isVisible(),false);
  assert.equal(await editor.evaluate(e=>e.getBoundingClientRect().height),48);
  await editor.pressSequentially('blank first line');
  assert.match(await editor.innerText(),/blank first line$/);
  await editor.fill(''); assert.equal(await placeholder.isVisible(),true);
  logs.push('Background placeholder cannot consume clicks, text, selection or empty-line height; Enter/Shift+Enter edit only; send disabled');
  await editor.fill(Array.from({length:30},(_,i)=>'line '+i).join('\n'));
  assert.ok(await editor.evaluate(e=>e.scrollHeight>e.clientHeight && e.clientHeight<=384));
  const draft=await editor.innerText();
  const modes=new Set();
  for(const width of [1280,390,320]) {
    await viewport.set({width,height:844});
    for(const position of ['Home','End']) {
      await tab.playwright.locator('#composerWidth').press(position);
      modes.add(await tab.playwright.locator('#composerChin').getAttribute('data-picker-mode'));
      assert.equal(await editor.innerText(),draft);
      assert.ok(await tab.playwright.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.ok(await tab.playwright.locator('#composerChin').evaluate(e=>{const [a,b]=[...e.querySelectorAll('button')].map(b=>b.getBoundingClientRect());return a.right<=b.left && a.left>=0 && b.right<=innerWidth;}));
    }
  }
  assert.ok(modes.has('icons') && modes.has('words-and-carets'),JSON.stringify([...modes]));
  await editor.fill('');
  await tab.playwright.locator('#addMockAttachment').click();
  assert.equal(await tab.playwright.locator('.composer-attachment').count(),3);
  assert.equal(await tab.playwright.locator('#addMockAttachment').isEnabled(),false);
  await tab.playwright.locator('.composer-attachment-remove').last().press('Enter');
  await tab.playwright.locator('.composer-attachment[data-sample="2"]').waitFor({state:'detached'});
  assert.equal(await tab.playwright.locator('.composer-attachment').count(),2);
  logs.push('Long text scrolls; 320/390/1280px and minimum width preserve draft, chin and page bounds; attachment addition/removal retained');
  await viewport.reset();
  return {passed:logs};
}
