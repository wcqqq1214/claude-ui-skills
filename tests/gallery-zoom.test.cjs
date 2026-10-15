const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextScale } = require('../showcase/gallery-zoom.js');

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
