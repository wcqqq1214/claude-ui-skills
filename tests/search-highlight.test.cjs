const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require.resolve('../showcase/components/menus.js'), 'utf8');

function fixture({ moving = false } = {}) {
  let now = 0,
    id = 0;
  const frames = new Map(),
    timers = new Map(),
    inputs = new Map(),
    endings = new Map();
  const classes = () => ({
    values: new Set(),
    add(c) {
      this.values.add(c);
    },
    remove(c) {
      this.values.delete(c);
    }
  });
  const scrolls = [];
  const root = {
    parentElement: null,
    scrollHeight: 1000,
    clientHeight: 200,
    scrollTop: 0,
    scrollTo(options) {
      scrolls.push(options);
    }
  };
  const title = {
    parentElement: root,
    isConnected: true,
    classList: classes(),
    getClientRects: () => [{}],
    getBoundingClientRect: () => ({ top: moving ? 500 : 90, bottom: moving ? 520 : 110 }),
    addEventListener: (name, fn) => endings.set(name, fn),
    removeEventListener: (name) => endings.delete(name)
  };
  const row = { classList: classes() };
  const context = vm.createContext({
    document: { scrollingElement: root, body: {} },
    innerHeight: 200,
    getComputedStyle: () => ({ overflowY: 'auto', position: 'static' }),
    performance: { now: () => now },
    requestAnimationFrame: (fn) => {
      frames.set(++id, fn);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout: (fn, delay) => {
      timers.set(++id, { fn, at: now + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    window: {
      addEventListener: (name, fn) => inputs.set(name, fn),
      removeEventListener: (name) => inputs.delete(name)
    }
  });
  vm.runInContext(source, context);
  const start = () => context.highlightSearchTarget(row, title);
  function tick(time) {
    now = time;
    for (const [id, timer] of [...timers])
      if (timer.at <= now) {
        timers.delete(id);
        timer.fn();
      }
    for (const [id, fn] of [...frames]) {
      frames.delete(id);
      fn();
    }
  }
  const settle = () => [0, 80, 160, 249, 250].forEach(tick);
  const active = () => title.classList.values.has('feature-anchor-highlight');
  return { start, tick, settle, active, title, row, inputs, endings, frames, timers, scrolls };
}

test('waits for the scroll settling minimum, then removes both layers on underline completion', () => {
  const f = fixture();
  f.start();
  [0, 80, 160, 249].forEach(f.tick);
  assert.equal(f.active(), false);
  f.tick(250);
  assert.equal(f.active(), true);
  f.endings.get('animationend')({ target: f.title, animationName: 'feature-anchor-row-fill-wash' });
  assert.equal(f.active(), true);
  f.endings.get('animationend')({
    target: f.title,
    animationName: 'feature-anchor-highlight-underline'
  });
  assert.equal(f.active(), false);
  assert.equal(f.row.classList.values.size + f.inputs.size + f.timers.size, 0);
});

test('new selection cancellation prevents old frames and timers from clearing the replacement', () => {
  const f = fixture();
  const cancel = f.start();
  f.settle();
  cancel();
  const nextCancel = f.start();
  [251, 330, 410, 499, 500].forEach(f.tick);
  cancel();
  assert.equal(f.active(), true);
  f.tick(2300); // Old run's fallback would have fired here.
  assert.equal(f.active(), true);
  f.tick(2550);
  assert.equal(f.active(), false);
  nextCancel();
  assert.equal(f.inputs.size + f.endings.size + f.frames.size + f.timers.size, 0);
});

test('user input suppresses extra centering without cancelling the highlight', () => {
  const f = fixture({ moving: true });
  f.start();
  f.tick(0);
  f.inputs.get('wheel')();
  [80, 160, 249, 250].forEach(f.tick);
  assert.equal(f.active(), true);
  assert.deepEqual(
    f.scrolls.map((x) => x.behavior),
    ['smooth']
  );
  const untouched = fixture({ moving: true });
  untouched.start();
  untouched.settle();
  assert.deepEqual(
    untouched.scrolls.map((x) => x.behavior),
    ['smooth', 'instant']
  );
});
