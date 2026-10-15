const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

function setup() {
  const pending = [], timers = new Map(), events = {};
  let clock = 0, nextTimer = 0, language = 'en';
  const bindings = new Map();
  const button = {isConnected: true, replaceChildren(icon) {this.icon = icon;}};
  const status = {};
  const sample = '  .reading { color: inherit; }\n';
  const nodes = {'#readingCodeCopy': button, '#readingCodeStatus': status, '#readingCodeContent': {textContent: sample}};
  const context = vm.createContext({
    $: id => nodes[id],
    navigator: {clipboard: {writeText(text) {return new Promise((resolve, reject) => pending.push({text, resolve, reject}));}}},
    DemoIcons: {create: name => name},
    DemoI18n: {
      t: text => language === 'zh' ? ({Copied: '已复制', 'Copy failed': '复制未成功'}[text] ?? text) : text,
      text(node, render) {bindings.set(node, render); node.textContent = render();},
    },
    window: {addEventListener: (name, callback) => events[name] = callback},
    setTimeout(callback, delay) {timers.set(++nextTimer, {callback, at: clock + delay}); return nextTimer;},
    clearTimeout: id => timers.delete(id),
  });
  vm.runInContext(readFileSync(require.resolve('../showcase/components/reading.js'), 'utf8'), context);
  vm.runInContext('bindReadingCodeCopy()', context);
  return {
    button, status, sample, pending, timers, events,
    advance(ms) {clock += ms; for (const [id, t] of timers) if (t.at <= clock) {timers.delete(id); t.callback();}},
    translate() {language = 'zh'; for (const [node, render] of bindings) node.textContent = render();},
  };
}

test('copy preserves whitespace; success resets after the latest 2-second interval and translates live', async () => {
  const s = setup();
  const first = s.button.onclick();
  assert.equal(s.pending[0].text, s.sample);
  assert.equal(s.button.icon, undefined);
  s.pending[0].resolve(); await first;
  assert.equal(s.button.icon, 'Check');
  assert.equal(s.status.textContent, 'Copied');
  s.advance(1500);
  const repeat = s.button.onclick(); s.pending[1].resolve(); await repeat;
  s.translate(); assert.equal(s.status.textContent, '已复制');
  s.advance(500); assert.equal(s.button.icon, 'Check');
  s.advance(1499); assert.equal(s.button.icon, 'Check');
  s.advance(1); assert.equal(s.button.icon, 'Copy');
  assert.equal(s.status.textContent, '');
});

test('late completions cannot override the latest failure or survive page exit', async () => {
  const s = setup();
  const old = s.button.onclick(), current = s.button.onclick();
  s.pending[1].reject(new Error('Denied')); await current;
  s.pending[0].resolve(); await old;
  assert.equal(s.button.icon, 'Copy');
  assert.equal(s.status.textContent, 'Copy failed');
  assert.equal(s.timers.size, 0);
  const next = s.button.onclick(); s.events.pagehide(); s.pending[2].resolve(); await next;
  assert.equal(s.button.icon, 'Copy');
  assert.equal(s.status.textContent, '');
  const restored = s.button.onclick(); s.pending[3].resolve(); await restored;
  assert.equal(s.button.icon, 'Check');
  s.events.pagehide(); assert.equal(s.timers.size, 0);
  assert.equal(s.button.icon, 'Copy');
});
