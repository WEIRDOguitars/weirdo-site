const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync('preview-annotations.js', 'utf8');
const helpers = source.slice(source.indexOf('  function segmentsIntersect'), source.indexOf('  function hide()'));
const layout = source.slice(source.indexOf('    const occupied = []'), source.indexOf('\n  }\n  stage.addEventListener'));

function runLayout(width, height, mirrored = false) {
  const data = [
    { id: 'pickups', x: .5, y: .76, side: 'right' },
    { id: 'electronics', x: .56, y: .87, side: 'right' },
    { id: 'top', x: .5, y: .88, side: 'right' },
    { id: 'sides', x: .4, y: .87, side: 'left' }
  ];
  if (mirrored) for (const anchor of data) {
    anchor.x = 1 - anchor.x;
    anchor.side = anchor.side === 'left' ? 'right' : 'left';
  }
  const buttons = Object.fromEntries(data.map(anchor => [anchor.id, {
    offsetWidth: anchor.id === 'top' ? 40 : 85, offsetHeight: 28, style: {}
  }]));
  const context = { width, height, data, buttons,
    svg: { setAttribute() {}, append() {} },
    document: { createElementNS: () => ({ setAttribute() {} }) }
  };
  vm.runInNewContext(helpers + layout, context);
  return buttons;
}

test('Top retains space among crowded body callouts on desktop and mobile', () => {
  for (const [width, height] of [[562, 366], [390, 470]]) {
    for (const mirrored of [false, true]) {
      const buttons = runLayout(width, height, mirrored);
      assert.equal(buttons.top.hidden, false);
      assert.ok(Number.parseFloat(buttons.top.style.top) >= 44);
    }
  }
});

test('descriptions start enabled on both mobile and desktop', () => {
  for (const matches of [true, false]) {
    const toggle = {};
    vm.runInNewContext(source.match(/  toggle\.checked = [^;]+;/)[0], { toggle, mobile: { matches } });
    assert.equal(toggle.checked, true);
  }
});
