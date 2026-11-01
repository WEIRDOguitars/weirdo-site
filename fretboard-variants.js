import * as THREE from 'three';

export function installFretboardVariants(mainModel, variants, markers = []) {
  mainModel.updateWorldMatrix(true, true);
  const original = mainModel.getObjectByName('podstrunnica');
  if (!original?.isMesh) throw new Error('Missing reference fretboard');
  const target = new THREE.Box3().setFromObject(original);
  const parent = original.parent;
  original.userData.fretboardVariant = 'Standard WEIRDO';
  parent.children.forEach(mesh => {
    const number = /^Body(\d+)$/.exec(mesh.name)?.[1];
    if (mesh.isMesh && (Number(number) === 10 || (Number(number) >= 14 && Number(number) <= 68))) {
      mesh.userData.fretboardVariant = 'Standard WEIRDO';
      if (Number(number) >= 48 && Number(number) <= 56) mesh.userData.defaultFretMarker = true;
    }
  });

  for (const { name, layer } of variants) {
    layer.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(layer);
    const size = bounds.getSize(new THREE.Vector3());
    const targetSize = target.getSize(new THREE.Vector3());
    if (Math.abs(size.y - targetSize.y) > 1 || Math.abs(size.x - targetSize.x) > 1) {
      throw new Error(`Unexpected fretboard dimensions: ${name}`);
    }
    // CAD exports share mm scale but use a different origin. Keep fret spacing unchanged.
    // z=44.8046 is the existing inlay surface, just below the fret feet at z=44.9046.
    const translation = new THREE.Matrix4().makeTranslation(
      (target.min.x + target.max.x - bounds.min.x - bounds.max.x) / 2,
      target.max.y - bounds.max.y,
      44.80460548400879 - bounds.max.z
    );
    const toParent = parent.matrixWorld.clone().invert().multiply(translation);
    const group = new THREE.Group();
    group.name = name;
    layer.traverse(mesh => {
      if (!mesh.isMesh) return;
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      const dotFaces = new Set();
      if (name === 'Binding 4') {
        const source = geometry.getAttribute('position');
        const centerX = (bounds.min.x + bounds.max.x) / 2;
        for (let i = 0; i < source.count; i += 3) {
          // This CAD variant stores the dot floors as uncoloured, recessed faces.
          if (![0, 1, 2].every(j => Math.abs(source.getZ(i + j) + 3) < .001
            && Math.abs(source.getX(i + j) - centerX) < 18)) continue;
          dotFaces.add(i);
          for (let j = 0; j < 3; j++) source.setZ(i + j, bounds.max.z);
        }
      }
      geometry.applyMatrix4(toParent);
      const positions = geometry.getAttribute('position');
      const colors = geometry.getAttribute('color');
      if (!colors) throw new Error(`Missing CAD surface colors: ${name}`);
      const surfaces = { fretboard: [], binding: [], defaultMarker: [] };
      for (let i = 0; i < positions.count; i += 3) {
        // Red faces in the supplied CAD mark resin, not the selected finish color.
        const resin = dotFaces.has(i) || (colors.getX(i) > colors.getY(i) * 3 && colors.getX(i) > colors.getZ(i) * 3);
        const center = new THREE.Vector3();
        for (let j = i; j < i + 3; j++) center.add(new THREE.Vector3().fromBufferAttribute(positions, j));
        center.multiplyScalar(1 / 3).applyMatrix4(parent.matrixWorld);
        const isDefaultMarker = resin && Math.abs(center.x - (target.min.x + target.max.x) / 2) < 18
          && center.y > 2210 && center.y < 2260;
        const output = surfaces[isDefaultMarker ? 'defaultMarker' : resin ? 'binding' : 'fretboard'];
        for (let j = i; j < i + 3; j++) output.push(positions.getX(j), positions.getY(j), positions.getZ(j));
      }
      for (const [role, points] of Object.entries(surfaces)) {
        if (!points.length && role === 'defaultMarker') continue;
        if (!points.length) throw new Error(`Missing ${role} surface: ${name}`);
        const partGeometry = new THREE.BufferGeometry();
        partGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        partGeometry.computeVertexNormals();
        const part = new THREE.Mesh(partGeometry, new THREE.MeshBasicMaterial());
        part.name = `${name}-${role}`;
        part.userData.forceRole = role === 'defaultMarker' ? 'markers' : role;
        part.userData.defaultFretMarker = role === 'defaultMarker';
        part.userData.fretboardVariant = name;
        group.add(part);
      }
      geometry.dispose();
    });
    // Install before seating the neck, so every variant follows the same rigid transform.
    parent.add(group);
  }

  for (const { name, layer } of markers) {
    layer.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(layer);
    const toParent = parent.matrixWorld.clone().invert().multiply(new THREE.Matrix4().makeTranslation(
      (target.min.x + target.max.x - bounds.min.x - bounds.max.x) / 2,
      target.max.y - bounds.max.y,
      44.82460548400879
    ));
    const points = [];
    layer.traverse(mesh => {
      if (!mesh.isMesh) return;
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      const position = geometry.getAttribute('position');
      for (let i = 0; i < position.count; i += 3) {
        const triangle = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(position, i + j));
        // Marker 1 is recessed 3 mm; the other exports have a raised 3 mm face.
        if (!triangle.every(v => Math.abs(v.z - (name === 'Marker 1' ? -3 : 3)) < .001)) continue;
        for (const v of triangle) {
          v.z = 0;
          v.applyMatrix4(toParent);
          points.push(v.x, v.y, v.z);
        }
      }
      geometry.dispose();
    });
    if (!points.length) throw new Error(`Missing marker face: ${name}`);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.computeVertexNormals();
    const marker = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    marker.name = name;
    marker.userData.forceRole = 'markers';
    marker.userData.fretMarker = name;
    parent.add(marker);
  }
}
