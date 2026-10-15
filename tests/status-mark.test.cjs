const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

async function harness() {
  const timers = new Map(), entries = [], animations = [];
  let timerId = 0;
  const strip = {style: {}, animate(_frames, timing) {
    let resolve, reject;
    const animation = {
      currentTime: 0, timing,
      finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
      cancel() { reject(new Error('cancelled')); },
      end() { this.currentTime = timing.duration; resolve(); },
    };
    animations.push(animation);
    return animation;
  }};
  const host = {dataset: {}, querySelector: () => strip};
  const context = vm.createContext({
    URL, document: {baseURI: 'http://demo/showcase/'},
    Image: class {decode() {return Promise.resolve();}},
    setTimeout: (fn, delay) => {const id = ++timerId; timers.set(id, {fn, delay}); return id;},
    clearTimeout: id => timers.delete(id),
    host, onEnter: value => entries.push(value),
  });
  vm.runInContext(readFileSync(require.resolve('../showcase/components/feedback.js'), 'utf8'), context);
  const mark = vm.runInContext('createStatusMark(host, onEnter)', context);
  const flush = async () => {for (let i = 0; i < 10; i++) await Promise.resolve();};
  const current = () => animations.at(-1);
  const end = async () => {current().end(); await flush();};
  const start = async activity => {mark.start(activity); await flush(); await end(); await end();};
  const select = async activity => {mark.select(activity); await flush();};
  const fire = async () => {
    assert.equal(timers.size, 1);
    const [id, timer] = [...timers][0]; timers.delete(id); timer.fn(); await flush();
  };
  return {mark, host, timers, entries, current, end, start, select, fire, flush};
}

test('seam handoff preserves the current mark until exit, then updates copy on entry', async () => {
  const h = await harness(); await h.start('think'); h.current().currentTime = 1000;
  await h.select('code');
  assert.equal(h.host.dataset.phase, 'think-loop');
  assert.equal([...h.timers.values()][0].delay, 54 * 33.3333 - 1000);
  assert.deepEqual(h.entries, ['think']);
  await h.fire(); assert.equal(h.host.dataset.phase, 'think-out');
  assert.equal(h.current().timing.duration, 15 * 33.3333);
  await h.end(); assert.equal(h.host.dataset.phase, 'code-in');
  assert.deepEqual(h.entries, ['think', 'code']);
  await h.end(); assert.equal(h.host.dataset.phase, 'code-loop');
  assert.equal(h.current().timing.easing, 'steps(75, jump-none)');
});

test('seams strictly require more than 50ms; no seam waits for the loop end', async () => {
  for (const [activity, time, expected] of [
    ['think', 1749, 54 * 33.3333 - 1749], ['think', 1750, null],
    ['code', 1000, 37 * 33.3333 - 1000], ['code', 1900, null],
    ['read', 1000, null], ['write', 1000, null],
  ]) {
    const h = await harness(); await h.start(activity); h.current().currentTime = time;
    await h.select(activity === 'read' ? 'write' : 'read');
    assert.equal(h.timers.size, expected === null ? 0 : 1, activity);
    if (expected !== null) assert.equal([...h.timers.values()][0].delay, expected);
    else {await h.end(); assert.equal(h.host.dataset.phase, activity + '-out');}
  }
});

test('entry finishes before its loop, and only the latest selection enters after exit', async () => {
  const h = await harness(); h.mark.start('code'); await h.flush(); await h.end();
  await h.select('read'); assert.equal(h.host.dataset.phase, 'code-in');
  await h.end(); assert.equal(h.host.dataset.phase, 'code-loop');
  await h.fire(); assert.equal(h.host.dataset.phase, 'code-out');
  await h.select('write'); await h.select('think');
  await h.end(); assert.equal(h.host.dataset.phase, 'think-in');
  assert.deepEqual(h.entries, ['code', 'think']);
});

test('returning to the current mark cancels its pending seam without replaying', async () => {
  const h = await harness(); await h.start('code'); const animation = h.current();
  await h.select('read'); assert.equal(h.timers.size, 1);
  await h.select('code'); assert.equal(h.timers.size, 0);
  await h.select('code'); assert.equal(h.current(), animation);
  await h.end(); assert.equal(h.host.dataset.phase, 'code-loop');
  assert.deepEqual(h.entries, ['code']);
});

test('finish clears handoff timers; replay ignores stale completions', async () => {
  const h = await harness(); await h.start('think'); await h.select('code');
  let completed = 0; h.mark.finish(() => completed++); assert.equal(h.timers.size, 0);
  await h.end(); assert.equal(h.host.dataset.phase, 'think-out');
  await h.end(); assert.equal(h.host.dataset.phase, 'done'); assert.equal(completed, 1);
  h.mark.start('code'); await h.flush(); assert.equal(h.host.dataset.phase, 'grow');
  const old = h.current(); h.mark.start('write'); await h.flush(); old.end(); await h.flush();
  assert.equal(h.host.dataset.phase, 'grow'); await h.end();
  assert.equal(h.host.dataset.phase, 'write-in'); assert.equal(completed, 1);
});

test('a new selection during exit cancels local completion and enters the latest target', async () => {
  const h = await harness(); await h.start('read'); let completed = false;
  h.mark.finish(() => {completed = true;}); await h.end();
  assert.equal(h.host.dataset.phase, 'read-out'); await h.select('write'); await h.end();
  assert.equal(h.host.dataset.phase, 'write-in'); assert.equal(completed, false);
});
