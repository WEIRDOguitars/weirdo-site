const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js', 'utf8');
const animation = source.slice(source.indexOf('function animateWheelZoom()'), source.indexOf('function previewPointerDistance()'));

test('wheel zoom settles at slider precision including intermediate targets', () => {
  for (const [current, target] of [[45.6, 45.74], [50, 45.74], [0, 22.36], [100, 58.46], [19.9, 20.04], [50, 0], [0, 100]]) {
    let queued, frames = 0, events = 0;
    const context = {
      zoomSlider: { value: String(current), dispatchEvent() { events++; } },
      wheelZoomTarget: target, wheelZoomFrame: 1,
      Event: class Event {},
      window: { requestAnimationFrame(callback) { queued = callback; return 1; } }
    };
    vm.createContext(context);
    vm.runInContext(animation, context);
    queued = context.animateWheelZoom;
    while (queued && frames++ < 100) {
      const callback = queued;
      queued = null;
      callback();
    }
    assert.ok(frames < 100, `Zoom failed to settle: ${current} -> ${target}`);
    assert.equal(context.wheelZoomTarget, null);
    assert.equal(context.wheelZoomFrame, 0);
    assert.equal(Number(context.zoomSlider.value), Math.round(target * 10) / 10);
    assert.equal(events, frames);
  }
});
