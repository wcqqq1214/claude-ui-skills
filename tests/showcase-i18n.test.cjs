const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

const source = readFileSync(require.resolve('../showcase/i18n.js'), 'utf8');
function load({language = 'en-US', saved, url = 'file:///demo/index.html#controls', blocked = false, nodes = []} = {}) {
  const writes = [];
  const navigation = [];
  const context = vm.createContext({
    URL,
    navigator: {languages: [language], language},
    document: {documentElement: {style: {}}, querySelectorAll: () => nodes},
    history: {state: null, replaceState: (_state, _title, value) => navigation.push(value)},
    requestAnimationFrame: callback => callback(),
    location: {href: url, assign: () => assert.fail('Language selection must not navigate')},
    localStorage: {
      getItem() {if (blocked) throw new Error('Storage denied'); return saved;},
      setItem(key, value) {if (blocked) throw new Error('Storage denied'); writes.push([key, value]);},
    },
  });
  vm.runInContext(source, context);
  return {i18n: vm.runInContext('DemoI18n', context), context, writes, navigation};
}

test('explicit language, remembered choice and browser fallback resolve predictably', () => {
  assert.equal(load({language: 'zh-TW'}).i18n.locale, 'zh-Hans');
  assert.equal(load({language: 'fr-FR'}).i18n.locale, 'en');
  assert.equal(load({language: 'zh-CN', saved: 'en'}).i18n.locale, 'en');
  assert.equal(load({saved: 'en', url: 'https://example.test/?lang=zh-Hans'}).i18n.locale, 'zh-Hans');
  const invalid = load({language: 'zh-CN', saved: 'invalid', url: 'https://example.test/?lang=invalid'});
  assert.equal(invalid.context.document.documentElement.lang, 'zh-Hans');
});

test('language selection updates the URL without navigation even when storage is denied', () => {
  const {i18n, navigation} = load({blocked: true, url: 'file:///demo/index.html?preview=1#controls'});
  i18n.select('zh-Hans');
  assert.equal(navigation[0], 'file:///demo/index.html?preview=1&lang=zh-Hans#controls');
  i18n.select('unsupported');
  assert.equal(navigation.length, 1);
});

test('explicitly choosing the current language remembers it without reloading', () => {
  const {i18n, writes, navigation} = load();
  i18n.select('en');
  assert.deepEqual(writes, [['claude-ui-studies.language', 'en']]);
  assert.deepEqual(navigation, []);
});

test('translation interpolates values once and leaves unknown copy intact', () => {
  const {i18n} = load();
  assert.equal(i18n.t('Theme: {0}; switch to {1}', i18n.t('System'), i18n.t('Light')), 'Theme: System; switch to Light');
  assert.equal(i18n.t('Selected “{0}”. Keep typing to continue.', '<tag>{1}$&'), 'Selected “<tag>{1}$&”. Keep typing to continue.');
  assert.equal(i18n.t('Uncatalogued text'), 'Uncatalogued text');
  i18n.select('zh-Hans');
  assert.equal(i18n.t('Theme: {0}; switch to {1}', i18n.t('System'), i18n.t('Light')), '主题：跟随系统；点击切换浅色');
  assert.equal(i18n.t('Selected “{0}”. Keep typing to continue.', '<tag>{1}$&'), '已选择“<tag>{1}$&”，可以继续输入。');
  assert.equal(i18n.t('Uncatalogued text'), 'Uncatalogued text');
  // Chunk boundaries and their English spaces must survive a round trip.
  assert.equal(i18n.t('Space makes content '), '留白让内容');
  i18n.select('en');
  assert.equal(i18n.t('Space makes content '), 'Space makes content ');
});


test('live copy updates preserve user values and connected node identity', () => {
  const output = {isConnected: true, textContent: ''};
  const draft = {isConnected: true, value: '我的草稿 <tag> {0}', scrollTop: 0, scrollLeft: 0};
  const {i18n} = load({nodes: [draft]});
  let label = 'High';
  i18n.text(output, () => i18n.t(label));
  assert.equal(output.textContent, 'High');
  i18n.select('zh-Hans');
  assert.equal(output.textContent, '深入');
  assert.equal(draft.value, '我的草稿 <tag> {0}');
  label = 'Max';
  i18n.select('en');
  assert.equal(output.textContent, 'Max');
});

test('a new message replaces its old binding and detached messages stop updating', () => {
  const output = {isConnected: true, textContent: ''};
  const {i18n} = load();
  i18n.text(output, () => i18n.t('Retry'));
  i18n.text(output, () => i18n.t('Retrying…'));
  i18n.select('zh-Hans');
  assert.equal(output.textContent, '重试中…');
  output.isConnected = false;
  i18n.select('en');
  assert.equal(output.textContent, '重试中…');
});

test('changing language restores scroll offsets and preserves unrelated history state', () => {
  const scroller = {scrollLeft: 40, scrollTop: 320, scrollTo({left, top, behavior}) {
    assert.equal(behavior, 'instant'); this.scrollLeft = left; this.scrollTop = top;
  }};
  const {i18n, context} = load({nodes: [scroller]});
  context.history.state = {marker: 'retained'};
  i18n.onChange(() => { scroller.scrollTop = 100; });
  i18n.select('zh-Hans');
  assert.equal(scroller.scrollTop, 320);
  assert.equal(scroller.scrollLeft, 40);
  assert.equal(context.history.state.marker, 'retained');
});
