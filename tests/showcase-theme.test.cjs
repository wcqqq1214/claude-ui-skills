const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require.resolve('../showcase/shell.js'), 'utf8');

function boot(saved, denied = false) {
  const media = {matches: true, addEventListener(_event, listener) {this.change = listener;}};
  const root = {dataset: {}};
  vm.runInNewContext(source, {
    document: {documentElement: root, addEventListener() {}},
    matchMedia: () => media,
    localStorage: {getItem() {if (denied) throw new Error('Storage denied'); return saved;}},
  });
  return {root, media};
}

test('saved light/dark theme applies before DOMContentLoaded and ignores system changes', () => {
  for (const mode of ['light', 'dark']) {
    const {root, media} = boot(mode);
    assert.equal(root.dataset.theme, mode);
    media.matches = false; media.change();
    assert.equal(root.dataset.theme, mode);
  }
});

test('first visit, invalid preferences and denied storage all follow the system', () => {
  for (const [saved, denied] of [[null, false], ['invalid', false], ['light', true]]) {
    const {root, media} = boot(saved, denied);
    assert.equal(root.dataset.theme, 'dark');
    media.matches = false; media.change();
    assert.equal(root.dataset.theme, 'light');
  }
});
