const { test: nodeTest } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sources = [['legacy', { current: require('../showcase/gallery-zoom.js') }], ['React', { current: null }]];
nodeTest.before(async () => {
  const { transformWithOxc } = await import('vite');
  const source = readFileSync(require.resolve('../src/components/media/galleryZoom.ts'), 'utf8').replace(/^export /gm, '');
  const { code } = await transformWithOxc(source, 'galleryZoom.ts');
  sources[1][1].current = vm.runInNewContext(code + '; ({ nextScale, clickZoom, scaleAt, bound, clamp })');
});
for (const [implementation, source] of sources) {
const test = (name, run) => nodeTest(`${implementation}: ${name}`, run);
const nextScale = (...args) => source.current.nextScale(...args);
const Zoom = { clickZoom: (...args) => source.current.clickZoom(...args), scaleAt: (...args) => source.current.scaleAt(...args) };

test('small pixel input starts zoom and subsequent events accumulate', () => {
  let scale = nextScale(1, 2, -1, 0);
  assert.equal(scale, 1.25);
  for (let i = 0; i < 19; i++) scale = nextScale(scale, 2, -1, 0);
  assert.ok(scale > 1.5 && scale < 1.6);
  assert.equal(nextScale(scale, 2, -1000, 0), 2);
});

test('reset threshold applies only while shrinking', () => {
  assert.equal(nextScale(1, 2, 1, 0), 1);
  assert.equal(nextScale(1, 2, 0, 0), 1);
  assert.equal(nextScale(1.06, 2, 1, 0), 1);
  assert.ok(nextScale(1.02, 2, -1, 0) > 1.02);
});

test('line and page zoom deltas both use 16 pixel units', () => {
  const pixels = nextScale(1.25, 4, -16, 0);
  assert.equal(nextScale(1.25, 4, -1, 1), pixels);
  assert.equal(nextScale(1.25, 4, -1, 2), pixels);
});

test('initial floor never exceeds the image maximum', () => {
  assert.equal(nextScale(1, 1.1, -1, 0), 1.1);
});

const fit = {fitWidth:450,fitHeight:300,fitCenterX:300,fitCenterY:400,viewportWidth:600,viewportHeight:800,maxScale:1200/450};

test('pointer zoom targets the click and limits its initial offset to image overflow', () => {
  const click = Zoom.clickZoom(fit,{clientX:100,clientY:300});
  assert.equal(click.tx,300);assert.equal(click.ty,0);
  assert.equal(click.idealTx,300);assert.equal(click.maxTx,480);
  const keyboard = Zoom.clickZoom(fit,null);
  assert.equal(keyboard.tx,0);assert.equal(keyboard.ty,0);
});

test('wheel zoom retains ideal position when expanding bounds, then clamps it when shrinking', () => {
  const first = Zoom.scaleAt(fit,null,1.25,{clientX:0,clientY:400});
  assert.ok(Math.abs(first.tx-33.94736842105262)<1e-10);
  assert.equal(first.idealTx,75);
  const second = Zoom.scaleAt(fit,first,2,{clientX:300,clientY:400});
  assert.equal(second.tx,120);
  const shrunk = Zoom.scaleAt(fit,second,1.1,{clientX:600,clientY:400});
  assert.equal(shrunk.idealTx,shrunk.tx);
  assert.ok(Math.abs(shrunk.tx)<=shrunk.maxTx);
});

}
