const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require.resolve('../showcase/shell.js'), 'utf8');

// Minimal DOM for the chapter routing in shell.js: one URL hash selects one
// mounted chapter; others stay in the document but inert.
function element(props = {}) {
  const listeners = {};
  const attributes = new Map();
  return {
    listeners,
    inert: false,
    hidden: false,
    dataset: {},
    addEventListener: (name, fn) => (listeners[name] ||= []).push(fn),
    setAttribute: (name, value) => attributes.set(name, String(value)),
    getAttribute: name => attributes.has(name) ? attributes.get(name) : null,
    removeAttribute: name => attributes.delete(name),
    hasAttribute: name => attributes.has(name),
    toggleAttribute(name, force) { if (force) attributes.set(name, ''); else attributes.delete(name); },
    querySelectorAll: () => [],
    classList: {toggle() {}},
    focus() {},
    contains: () => false,
    replaceChildren() {},
    ...props,
  };
}

function boot(href) {
  const ids = ['type', 'controls', 'reading'];
  const chapters = ids.map(id => element({id, closest: () => null}));
  chapters.forEach(chapter => { chapter.closest = selector => selector === '.specimen' ? chapter : null; });
  const links = ids.map(id => element({hash: '#' + id}));
  links.forEach(link => { link.closest = () => link; });
  const sidebar = element({querySelectorAll: () => links});
  const byId = Object.fromEntries(['themeBtn', 'languageBtn', 'languageMenu', 'chapterToggle', 'chapterCurrent']
    .map(id => [id, element()]));
  chapters.forEach(chapter => { byId[chapter.id] = chapter; });
  const documentListeners = {};
  const windowListeners = {};
  const pushes = [];
  const location = {
    get href() { return this.url.href; },
    get hash() { return this.url.hash; },
    set hash(value) { this.url.hash = value; },
    url: new URL(href),
  };
  const history = {
    state: null,
    pushState(_state, _title, url) { pushes.push(url); location.url = new URL(url); },
    replaceState(_state, _title, url) { location.url = new URL(url); },
  };
  const context = {
    URL, Event: class { constructor(type) { this.type = type; } }, PointerEvent: class {},
    location, history, localStorage: {getItem: () => null},
    matchMedia: () => ({matches: false, addEventListener() {}}),
    DemoI18n: {t: value => value, locale: 'en', onChange() {}, clone: () => ({childNodes: []})},
    document: {
      documentElement: {dataset: {}},
      body: {dispatchEvent() {}},
      addEventListener: (name, fn) => (documentListeners[name] ||= []).push(fn),
      getElementById: id => byId[id] || null,
      querySelector: selector => selector === '.sidebar' ? sidebar : null,
      querySelectorAll: () => [],
    },
  };
  context.window = {
    addEventListener: (name, fn) => (windowListeners[name] ||= []).push(fn),
    scrollTo() {},
  };
  vm.runInNewContext(source, context);
  documentListeners.DOMContentLoaded.forEach(fn => fn());
  byId.chapterToggle.focus = () => { context.document.activeElement = byId.chapterToggle; };
  const visible = () => chapters.filter(chapter => chapter.hasAttribute('data-active')).map(chapter => chapter.id);
  const click = index => documentListeners.click.forEach(fn => fn({
    button: 0, defaultPrevented: false, target: links[index], preventDefault() {},
  }));
  const traverse = url => {
    location.url = new URL(url);
    windowListeners.popstate.forEach(fn => fn());
  };
  const reveal = index => documentListeners['demo-reveal'].forEach(fn => fn({target: chapters[index]}));
  return {chapters, links, visible, click, traverse, reveal, pushes, location,
    document: context.document, picker: byId.chapterToggle};
}

test('the URL hash selects one mounted chapter; others stay inert', () => {
  const page = boot('https://example.test/showcase/?lang=en#reading');
  assert.deepEqual(page.visible(), ['reading']);
  assert.deepEqual(page.chapters.map(chapter => chapter.inert), [true, true, false]);
  assert.equal(page.links[2].getAttribute('aria-current'), 'page');
  assert.deepEqual(boot('https://example.test/showcase/').visible(), ['type']);
  assert.deepEqual(boot('https://example.test/showcase/#intro').visible(), ['type']);
});

test('nav clicks push the hash, keep the query, and back/forward restore chapters', () => {
  const page = boot('https://example.test/repo/showcase/?lang=zh-Hans#type');
  page.click(1);
  assert.deepEqual(page.visible(), ['controls']);
  assert.deepEqual(page.pushes, ['https://example.test/repo/showcase/?lang=zh-Hans#controls']);
  page.click(1);
  assert.equal(page.pushes.length, 1, 'reselecting the current chapter adds no history entry');
  page.traverse('https://example.test/repo/showcase/?lang=zh-Hans#type');
  assert.deepEqual(page.visible(), ['type']);
  page.traverse('https://example.test/repo/showcase/?lang=zh-Hans#unknown');
  assert.deepEqual(page.visible(), ['type'], 'an unknown hash keeps the current chapter');
});

test('a reveal request from an example shows its chapter before focus moves', () => {
  const page = boot('https://example.test/showcase/#controls');
  page.reveal(2);
  assert.deepEqual(page.visible(), ['reading']);
  assert.equal(page.location.hash, '#reading');
});


test('back to the unqualified homepage or legacy intro restores the default chapter', () => {
  for (const hash of ['', '#intro']) {
    const home = 'https://example.test/showcase/?lang=en' + hash;
    const page = boot(home);
    page.click(2);
    assert.deepEqual(page.visible(), ['reading']);
    page.traverse(home);
    assert.deepEqual(page.visible(), ['type']);
    assert.equal(page.links[0].getAttribute('aria-current'), 'page');
  }
});

test('selecting a compact chapter restores focus before the nav link disappears', () => {
  const page = boot('https://example.test/showcase/#type');
  page.picker.setAttribute('aria-expanded', 'true');
  page.document.activeElement = page.links[2];
  page.click(2);
  assert.deepEqual(page.visible(), ['reading']);
  assert.equal(page.document.activeElement, page.picker);
  assert.equal(page.picker.getAttribute('aria-expanded'), 'false');
});
