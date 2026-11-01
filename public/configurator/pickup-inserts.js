import * as THREE from 'three';

export function installPickupInserts(model, designs, roleOf) {
  model.updateWorldMatrix(true, true);
  const frames = [];
  model.traverse(mesh => {
    if (mesh.isMesh && roleOf(mesh) === 'pickupFrame') frames.push(mesh);
  });
  if (frames.length !== 2) throw new Error('Expected two reference pickup frames');

  for (const { name, layer } of designs) {
    layer.updateWorldMatrix(true, true);
    const sourceFrame = [];
    const plates = [];
    layer.traverse(mesh => {
      if (!mesh.isMesh) return;
      (mesh.name.toLowerCase().includes('ramka') ? sourceFrame : plates).push(mesh);
    });
    if (sourceFrame.length !== 1 || !plates.length) throw new Error('Invalid pickup insert assembly');
    const reference = new THREE.Box3().setFromObject(sourceFrame[0]);
    for (const frame of frames) {
      const target = new THREE.Box3().setFromObject(frame);
      const referenceSize = reference.getSize(new THREE.Vector3());
      const targetSize = target.getSize(new THREE.Vector3());
      if (Math.abs(referenceSize.x - targetSize.x) > .1 || Math.abs(referenceSize.y - targetSize.y) > .1) {
        throw new Error('Pickup insert frame dimensions do not match');
      }
      const delta = target.getCenter(new THREE.Vector3()).sub(reference.getCenter(new THREE.Vector3()));
      delta.z = target.max.z - reference.max.z;
      const transform = frame.parent.matrixWorld.clone().invert()
        .multiply(new THREE.Matrix4().makeTranslation(delta.x, delta.y, delta.z));
      for (const plate of plates) {
        const geometry = plate.geometry.index ? plate.geometry.toNonIndexed() : plate.geometry.clone();
        geometry.applyMatrix4(plate.matrixWorld);
        geometry.applyMatrix4(transform);
        const colors = geometry.getAttribute('color');
        const positions = geometry.getAttribute('position');
        if (!colors) throw new Error('Pickup insert is missing CAD face colors');
        const surfaces = { pigment: [], metal: [] };
        for (let i = 0; i < positions.count; i += 3) {
          const blue = colors.getZ(i) > colors.getX(i) * 1.5 && colors.getZ(i) > colors.getY(i) * 1.5;
          const output = surfaces[blue ? 'pigment' : 'metal'];
          for (let j = i; j < i + 3; j++) output.push(positions.getX(j), positions.getY(j), positions.getZ(j));
        }
        if (!surfaces.pigment.length) throw new Error('Pickup insert has no blue pigment faces');
        for (const [surface, vertices] of Object.entries(surfaces)) {
          if (!vertices.length) continue;
          const result = new THREE.BufferGeometry();
          result.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          result.computeVertexNormals();
          const mesh = new THREE.Mesh(result, new THREE.MeshStandardMaterial());
          mesh.name = 'WeirdoInsert-' + surface;
          mesh.userData.forceRole = 'pickupCenter';
          mesh.userData.pickupDesign = name;
          mesh.userData.pickupPigment = surface === 'pigment';
          frame.parent.add(mesh);
        }
        geometry.dispose();
      }
    }
  }
}
