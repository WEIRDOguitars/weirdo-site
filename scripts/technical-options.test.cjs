const { test } = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../pricing.js');

test('legacy configurations get supported technical defaults', () => {
  const { selections } = pricing.normalize({ bridge: 'Evertune' });
  assert.equal(selections.bridge, 'Tune-o-matic Gotoh');
  assert.equal(selections.handedness, 'Praworęczna');
  assert.equal(selections.tuning, 'E');
  assert.equal(selections.stringGauge, '9-42');
});
test('half-step tunings share their higher tuning string choices', () => {
  for (const [lower, higher] of [['Eb', 'E'], ['Db', 'D'], ['Drop Db', 'Drop D']]) {
    for (const gauge of pricing.tuningGauges[higher]) {
      assert.equal(pricing.normalize({ tuning: lower, stringGauge: gauge }).selections.stringGauge, gauge);
    }
  }
});
test('unsupported combinations are normalized, not carried between tunings', () => {
  assert.equal(pricing.normalize({ tuning: 'E', stringGauge: '12-60' }).selections.stringGauge, '9-42');
  assert.equal(pricing.normalize({ tuning: 'Drop C', stringGauge: '12-60' }).selections.stringGauge, '12-60');
  assert.equal(pricing.normalize({ tuning: 'Drop A', stringGauge: '12-60' }).selections.stringGauge, 'Do ustalenia');
});
test('new technical selections survive JSON round-trip without altering price', () => {
  const source = { handedness: 'Leworęczna', tuning: 'Drop C', stringGauge: '11-56' };
  const first = pricing.normalize(source).selections;
  assert.deepEqual(pricing.normalize(JSON.parse(JSON.stringify(first))).selections, first);
  assert.equal(pricing.calculate(source).totalPrice, pricing.calculate({}).totalPrice);
});
