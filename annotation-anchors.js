import * as THREE from "three";

// Coordinates are fractions of each active part's bounds in the instrument's
// pivot frame. A ray hit, not the box itself, supplies the final surface anchor.
const definitions = [
  { id: "head", role: "head", x: .5, y: .55, side: "right" },
  { id: "nut", role: "nut", x: .5, y: .5, side: "right", individual: true },
  { id: "fretboard", role: "fretboard", x: .5, y: .55, side: "left" },
  { id: "top", role: "top", x: .22, y: .35, side: "right" },
  { id: "sides", role: "sides", x: .14, y: .38, side: "left" },
  { id: "electronics", role: "knobs", x: .5, y: .5, side: "right", individual: true },
  { id: "bridge", role: "hardware", tag: "bridge", x: .5, y: .5, side: "left", individual: true },
  { id: "tuners", role: "tuners", x: .5, y: .5, side: "left", individual: true, both: true },
  { id: "pickups", role: "pickupCenter", x: .5, y: .5, side: "right", individual: true },
  { id: "binding-color", role: "binding", tag: "body-binding", x: .1, y: .4, side: "left", individual: true },
  { id: "binding-type", role: "binding", tag: "fret-binding", x: .1, y: .7, side: "right", individual: true },
  { id: "jack", role: "hardware", tag: "jack", x: .5, y: .5, side: "left", individual: true, back: true },
  { id: "body", role: "body", x: .6, y: .4, side: "right", back: true }
];

export function projectAnnotations({ meshes, pivot, camera, degrees = 0 }) {
  pivot.updateWorldMatrix(true, true);
  camera.updateWorldMatrix(true, false);
  const inverse = pivot.matrixWorld.clone().invert();
  const visible = meshes.filter(mesh => {
    if (mesh.userData.glossCoat) return false;
    for (let parent = mesh; parent; parent = parent.parent) if (!parent.visible) return false;
    return true;
  });
  const ray = new THREE.Raycaster();
  const anchors = [];
  for (const definition of definitions) {
    // Head options affect the front veneer, not the back or the neck sides.
    if (definition.id === "head" && Math.cos(THREE.MathUtils.degToRad(degrees)) < Math.cos(THREE.MathUtils.degToRad(35))) continue;
    let parts = visible.filter(mesh => mesh.userData.role === definition.role && (!definition.tag || mesh.userData.annotationPart === definition.tag));
    if (!parts.length) continue;
    const bounds = new THREE.Box3();
    const referenceParts = definition.role === "body" ? visible.filter(mesh => mesh.userData.role === "sides") : parts;
    for (const part of referenceParts.length ? referenceParts : parts) {
      if (!part.geometry.boundingBox) part.geometry.computeBoundingBox();
      const matrix = inverse.clone().multiply(part.matrixWorld);
      bounds.union(part.geometry.boundingBox.clone().applyMatrix4(matrix));
    }
    const point = new THREE.Vector3(
      THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, definition.x),
      THREE.MathUtils.lerp(bounds.min.y, bounds.max.y, definition.y),
      definition.back ? bounds.min.z : bounds.max.z
    ).applyMatrix4(pivot.matrixWorld).project(camera);
    if (Math.abs(point.z) > 1) continue;
    // At close range, try the visible portion of a part rather than its
    // offscreen center. The ray still has to hit that part's actual surface.
    point.x = THREE.MathUtils.clamp(point.x, -.8, .8);
    point.y = THREE.MathUtils.clamp(point.y, -.8, .8);
    ray.setFromCamera(new THREE.Vector2(point.x, point.y), camera);
    let hit = ray.intersectObjects(parts, false)[0];
    // A single CAD mesh can contain several disconnected knobs. Find a real
    // face when the aggregate box center falls into the space between them.
    if (!hit && definition.individual) {
      for (const part of parts) {
        const positions = part.geometry.attributes.position;
        const index = part.geometry.index;
        const count = index ? index.count : positions.count;
        for (let i = 0; i + 2 < count && !hit; i += 3) {
          const center = new THREE.Vector3();
          for (let corner = 0; corner < 3; corner++) {
            center.add(new THREE.Vector3().fromBufferAttribute(positions, index ? index.getX(i + corner) : i + corner));
          }
          center.divideScalar(3).applyMatrix4(part.matrixWorld).project(camera);
          if (Math.abs(center.x) > .96 || Math.abs(center.y) > .96) continue;
          ray.setFromCamera(new THREE.Vector2(center.x, center.y), camera);
          hit = ray.intersectObjects(parts, false)[0];
        }
        if (hit) break;
      }
    }
    if (!hit) continue;
    // Only opaque structural parts can occlude an anchor; decorative skins are
    // coincident with the intended surface and excluded from this check.
    const blockers = visible.filter(mesh => mesh.userData.role !== definition.role
      && !mesh.userData.surfaceSkin && ["body", "top", "sides", "head", "fretboard"].includes(mesh.userData.role));
    const obstruction = ray.intersectObjects(blockers, false)[0];
    if (obstruction && obstruction.distance < hit.distance - .5) continue;
    const projected = hit.point.clone().project(camera);
    const side = pivot.scale.x < 0 ? (definition.side === "left" ? "right" : "left") : definition.side;
    const anchor = { id: definition.id, side, x: (projected.x + 1) / 2, y: (1 - projected.y) / 2 };
    let surfaceSamples;
    anchor.nearest = (labelX, labelY, width, height) => {
      // Sample real faces once per settled view, not during animation. Search
      // all pieces of the role, so the closest knob/pickup can be selected.
      if (!surfaceSamples) {
        surfaceSamples = [];
        for (const part of parts) {
          const positions = part.geometry.attributes.position, index = part.geometry.index;
          const count = index ? index.count : positions.count;
          const stride = Math.max(1, Math.ceil(count / 3 / 384)) * 3;
          for (let i = 0; i + 2 < count; i += stride) {
            const vertices = [];
            for (let k = 0; k < 3; k++) {
              const p = new THREE.Vector3().fromBufferAttribute(positions, index ? index.getX(i + k) : i + k)
                .applyMatrix4(part.matrixWorld).project(camera);
              vertices.push(new THREE.Vector3((p.x + 1) * width / 2, (1 - p.y) * height / 2, 0));
            }
            surfaceSamples.push(new THREE.Triangle(...vertices));
          }
        }
      }
      const target = new THREE.Vector3(labelX, labelY, 0);
      const candidates = surfaceSamples.map(triangle => {
        const p = triangle.closestPointToPoint(target, new THREE.Vector3());
        // Move just inside the face so edge precision cannot miss a thin strip.
        p.lerp(triangle.getMidpoint(new THREE.Vector3()), .015);
        return { p, distance: p.distanceToSquared(target) };
      }).filter(({ p }) => p.x >= 8 && p.x <= width - 8 && p.y >= 8 && p.y <= height - 8)
        .sort((a, b) => a.distance - b.distance);
      for (const { p } of candidates.slice(0, 24)) {
        ray.setFromCamera(new THREE.Vector2(p.x / width * 2 - 1, 1 - p.y / height * 2), camera);
        const surface = ray.intersectObjects(parts, false)[0];
        if (!surface) continue;
        const cover = ray.intersectObjects(blockers, false)[0];
        if (cover && cover.distance < surface.distance - .5) continue;
        return { x: p.x, y: p.y };
      }
      return { x: anchor.x * width, y: anchor.y * height };
    };
    anchors.push(anchor);
  }
  // Protect projected details even when their own callout has no room.
  const protectedRoles = new Set(["head", "fretboard", "nut", "knobs", "hardware", "tuners", "tunerButtons", "pickupCenter", "pickupFrame", "pickupMagnets", "metalLogo"]);
  anchors.protectedAreas = [];
  for (const mesh of visible) {
    if (!protectedRoles.has(mesh.userData.role)) continue;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    const points = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const point = new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld).project(camera);
      points.push({ x: (point.x + 1) / 2, y: (1 - point.y) / 2 });
    }
    anchors.protectedAreas.push({ left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)), top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) });
  }
  return anchors;
}
