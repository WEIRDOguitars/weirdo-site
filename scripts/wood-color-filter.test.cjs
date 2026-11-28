const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const vm = require('node:vm');
const moduleObject = { exports: {} };
const result = buildSync({ entryPoints: ['wood-color-filter.js'], bundle: true, platform: 'node', format: 'cjs', write: false });
vm.runInNewContext(result.outputFiles[0].text, { module: moduleObject, exports: moduleObject.exports });
const { filterWoodPixels } = moduleObject.exports;

test('Classy walnut gets dark grain before red tint without Canvas filter support', () => {
  const pixels = new Uint8ClampedArray([80, 60, 40, 255, 180, 160, 140, 128]);
  filterWoodPixels(pixels, 'contrast(1.8) brightness(.68) saturate(1.2)');
  assert.ok(pixels[0] < 35 && pixels[1] < 10);
  assert.ok(pixels[4] > pixels[0] + 100);
  assert.equal(pixels[3], 255);
  assert.equal(pixels[7], 128);
});
test('identity, brightness, contrast and grayscale preserve alpha', () => {
  const pixel = new Uint8ClampedArray([100, 150, 200, 83]);
  assert.deepEqual(filterWoodPixels(pixel.slice(), 'none'), pixel);
  assert.deepEqual(filterWoodPixels(pixel.slice(), 'brightness(.5)'), new Uint8ClampedArray([50, 75, 100, 83]));
  const gray = filterWoodPixels(pixel.slice(), 'grayscale(1)');
  assert.equal(gray[0], gray[1]);
  assert.equal(gray[1], gray[2]);
  assert.equal(gray[3], 83);
  assert.deepEqual(filterWoodPixels(pixel.slice(), 'contrast(0)'), new Uint8ClampedArray([128, 128, 128, 83]));
});
