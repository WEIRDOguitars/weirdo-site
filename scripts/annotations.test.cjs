const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const THREE = require('three');
const vm = require('node:vm');
const output = buildSync({ entryPoints: ['annotation-anchors.js'], bundle: true, platform: 'node', format: 'cjs', external: ['three'], write: false });
const moduleObject = { exports: {} };
vm.runInNewContext(output.outputFiles[0].text, { module: moduleObject, exports: moduleObject.exports, require });
const { projectAnnotations } = moduleObject.exports;

function fixture() {
  const pivot = new THREE.Group();
  const meshes = [];
  function box(role, x, y, z, width = 1) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 1, .2), new THREE.MeshBasicMaterial());
    mesh.position.set(x, y, z);
    mesh.userData.role = role;
    pivot.add(mesh);
    meshes.push(mesh);
    return mesh;
  }
  box('head', 0, 3, 0);
  box('fretboard', 0, 1.5, 0);
  box('top', 0, -1, .2);
  box('sides', -1.5, -1, 0);
  box('knobs', 1.5, -1, .3);
  box('body', 0, -1, -1, 5);
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 100);
  camera.position.z = 10;
  camera.lookAt(0, 0, 0);
  return { pivot, meshes, camera, degrees: 0, zoom: 0 };
}

test('front anchors project onto actual active geometry', () => {
  const state = fixture();
  const anchors = projectAnnotations(state);
  assert.equal(anchors.length, 5);
  for (const anchor of anchors) assert.ok(anchor.x > 0 && anchor.x < 1 && anchor.y > 0 && anchor.y < 1);
});
test('oblique views and zoom retain visible geometry anchors', () => {
  for (const degrees of [40, 55, 75, 110, 140, 220, 300, 320]) {
    const state = fixture();
    state.pivot.rotation.y = THREE.MathUtils.degToRad(degrees);
    assert.ok(projectAnnotations(state).length > 0, `No anchors at ${degrees} degrees`);
  }
  assert.equal(projectAnnotations({ ...fixture(), zoom: 100 }).length, 5);
});
test('rear view exposes body and hides the covered top', () => {
  const state = fixture();
  state.pivot.rotation.y = Math.PI;
  state.degrees = 180;
  const ids = Array.from(projectAnnotations(state), a => a.id);
  assert.ok(ids.includes('body'));
  assert.ok(!ids.includes('top'));
});
test('hidden and offscreen geometry cannot receive anchors', () => {
  const state = fixture();
  state.meshes[0].visible = false;
  state.meshes[1].position.y = 100;
  const ids = Array.from(projectAnnotations(state), a => a.id);
  assert.ok(!ids.includes('head'));
  assert.ok(!ids.includes('fretboard'));
  state.pivot.visible = false;
  assert.equal(projectAnnotations(state).length, 0);
});
test('head finish link is limited to the front while other links remain available', () => {
  for (const degrees of [0, 20, 340, 360]) {
    assert.ok(projectAnnotations({ ...fixture(), degrees }).some(a => a.id === 'head'));
  }
  for (const degrees of [54, 90, 180, 270, 306]) {
    const anchors = projectAnnotations({ ...fixture(), degrees });
    assert.ok(!anchors.some(a => a.id === 'head'));
    assert.ok(anchors.some(a => a.id === 'top'));
  }
});
test('opaque geometry blocks a covered detail', () => {
  const state = fixture();
  state.meshes.find(m => m.userData.role === 'body').position.z = 1;
  assert.ok(!projectAnnotations(state).some(a => a.id === 'top'));
});
test('left-handed anchors and protected detail areas follow the reflected geometry', () => {
  const right = projectAnnotations(fixture());
  const state = fixture();
  state.pivot.scale.x = -1;
  const left = projectAnnotations(state);
  const r = right.find(a => a.id === 'electronics');
  const l = left.find(a => a.id === 'electronics');
  assert.ok(Math.abs(l.x - (1 - r.x)) < 1e-6);
  assert.notEqual(l.side, r.side);
  assert.ok(left.protectedAreas.some(box => l.x >= box.left && l.x <= box.right && l.y >= box.top && l.y <= box.bottom));
});
test('surface anchor moves to the edge nearest the label', () => {
  const anchor = projectAnnotations(fixture()).find(a => a.id === 'head');
  const width = 800, height = 800, y = anchor.y * height;
  const left = anchor.nearest(0, y, width, height);
  const right = anchor.nearest(width, y, width, height);
  assert.ok(left.x < anchor.x * width);
  assert.ok(right.x > anchor.x * width);
  assert.ok(Math.abs(left.y - y) < 2);
  assert.ok(Math.abs(right.y - y) < 2);
});
