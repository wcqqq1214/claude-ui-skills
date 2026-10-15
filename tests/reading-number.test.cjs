const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

function numberSample() {
  const nodes = {
    '#readingNumberProportional': {textContent: '00:00.00'},
    '#readingNumberValue': {textContent: '00:00.00'},
    '.reading-number-sample': {},
  };
  const intervals = new Map(), events = {};
  let id = 0, intersect, observed;
  const document = {hidden: false, addEventListener(name, fn) {events[name] = fn;}};
  vm.runInNewContext(readFileSync(require.resolve('../showcase/components/reading.js'), 'utf8') + '\nbindReadingNumberSample();', {
    $: selector => nodes[selector], document,
    window: {addEventListener(name, fn) {events[name] = fn;}},
    setInterval(fn) {intervals.set(++id, fn); return id;},
    clearInterval(id) {intervals.delete(id);},
    IntersectionObserver: class {
      constructor(fn) {intersect = fn;}
      observe(node) {observed = node;}
    },
  });
  return {nodes, document, events, intervals,
    get observed() {return observed;},
    visible(value) {intersect([{isIntersecting: value}]);},
    tick() {[...intervals.values()].forEach(fn => fn());},
  };
}

test('one clock supplies identical fixed-format numbers to both columns', () => {
  const s = numberSample();
  assert.equal(s.observed, s.nodes['.reading-number-sample']);
  assert.equal(s.intervals.size, 0);
  s.visible(true); s.visible(true);
  assert.equal(s.intervals.size, 1);
  for (let i = 0; i < 1000; i++) {
    s.tick();
    const a = s.nodes['#readingNumberProportional'].textContent;
    const b = s.nodes['#readingNumberValue'].textContent;
    assert.equal(a, b);
    assert.match(a, /^00:[0-5][0-9]\.[0-9]{2}$/);
  }
});

test('offscreen, background and page exit pause both columns without duplicate timers', () => {
  const s = numberSample(); s.visible(true); s.tick();
  const before = s.nodes['#readingNumberValue'].textContent;
  s.visible(false); s.tick();
  assert.equal(s.intervals.size, 0);
  assert.equal(s.nodes['#readingNumberValue'].textContent, before);
  s.document.hidden = true; s.visible(true);
  assert.equal(s.intervals.size, 0);
  s.document.hidden = false; s.events.visibilitychange();
  assert.equal(s.intervals.size, 1);
  s.events.pagehide(); s.events.visibilitychange();
  assert.equal(s.intervals.size, 0);
  s.events.pageshow(); s.events.pageshow(); s.tick();
  assert.equal(s.intervals.size, 1);
  assert.notEqual(s.nodes['#readingNumberValue'].textContent, before);
  assert.equal(s.nodes['#readingNumberProportional'].textContent, s.nodes['#readingNumberValue'].textContent);
});
