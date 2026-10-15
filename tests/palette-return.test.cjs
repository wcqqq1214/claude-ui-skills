const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require.resolve('../showcase/components/menus.js'), 'utf8');

function fixture() {
  const frames = new Map(), listeners = new Map(), page = new Map();
  let id = 0, exitChapter;
  const document = { activeElement: null, addEventListener: (name, fn) => listeners.set(name, fn) };
  function element() {
    const attrs = new Map(), styles = new Map(), events = new Map(), classes = new Set();
    return {
      attrs, styles, events, hidden: false,
      setAttribute: (name, value) => attrs.set(name, value),
      removeAttribute: name => attrs.delete(name),
      hasAttribute: name => attrs.has(name),
      style: {setProperty: (name, value) => styles.set(name, value), removeProperty: name => styles.delete(name)},
      classList: {add: name => classes.add(name), remove: name => classes.delete(name)},
      addEventListener: (name, fn) => events.set(name, fn),
      focus() { document.activeElement = this; }
    };
  }
  const host = element(), trigger = element(), thumb = element(), card = element(), chapter = element(), area = element();
  const picture = {complete: true, naturalWidth: 280};
  const actions = ['Open', 'Copy link', 'Pin'].map(name => Object.assign(element(), {dataset: {paletteAction: name}}));
  host.contains = node => [trigger, card, ...actions].includes(node);
  thumb.querySelector = () => picture;
  thumb.getBoundingClientRect = () => ({left: 200, top: 80, width: 280});
  card.getBoundingClientRect = () => ({left: 100, top: 80, width: 280});
  card.querySelectorAll = () => actions;
  card.querySelector = () => area;
  card.hidden = true;
  chapter.setAttribute('data-active', '');
  const nodes = {'#artifactActionsDemo':host, '#paletteOpen':trigger, '#paletteThumb':thumb, '#paletteCard':card, '#menus':chapter};
  const context = vm.createContext({
    $: name => nodes[name], document,
    requestAnimationFrame: fn => {frames.set(++id, fn); return id;},
    cancelAnimationFrame: key => frames.delete(key),
    window: {addEventListener: (name, fn) => page.set(name, fn)},
    MutationObserver: class { constructor(fn) {exitChapter = fn;} observe() {} }
  });
  vm.runInContext(source, context);
  context.bindArtifactActions();
  trigger.focus();
  const tick = () => {for (const [key, fn] of [...frames]) {frames.delete(key); fn();}};
  const escape = () => card.onkeydown({key: 'Escape', preventDefault() {}, stopPropagation() {}});
  return {trigger, thumb, card, picture, actions, frames, document, listeners, page, chapter, tick, escape, exit: () => exitChapter()};
}

test('closing returns from the card position and only its own animation end clears the state', () => {
  const f = fixture();
  f.trigger.onclick(); f.tick(); f.tick();
  assert.equal(f.document.activeElement, f.actions[0]);
  f.escape();
  assert.equal(f.card.hidden, true);
  assert.equal(f.document.activeElement, f.trigger);
  assert.equal(f.thumb.styles.get('--cp-thumb-from-x'), '-100px');
  const end = f.thumb.events.get('animationend');
  end({target: {}, animationName: 'palette-thumb-return'});
  assert.equal(f.thumb.hasAttribute('data-returning'), true);
  end({target: f.thumb, animationName: 'palette-thumb-return'});
  assert.equal(f.thumb.hasAttribute('data-returning'), false);
  assert.equal(f.thumb.styles.size, 0);
});

test('rapid close cancels pending focus; reopening cancels return; chapter exit clears both', () => {
  const f = fixture();
  f.trigger.onclick(); f.tick(); f.escape();
  assert.equal(f.frames.size, 0);
  f.trigger.onclick();
  assert.equal(f.thumb.hasAttribute('data-returning'), false);
  f.chapter.removeAttribute('data-active'); f.exit();
  assert.equal(f.card.hidden, true);
  assert.equal(f.frames.size, 0);
  assert.equal(f.thumb.hasAttribute('data-returning'), false);
});

test('failed thumbnails skip playback and page exit cancels a running return', () => {
  const f = fixture();
  f.picture.naturalWidth = 0;
  f.trigger.onclick(); f.escape();
  assert.equal(f.thumb.hasAttribute('data-returning'), false);
  f.picture.naturalWidth = 280;
  f.trigger.onclick(); f.escape();
  assert.equal(f.thumb.hasAttribute('data-returning'), true);
  f.page.get('pagehide')();
  assert.equal(f.thumb.hasAttribute('data-returning'), false);
  assert.equal(f.thumb.styles.size, 0);
});

test('dismissal from the trigger cancels pending focus before or after the menu receives focus', () => {
  for (const key of ['Escape', 'ArrowLeft', 'Enter']) {
    for (const focused of [false, true]) {
      const f = fixture();
      f.trigger.onclick();
      f.tick();
      if (focused) { f.tick(); f.trigger.focus(); }
      f.trigger.onkeydown({key, altKey: key === 'Enter', preventDefault() {}, stopPropagation() {}});
      f.tick(); f.tick();
      assert.equal(f.card.hidden, true, key);
      assert.equal(f.document.activeElement, f.trigger);
      assert.equal(f.frames.size, 0);
    }
  }
});
