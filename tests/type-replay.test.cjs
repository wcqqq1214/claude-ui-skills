const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {readFileSync} = require('node:fs');

function reader() {
  let now = 0, nextTimer = 0, chapterChange;
  const timers = new Map(), resizes = [];
  function element() {
    const classes = new Set();
    return {
      children: [], style: {setProperty() {}},
      classList: {toggle(name, enabled) {enabled ? classes.add(name) : classes.delete(name);}},
      setAttribute() {}, addEventListener() {},
      replaceChildren(...children) {this.children = children;},
      append(child) {this.children.push(child);},
    };
  }
  const nodes = Object.fromEntries([
    'type', 'typeScroll', 'typeReading', 'typeEnd', 'typeBottom',
    'typeFade', 'revealTitle', 'revealBody', 'streamParagraphs', 'replayType'
  ].map(id => ['#' + id, element()]));
  nodes['#type'].active = true;
  nodes['#type'].hasAttribute = () => nodes['#type'].active;
  // Even when the introduction overflows (e.g. on a narrow screen), it must
  // remain visible before the first appended paragraph starts following.
  Object.assign(nodes['#typeScroll'], {scrollTop: 0, scrollHeight: 800, clientHeight: 300});
  nodes['#typeBottom'].querySelector = () => ({decode: () => ({then() {}})});
  vm.runInNewContext(readFileSync(require.resolve('../showcase/components/type.js'), 'utf8') + '\ninitTypeDemo();', {
    $: selector => nodes[selector], Intl,
    document: {createElement: element, activeElement: null},
    DemoI18n: {locale: 'en', t: text => text, text(node, render) {node.textContent = render();}, onChange() {}},
    setTimeout(callback, delay) {const id = ++nextTimer; timers.set(id, {at: now + delay, callback}); return id;},
    clearTimeout(id) {timers.delete(id);},
    ResizeObserver: class {constructor(callback) {resizes.push(callback);} observe() {}},
    IntersectionObserver: class {observe() {}},
    MutationObserver: class {constructor(callback) {chapterChange = callback;} observe() {}},
  });
  return {
    nodes,
    replay: () => nodes['#replayType'].onclick(),
    resize: () => resizes.forEach(callback => callback()),
    chapter(active) {nodes['#type'].active = active; chapterChange();},
    advance(ms) {
      const end = now + ms;
      while (true) {
        const entry = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry) break;
        const [id, timer] = entry; now = timer.at; timers.delete(id); timer.callback();
      }
      now = end;
    },
  };
}

test('replay leaves the introduction visible, then appends content progressively', () => {
  const r = reader(), n = r.nodes;
  r.resize();
  assert.equal(n['#streamParagraphs'].children.length, 0);
  assert.equal(n['#typeScroll'].scrollTop, 0);
  r.advance(1200);
  assert.equal(n['#revealBody'].children.length, 6);
  assert.equal(n['#typeScroll'].scrollTop, 0);
  r.advance(600);
  assert.equal(n['#streamParagraphs'].children.length, 1);
  assert.equal(n['#typeScroll'].scrollTop, 500);
  r.advance(3000);
  assert.equal(n['#streamParagraphs'].children.length, 2);
  r.replay(); r.replay(); r.resize();
  assert.equal(n['#revealBody'].children.length, 0);
  assert.equal(n['#streamParagraphs'].children.length, 0);
  assert.equal(n['#typeScroll'].scrollTop, 0);
  r.advance(22800);
  assert.equal(n['#streamParagraphs'].children.length, 8);
});

test('leaving cancels pending playback and returning starts a fresh introduction', () => {
  const r = reader(), n = r.nodes;
  r.advance(1800);
  r.chapter(false);
  r.advance(30000);
  assert.equal(n['#streamParagraphs'].children.length, 1);
  r.chapter(true); r.resize();
  assert.equal(n['#streamParagraphs'].children.length, 0);
  assert.equal(n['#typeScroll'].scrollTop, 0);
  r.advance(1800);
  assert.equal(n['#streamParagraphs'].children.length, 1);
});
