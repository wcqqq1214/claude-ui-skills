const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

function setup(animated = false) {
  const events = {}, transitions = [];
  const document = {visibilityState: 'visible', activeElement: null,
    addEventListener: (k, f) => events[k] = f,
    removeEventListener: (k, f) => {if (events[k] === f) delete events[k];}};
  class Node {
    constructor(tag) {this.tag = tag; this.children = []; this.dataset = {}; this.attrs = {}; this.style = {setProperty() {}};}
    get isConnected() {return this === list || !!this.parent?.isConnected;}
    append(...nodes) {for (const n of nodes) {this.children.push(n); n.parent = this;}}
    setAttribute(k, v) {this.attrs[k] = v;}
    querySelector(query) {
      if (query === 'button') return this.children.find(n => n.tag === 'button');
      return this.children.find(n => n.dataset.sample === query.match(/"(\d+)"/)[1]);
    }
    get nextElementSibling() {return this.parent?.children[this.parent.children.indexOf(this) + 1];}
    get previousElementSibling() {return this.parent?.children[this.parent.children.indexOf(this) - 1];}
    contains(node) {return node === this || this.children.some(n => n.contains(node));}
    focus() {document.activeElement = this;}
    remove() {this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null;}
  }
  const list = new Node('div'), add = new Node('button'), input = new Node('textarea');
  document.createElement = tag => new Node(tag);
  if (animated) document.startViewTransition = ({update}) => {
    const t = {update, skipTransition() {this.skipped = true;}, ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve(), finished: Promise.resolve()};
    transitions.push(t); return t;
  };
  const context = vm.createContext({document, CSS: {supports: () => true},
    $: id => ({'#composerAttachments': list, '#addMockAttachment': add, '#promptInput': input}[id]),
    DemoIcons: {create: () => new Node('span')},
    DemoI18n: {attr: (node,k,render) => node.setAttribute(k,render()), t: (text,name) => text.replace('{0}',name)},
    window: {addEventListener: (k,f) => events[k] = f, removeEventListener: k => delete events[k]},
  });
  vm.runInContext(readFileSync(require.resolve('../showcase/components/composer.js'), 'utf8'), context);
  vm.runInContext('initComposerAttachments()', context);
  const key = (tile, name, extra = {}) => tile.onkeydown({key:name, preventDefault(){},stopPropagation(){},...extra});
  return {list, add, input, document, events, transitions, key};
}

test('fixed mock tiles cap at three, restore a removed sample, and return keyboard focus', () => {
  const s = setup();
  for (let i=0;i<4;i++) s.add.onclick();
  assert.equal(s.list.children.length,3); assert.equal(s.add.disabled,true);
  const middle = s.list.children[1], last = s.list.children[2];
  middle.querySelector('button').focus(); s.key(middle,'Delete');
  assert.equal(s.document.activeElement,last.querySelector('button')); assert.equal(s.add.disabled,false);
  s.add.onclick(); assert.equal(s.list.children[2].dataset.sample,'1');
  while (s.list.children.length) {const t=s.list.children[0];t.querySelector('button').focus();s.key(t,'Backspace');}
  assert.equal(s.document.activeElement,s.input);
  let prevented=false; s.events.keydown({key:'Backspace',repeat:true,preventDefault(){prevented=true;},stopPropagation(){}});
  assert.equal(prevented,true); s.events.keyup({key:'Backspace'}); assert.equal(s.events.keydown,undefined);
});

test('pending removals apply once; the last tile skips transition and IME/modifiers do not remove', () => {
  const s=setup(true); s.add.onclick();s.add.onclick();
  const first=s.list.children[0], last=s.list.children[1];
  s.key(first,'Delete',{isComposing:true});s.key(first,'Delete',{ctrlKey:true});
  assert.equal(s.transitions.length,0);
  s.key(first,'Enter');s.key(first,'Enter');assert.equal(s.transitions.length,1);
  s.key(last,'Delete'); assert.equal(s.transitions.length,1);assert.equal(last.isConnected,false);
  assert.equal(s.transitions[0].skipped,true);
  s.transitions[0].update();s.transitions[0].update();assert.equal(s.list.children.length,0);
  s.events.pagehide();assert.equal(s.events.keydown,undefined);
});
