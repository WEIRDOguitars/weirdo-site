import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";

const container = document.querySelector("#guitarViewer3d");
const form = document.querySelector("#configForm");
const frameSlider = document.querySelector("#frameSlider");
const zoomSlider = document.querySelector("#zoomSlider");
container.dataset.viewerStatus = "module-started";

const assetBase = window.location.protocol === "file:" ? "." : window.location.pathname.includes("/configurator") ? "." : ".";
const modelPath = `${assetBase}/models/Calosc.fbx`;
const layerModelPaths = {
  top: `${assetBase}/elementy/model 3d/top.3mf`,
  sides: `${assetBase}/elementy/model 3d/boki-only.3mf`,
  binding: `${assetBase}/elementy/model 3d/bindig korpus.3mf`,
  metalLogo: `${assetBase}/elementy/model 3d/logo metal.3mf`
};

const electronicsGeometryVariants = {
  default: {
    top: layerModelPaths.top,
    sides: layerModelPaths.sides
  },
  onePickup: {
    top: `${assetBase}/elementy/model 3d/Modyfikacje/1 pickup/top 1 pickup.3mf`,
    sides: `${assetBase}/elementy/model 3d/Modyfikacje/1 pickup/Boki 1 pickup.3mf`
  }
};

const metalLogoImagePath = `${assetBase}/assets/logo-weirdo.png`;

const texturePaths = {
  mapleBirdseye: `${assetBase}/tekstury/runtime/maple-birdseye.png`,
  mapleFlame: `${assetBase}/tekstury/runtime/maple-flame.png`,
  poplarBurl: `${assetBase}/tekstury/runtime/poplar-burl.png`,
  topMahogany: `${assetBase}/tekstury/runtime/mahogany-top.png`,
  topWalnut: `${assetBase}/tekstury/runtime/walnut.png`,
  bodyMahogany: `${assetBase}/tekstury/runtime/body-mahogany.png`,
  bodyAsh: `${assetBase}/tekstury/runtime/body-ash.png`,
  paintCreamWhite: `${assetBase}/tekstury/runtime/paint-cream-white.png`,
  paintPearlWhite: `${assetBase}/tekstury/runtime/paint-pearl-white.png`,
  paintMetallicBlack: `${assetBase}/tekstury/runtime/paint-metallic-black.png`,
  paintCandyAppleRed: `${assetBase}/tekstury/runtime/paint-candy-apple-red.png`
};

const metalFinishes = {
  Chrom: { color: "#dce4e6", metalness: .62, roughness: .18, clearcoat: .65, clearcoatRoughness: .1, emissive: "#1f2527", emissiveIntensity: .18 },
  Nikiel: { color: "#c4bdad", metalness: .58, roughness: .24, clearcoat: .45, clearcoatRoughness: .16, emissive: "#201d18", emissiveIntensity: .12 },
  Czarny: { color: "#121212", metalness: .5, roughness: .32, clearcoat: .38, clearcoatRoughness: .18, emissive: "#050505", emissiveIntensity: .16 },
  Złoty: { color: "#e4b34a", metalness: .58, roughness: .2, clearcoat: .55, clearcoatRoughness: .12, emissive: "#2a1a04", emissiveIntensity: .16 },
  Czarne: { color: "#101010", metalness: .35, roughness: .36, clearcoat: .28, clearcoatRoughness: .22, emissive: "#050505", emissiveIntensity: .12 }
};

const solidColors = {
  "Olejowosk": "#6f3d2b",
  "Lakier bezbarwny mat": "#7a4934",
  "Czarny mat": "#030303",
  "Czarny metalik": "#101216",
  "Heban": "#090807",
  "Palisander": "#4d2f27",
  "Amarant": "#5a2547",
  "Kość": "#e5d7ba",
  "Mosiądz": "#b78a32",
  "TUSQ": "#ede8db",
  "Róg czarny": "#050505"
};

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 5000);
camera.position.set(0, 18, 160);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
container.appendChild(renderer.domElement);
container.dataset.viewerStatus = "renderer-ready";

const pivot = new THREE.Group();
scene.add(pivot);

scene.add(new THREE.HemisphereLight(0xfff0d7, 0x1c1712, 2.15));

const keyLight = new THREE.DirectionalLight(0xffecd0, 3.4);
keyLight.position.set(-115, 95, 115);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xe8edff, 1.85);
fillLight.position.set(115, 32, 135);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffb36d, 2.4);
rimLight.position.set(55, 65, -125);
scene.add(rimLight);

const hardwareLight = new THREE.PointLight(0xffffff, 2.2, 260, 1.4);
hardwareLight.position.set(55, -20, 95);
scene.add(hardwareLight);

const textureLoader = new THREE.TextureLoader();
const textures = {};
const texturePromises = [];
const tintedTextureCache = new Map();
const meshes = [];
let model = null;
let baseYaw = 0;
let fittedHeight = 100;
let fixedViewHeight = null;
let zoomFocusPoint = new THREE.Vector3(0, 0, 0);

globalThis.weirdoViewer3d = {
  meshes,
  roles() {
    return meshes.map(mesh => ({
      name: mesh.name || "",
      parent: mesh.parent?.name || "",
      material: Array.isArray(mesh.material) ? mesh.material.map(item => item?.name || "").join(", ") : mesh.material?.name || "",
      map: Array.isArray(mesh.material) ? mesh.material.map(item => item?.map?.image?.currentSrc || item?.map?.image?.src || "").filter(Boolean).join(", ") : mesh.material?.map?.image?.currentSrc || mesh.material?.map?.image?.src || "",
      sourceMaterial: mesh.userData.sourceMaterial || "",
      role: mesh.userData.role || "",
      forceRole: mesh.userData.forceRole || "",
      visible: mesh.visible,
      triangleCount: Math.round((mesh.geometry?.attributes?.position?.count || 0) / 3),
      center: meshWorldCenter(mesh).toArray().map(value => Math.round(value * 100) / 100)
    }));
  },
  rerender: applyMaterials
};

function updateViewerDebug(reason = "render") {
  container.dataset.viewerReason = reason;
  container.dataset.fittedHeight = String(Math.round(fittedHeight * 1000) / 1000);
  container.dataset.fixedViewHeight = String(Math.round((fixedViewHeight || 0) * 1000) / 1000);
  container.dataset.cameraZoom = String(Math.round(camera.zoom * 1000) / 1000);
}

function fieldValue(name) {
  const checked = form.querySelector(`[name="${name}"]:checked`);
  return checked ? checked.value : form.elements[name]?.value || "";
}

function hiddenValue(id) {
  return document.querySelector(`#${id}`)?.value || "";
}

function normalizedLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function acceptsWoodTint(area) {
  return area === "top" || area === "sides" || area === "head";
}

function activeElectronicsVariant() {
  const layout = normalizedLabel(fieldValue("electronicsLayout"));
  if (layout.includes("1 pickup")) return "onePickup";
  return "default";
}

function loadTextureLegacy(key, path) {
  const texture = textureLoader.load(
    encodeURI(path),
    loadedTexture => loadedTexture.needsUpdate = true,
    undefined,
    error => console.warn("Nie udaĹ‚o siÄ™ wczytaÄ‡ tekstury 3D:", path, error)
  );
  texturePromises.push(new Promise(resolve => {
    textureLoader.load(encodeURI(path), () => resolve(), undefined, () => resolve());
  }));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.1, 2.6);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  textures[key] = texture;
}

function loadTexture(key, path) {
  let texture;
  const promise = new Promise(resolve => {
    texture = textureLoader.load(
      encodeURI(path),
      loadedTexture => {
        loadedTexture.needsUpdate = true;
        resolve();
      },
      undefined,
      error => {
        console.warn("Nie udalo sie wczytac tekstury 3D:", path, error);
        resolve();
      }
    );
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.1, 2.6);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  textures[key] = texture;
  texturePromises.push(promise);
}

Object.entries(texturePaths).forEach(([key, path]) => loadTexture(key, path));

function waitForStableFrames(count = 3) {
  return new Promise(resolve => {
    const step = () => {
      count -= 1;
      if (count <= 0) resolve();
      else window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  });
}

function selectedTexture(wood, color) {
  if (wood === "Klon falisty") return color === "natural" ? textures.mapleNatural : textures.mapleEnhanced;
  if (wood === "Topola czeczot") return textures.poplarBurl;
  if (wood === "Mahoń") return textures.mahogany;
  if (wood === "Orzech amerykański") return textures.americanWalnut;
  return textures.europeanWalnut;
}

function textureMap(key, repeatX = 1, repeatY = 1, rotation = 0) {
  const source = textures[key];
  if (!source) return null;
  const texture = source.clone();
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.center.set(.5, .5);
  texture.rotation = rotation;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return texture;
}

function tintedTextureMap(key, color, area = "top", finish = "Mat", repeatX = 1, repeatY = 1, rotation = 0) {
  const source = textures[key];
  const image = source?.image;
  if (!image) return textureMap(key, repeatX, repeatY, rotation);

  const cacheKey = `${key}|${color}|${area}|${finish}|${repeatX}|${repeatY}|${rotation}`;
  if (tintedTextureCache.has(cacheKey)) return tintedTextureCache.get(cacheKey).clone();

  const canvas = document.createElement("canvas");
  const width = image.naturalWidth || image.width || 1024;
  const height = image.naturalHeight || image.height || 1024;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const isMaple = key === "mapleFlame";
  const isPoplar = key === "poplarBurl";
  const vivid = isMaple || isPoplar;
  const baseColors = {
    mapleFlame: "#c79242",
    poplarBurl: "#b88745",
    topMahogany: "#7a351d",
    topWalnut: "#5a3828",
    bodyMahogany: "#6d3825",
    bodyAsh: "#d1b170"
  };

  context.fillStyle = color === "natural" ? "#d2aa6a" : baseColors[key] || "#8a6040";
  context.fillRect(0, 0, width, height);
  context.filter = color === "natural"
    ? isMaple ? "contrast(1.04) brightness(1) saturate(1.02)" : isPoplar ? "contrast(1.18) brightness(.98) saturate(1.06)" : "contrast(1.12) brightness(.9) saturate(1.04)"
    : isMaple ? "contrast(1.14) brightness(.9) saturate(1.05)" : isPoplar ? "contrast(2.3) brightness(.62) saturate(1.45)" : "contrast(1.8) brightness(.68) saturate(1.2)";
  context.drawImage(image, 0, 0, width, height);
  context.filter = "none";

  forceOpaqueCanvas(context, width, height);

  if (color !== "natural") {
    const tintableWoodArea = acceptsWoodTint(area);
    const burstApplied = vivid && tintableWoodArea && paintBurstTint(context, width, height, color);
    if (burstApplied) {
      // Burst handles its own depth and color blend.
    } else {
      if (vivid && tintableWoodArea) {
        context.globalCompositeOperation = "multiply";
        context.globalAlpha = isMaple ? .12 : .22;
        context.fillStyle = "#050505";
        context.fillRect(0, 0, width, height);
      }
      context.globalCompositeOperation = "color";
      context.globalAlpha = vivid ? .96 : .88;
      context.fillStyle = color;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "multiply";
      context.globalAlpha = isMaple ? .28 : vivid ? .5 : .34;
      context.fillRect(0, 0, width, height);
    }
  }
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;

  if (finish === "Gloss") {
    paintGlossIntoTexture(context, width, height, area);
  }

  forceOpaqueCanvas(context, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.format = THREE.RGBAFormat;
  texture.premultiplyAlpha = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2);
  texture.center.set(.5, .5);
  texture.rotation = rotation;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  tintedTextureCache.set(cacheKey, texture);
  return texture.clone();
}

function burstDefinition(color) {
  return {
    "burst:evil-green": { edge: "#06150b", mid: "#14502d", center: "#84bf58" },
    "burst:devil-red": { edge: "#150202", mid: "#9b1512", center: "#e07922" },
    "burst:purple-rain": { edge: "#12051d", mid: "#63307f", center: "#1b66b0" },
    "burst:sunshine": { edge: "#71310a", mid: "#db7e21", center: "#f0c83a" },
    "burst:foggy": { edge: "#070707", mid: "#54595e", center: "#beb7a8" }
  }[color] || null;
}

function burstCenter(width, height) {
  return { x: width * .54, y: height * .5 };
}

function paintBurstTint(context, width, height, color) {
  const burst = burstDefinition(color);
  if (!burst) return false;
  const center = burstCenter(width, height);

  context.save();
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = .34;
  context.fillStyle = "#050505";
  context.fillRect(0, 0, width, height);

  const radial = context.createRadialGradient(center.x, center.y, width * .08, center.x, center.y, width * .62);
  radial.addColorStop(0, burst.center);
  radial.addColorStop(.48, burst.mid);
  radial.addColorStop(1, burst.edge);
  context.globalCompositeOperation = "color";
  context.globalAlpha = .98;
  context.fillStyle = radial;
  context.fillRect(0, 0, width, height);

  const edgeShade = context.createRadialGradient(center.x, center.y, width * .28, center.x, center.y, width * .68);
  edgeShade.addColorStop(0, "rgba(255,255,255,0)");
  edgeShade.addColorStop(.58, "rgba(0,0,0,.1)");
  edgeShade.addColorStop(1, "rgba(0,0,0,.72)");
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = .72;
  context.fillStyle = edgeShade;
  context.fillRect(0, 0, width, height);

  const centerLift = context.createRadialGradient(center.x, height * .46, 0, center.x, height * .46, width * .42);
  centerLift.addColorStop(0, "rgba(255,238,180,.3)");
  centerLift.addColorStop(.62, "rgba(255,255,255,.04)");
  centerLift.addColorStop(1, "rgba(255,255,255,0)");
  context.globalCompositeOperation = "screen";
  context.globalAlpha = .42;
  context.fillStyle = centerLift;
  context.fillRect(0, 0, width, height);

  context.restore();
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  return true;
}

function paintGlossIntoTexture(context, width, height, area) {
  const side = area === "sides";
  context.save();
  context.globalCompositeOperation = "screen";

  const broad = context.createLinearGradient(0, height * .16, width, height * .78);
  broad.addColorStop(0, "rgba(255,255,255,0)");
  broad.addColorStop(.36, "rgba(255,244,218,0)");
  broad.addColorStop(.48, `rgba(255,248,226,${side ? .18 : .28})`);
  broad.addColorStop(.58, `rgba(255,248,226,${side ? .1 : .16})`);
  broad.addColorStop(.76, "rgba(255,255,255,0)");
  context.fillStyle = broad;
  context.fillRect(0, 0, width, height);

  const narrow = context.createLinearGradient(width * .18, 0, width * .72, height);
  narrow.addColorStop(0, "rgba(255,255,255,0)");
  narrow.addColorStop(.53, "rgba(255,255,255,0)");
  narrow.addColorStop(.57, `rgba(255,255,255,${side ? .2 : .34})`);
  narrow.addColorStop(.61, "rgba(255,255,255,0)");
  context.fillStyle = narrow;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "soft-light";
  const depth = context.createLinearGradient(0, 0, 0, height);
  depth.addColorStop(0, "rgba(255,255,255,.12)");
  depth.addColorStop(.42, "rgba(255,255,255,0)");
  depth.addColorStop(.72, "rgba(0,0,0,.18)");
  depth.addColorStop(1, "rgba(255,255,255,.1)");
  context.fillStyle = depth;
  context.fillRect(0, 0, width, height);

  context.restore();
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
}

function forceOpaqueCanvas(context, width, height) {
  const imageData = context.getImageData(0, 0, width, height);
  for (let index = 3; index < imageData.data.length; index += 4) {
    imageData.data[index] = 255;
  }
  context.putImageData(imageData, 0, 0);
}

function selectedTopTexture(wood, color, area = "top", finish = "Mat") {
  const label = normalizedLabel(wood);

  if (label.includes("jednolity")) return null;
  if (label.includes("klon")) return tintedTextureMap("mapleFlame", color, area, finish, 1, 1);
  if (label.includes("topola")) return tintedTextureMap("poplarBurl", color, area, finish, 1, 1);
  if (label.includes("mahon")) return tintedTextureMap("topMahogany", color, area, finish, 1, 1);
  if (label.includes("orzech")) return tintedTextureMap("topWalnut", color, area, finish, 1, 1);
  return tintedTextureMap("topWalnut", color, area, finish, 1, 1);
}

function selectedBodyTexture() {
  const label = normalizedLabel(fieldValue("bodyWood"));
  if (label.includes("jesion")) return textureMap("bodyAsh", .74, 2.85);
  return textureMap("bodyMahogany", .74, 2.85);
}

function applyPlanarWoodUv(mesh, referenceBox = null) {
  const position = mesh.geometry.attributes.position;
  if (!position) return;

  const box = referenceBox;
  if (!box) mesh.geometry.computeBoundingBox();
  const localBox = mesh.geometry.boundingBox;
  const uvBox = box || localBox;
  const sizeX = Math.max(uvBox.max.x - uvBox.min.x, .0001);
  const sizeY = Math.max(uvBox.max.y - uvBox.min.y, .0001);
  const uv = new Float32Array(position.count * 2);
  const point = new THREE.Vector3();

  for (let index = 0; index < position.count; index += 1) {
    point.set(position.getX(index), position.getY(index), position.getZ(index));
    if (box) mesh.localToWorld(point);
    uv[index * 2] = ((box ? point.x : point.x) - uvBox.min.x) / sizeX;
    uv[index * 2 + 1] = ((box ? point.y : point.y) - uvBox.min.y) / sizeY;
  }

  mesh.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  mesh.geometry.attributes.uv.needsUpdate = true;
}

function roleBounds(role, predicate = null) {
  const box = new THREE.Box3();
  let found = false;
  meshes.forEach(mesh => {
    if (!mesh.visible || mesh.userData.role !== role) return;
    if (predicate && !predicate(mesh)) return;
    box.expandByObject(mesh);
    found = true;
  });
  return found ? box : null;
}

function meshWorldBox(mesh) {
  mesh.updateWorldMatrix(true, false);
  return new THREE.Box3().setFromObject(mesh);
}

function meshWorldCenter(mesh) {
  return meshWorldBox(mesh).getCenter(new THREE.Vector3());
}

function meshRoleBounds(role, predicate = null) {
  const box = new THREE.Box3();
  let found = false;
  meshes.forEach(mesh => {
    if (mesh.userData.role !== role || mesh.userData.glossCoat || mesh.userData.surfaceSkin) return;
    if (predicate && !predicate(mesh)) return;
    box.expandByObject(mesh);
    found = true;
  });
  return found ? box : null;
}

function roleVariantBounds(role, variant) {
  return meshRoleBounds(role, mesh => (mesh.userData.geometryVariant || "default") === variant);
}

function roleVariantRoots(role, variant) {
  const roots = new Set();
  meshes.forEach(mesh => {
    if (mesh.userData.role !== role || (mesh.userData.geometryVariant || "default") !== variant) return;
    if (mesh.userData.glossCoat || mesh.userData.surfaceSkin) return;
    let root = mesh;
    while (root.parent && root.parent !== model) root = root.parent;
    roots.add(root);
  });
  return roots;
}

function alignGeometryVariantToDefault(variant) {
  if (variant === "default") return;
  ["top", "sides"].forEach(role => {
    const reference = roleVariantBounds(role, "default");
    const target = roleVariantBounds(role, variant);
    if (!reference || !target) return;

    const referenceCenter = reference.getCenter(new THREE.Vector3());
    const targetCenter = target.getCenter(new THREE.Vector3());
    const delta = new THREE.Vector3(
      referenceCenter.x - targetCenter.x,
      referenceCenter.y - targetCenter.y,
      reference.max.z - target.max.z
    );
    roleVariantRoots(role, variant).forEach(root => moveObjectInWorld(root, delta));
  });
  model.updateWorldMatrix(true, true);
}

function alignGeometryVariantsToDefault() {
  Object.keys(electronicsGeometryVariants).forEach(alignGeometryVariantToDefault);
}

function electronicsMeshName(mesh) {
  return materialName(mesh);
}

function pickupAreaCenter() {
  const pickupBox = meshRoleBounds("pickupFrame") || meshRoleBounds("pickupCenter") || meshRoleBounds("pickupMagnets");
  return pickupBox ? pickupBox.getCenter(new THREE.Vector3()) : new THREE.Vector3(0, 0, 0);
}

function onePickupKeepKnobMesh() {
  const knobs = meshes.filter(mesh => mesh.userData.role === "knobs");
  if (!knobs.length) return null;
  const pickupCenter = pickupAreaCenter();
  return knobs.reduce((best, mesh) => {
    const center = meshWorldCenter(mesh);
    const distance = center.distanceTo(pickupCenter);
    return !best || distance < best.distance ? { mesh, distance } : best;
  }, null)?.mesh || knobs[0];
}

function isUpperPickupMesh(mesh) {
  if (!["pickupFrame", "pickupCenter", "pickupMagnets", "pickup"].includes(mesh.userData.role)) return false;
  const pickupBox = meshRoleBounds("pickupFrame") || meshRoleBounds("pickupCenter") || meshRoleBounds("pickupMagnets");
  if (!pickupBox) return false;
  const splitY = pickupBox.getCenter(new THREE.Vector3()).y;
  return meshWorldCenter(mesh).y > splitY;
}

function isSwitchMesh(mesh) {
  return electronicsMeshName(mesh).includes("switch");
}

function isHiddenForElectronicsVariant(mesh, activeVariant) {
  if (activeVariant !== "onePickup") return false;
  if (isUpperPickupMesh(mesh)) return true;
  if (isSwitchMesh(mesh)) return true;
  if (mesh.userData.role === "knobs") return mesh !== onePickupKeepKnobMesh();
  return false;
}

function moveObjectInWorld(object, worldDelta) {
  const parent = object.parent;
  if (!parent) {
    object.position.add(worldDelta);
    return;
  }

  parent.updateWorldMatrix(true, false);
  const origin = parent.worldToLocal(new THREE.Vector3(0, 0, 0));
  const target = parent.worldToLocal(worldDelta.clone());
  object.position.add(target.sub(origin));
}

function liftRoleAbove(role, referenceRoles, gap = .08) {
  const targetBox = roleBounds(role);
  if (!targetBox) return;

  const referenceBox = new THREE.Box3();
  let foundReference = false;
  meshes.forEach(mesh => {
    if (!mesh.visible || !referenceRoles.includes(mesh.userData.role)) return;
    referenceBox.expandByObject(mesh);
    foundReference = true;
  });
  if (!foundReference) return;

  const deltaZ = referenceBox.max.z + gap - targetBox.max.z;
  if (deltaZ <= 0) return;

  const roots = new Set();
  meshes.forEach(mesh => {
    if (mesh.userData.role !== role) return;
    let root = mesh;
    while (root.parent && root.parent !== model) root = root.parent;
    roots.add(root);
  });

  roots.forEach(root => moveObjectInWorld(root, new THREE.Vector3(0, 0, deltaZ)));
  model.updateWorldMatrix(true, true);
}

function addRoleSurfaceSkin(role, name, gap = .035) {
  const sourceMeshes = meshes.filter(mesh => mesh.visible && mesh.userData.role === role && !mesh.userData.surfaceSkin);
  sourceMeshes.forEach(source => {
    const skin = new THREE.Mesh(source.geometry.clone(), source.material);
    skin.name = name || `${source.name || role}SurfaceSkin`;
    skin.userData = {
      ...source.userData,
      forceRole: role,
      role,
      surfaceSkin: true,
      sourceMaterial: source.userData.sourceMaterial || ""
    };
    skin.castShadow = false;
    skin.receiveShadow = false;
    skin.renderOrder = Math.max(source.renderOrder || 0, 3.25);
    skin.position.copy(source.position);
    skin.rotation.copy(source.rotation);
    skin.quaternion.copy(source.quaternion);
    skin.scale.copy(source.scale);
    source.parent.add(skin);
    moveObjectInWorld(skin, new THREE.Vector3(0, 0, gap));
    meshes.push(skin);
  });
  model.updateWorldMatrix(true, true);
}

function addRoleGlossCoat(role, name, gap = .075) {
  const sourceMeshes = meshes.filter(mesh => {
    if (mesh.userData.role !== role || mesh.userData.glossCoat) return false;
    if (role === "top") return mesh.userData.surfaceSkin;
    return !mesh.userData.surfaceSkin;
  });

  sourceMeshes.forEach(source => {
    const coat = new THREE.Mesh(source.geometry.clone(), source.material);
    coat.name = name || `${source.name || role}GlossCoat`;
    coat.userData = {
      ...source.userData,
      forceRole: role,
      role,
      glossCoat: true,
      glossSourceVariant: source.userData.geometryVariant || "default",
      geometryVariant: source.userData.geometryVariant || "default",
      sourceMaterial: source.userData.sourceMaterial || ""
    };
    coat.castShadow = false;
    coat.receiveShadow = false;
    coat.renderOrder = Math.max(source.renderOrder || 0, role === "top" ? 3.8 : 2.8);
    coat.position.copy(source.position);
    coat.rotation.copy(source.rotation);
    coat.quaternion.copy(source.quaternion);
    coat.scale.copy(source.scale);
    source.parent.add(coat);
    moveObjectInWorld(coat, new THREE.Vector3(0, 0, gap));
    meshes.push(coat);
  });
  model.updateWorldMatrix(true, true);
}

function applyWoodUvs() {
  model.updateWorldMatrix(true, true);
  const bounds = {
    top: roleBounds("top"),
    sides: roleBounds("sides"),
    head: roleBounds("head"),
    body: roleBounds("body")
  };
  const topTextureReference = bounds.sides || bounds.body || bounds.top;

  meshes.forEach(mesh => {
    if (!["top", "sides", "head", "body"].includes(mesh.userData.role)) return;
    const referenceBox = mesh.userData.role === "top" ? topTextureReference : bounds[mesh.userData.role];
    applyPlanarWoodUv(mesh, referenceBox);
  });
}

function materialName(mesh) {
  const own = `${mesh.name || ""} ${mesh.parent?.name || ""}`.toLowerCase();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return `${own} ${materials.map(material => material?.name || "").join(" ")}`.toLowerCase();
}

function meshRole(mesh) {
  const name = materialName(mesh);
  const ownName = mesh.name || "";
  const parentName = mesh.parent?.name || "";
  const bodyNumber = ownName.match(/^Body(\d+)$/i);
  const isRootVisualBody = parentName === "Visual_v7" && bodyNumber;
  const isPickupBody = parentName.toLowerCase().includes("pickup") && bodyNumber;
  const isTunerBody = parentName === "Klucz_lewy_v1" || parentName === "Component1";

  if (name.includes("top")) return "top";
  if (name.includes("bok")) return "sides";
  if (name.includes("head")) return "head";
  if (name.includes("podstrunnica")) return "fretboard";
  if (name.includes("siodelko")) return "nut";
  if (name.includes("ramka")) return "pickupFrame";
  if (name.includes("podstawa")) return "pickupCenter";
  if (isPickupBody && Number(bodyNumber[1]) >= 3 && Number(bodyNumber[1]) <= 14) return "pickupMagnets";
  if (name.includes("pickup")) return "pickupCenter";
  if (name.includes("most") || name.includes("gotoh") || name.includes("wozek") || name.includes("trzpien") || name.includes("mocowanie")) return "hardware";
  if (name.includes("galka")) return "knobs";
  if (isTunerBody || name.includes("klucz")) return "tuners";
  if (name.includes("switch")) return "hardware";
  if (isRootVisualBody && Number(bodyNumber[1]) >= 10 && Number(bodyNumber[1]) <= 33) return "binding";
  if (isRootVisualBody && Number(bodyNumber[1]) >= 34 && Number(bodyNumber[1]) <= 68) return "markers";
  if (isRootVisualBody && Number(bodyNumber[1]) >= 69 && Number(bodyNumber[1]) <= 92) return "frets";
  if (name.includes("binding")) return "binding";
  if (name.includes("korpus") || name.includes("gryf")) return "body";

  return "body";
}

function physicalMaterial(options) {
  return new THREE.MeshPhysicalMaterial({
    color: options.color || "#ffffff",
    map: options.map || null,
    alphaMap: null,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthWrite: true,
    metalness: options.metalness ?? 0,
    roughness: options.roughness ?? .42,
    clearcoat: options.clearcoat ?? 0,
    clearcoatRoughness: options.clearcoatRoughness ?? .2,
    emissive: options.emissive || "#000000",
    emissiveIntensity: options.emissiveIntensity ?? 0,
    iridescence: options.iridescence ?? 0,
    iridescenceIOR: options.iridescenceIOR ?? 1.3,
    sheen: options.sheen ?? 0,
    side: options.side || THREE.DoubleSide
  });
}

function flatWoodMaterial(options) {
  return new THREE.MeshBasicMaterial({
    color: options.color || "#ffffff",
    map: options.map || null,
    alphaMap: null,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthWrite: true,
    side: THREE.FrontSide,
    toneMapped: true
  });
}

function glossCoatMaterial(role) {
  const finish = role === "sides" ? fieldValue("sideFinish") : fieldValue("topFinish");
  const enabled = finish === "Gloss";

  return new THREE.ShaderMaterial({
    uniforms: {
      coatOpacity: { value: enabled ? (role === "top" ? .48 : .34) : 0 },
      bandStrength: { value: role === "top" ? 1.0 : .72 },
      sweepOffset: { value: role === "top" ? -4.0 : 1.5 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float coatOpacity;
      uniform float bandStrength;
      uniform float sweepOffset;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPosition;

      void main() {
        if (coatOpacity <= 0.001) discard;

        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewDir);
        float facing = clamp(dot(normal, viewDir), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.25);

        float broadBand = 1.0 - smoothstep(0.0, 24.0, abs(vWorldPosition.x - vWorldPosition.y * 0.17 + sweepOffset));
        float narrowBand = 1.0 - smoothstep(0.0, 7.0, abs(vWorldPosition.x - vWorldPosition.y * 0.1 - 9.0));
        float verticalSheen = smoothstep(-52.0, 15.0, vWorldPosition.y) * (1.0 - smoothstep(42.0, 88.0, vWorldPosition.y));

        float alpha = coatOpacity * (broadBand * bandStrength + narrowBand * 0.3 + fresnel * 0.42) * verticalSheen;
        if (alpha < 0.018) discard;

        vec3 color = mix(vec3(1.0, 0.93, 0.78), vec3(1.0), 0.55);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    toneMapped: false
  });
}

function resolveSolidPaintColor(color) {
  if (color === "natural") return "#d7b37a";
  if (color === "paint:candy-apple-red") return "#b51616";
  if (color === "paint:cream-white") return "#d8c39a";
  if (color === "paint:pearl-white") return "#f2eee6";
  if (color === "paint:metallic-black") return "#101010";
  return color;
}

function paintTextureForColor(color) {
  return {
    "paint:cream-white": textureMap("paintCreamWhite", 1, 1),
    "paint:pearl-white": textureMap("paintPearlWhite", 1, 1),
    "paint:metallic-black": textureMap("paintMetallicBlack", 1, 1),
    "paint:candy-apple-red": textureMap("paintCandyAppleRed", 1, 1)
  }[color] || null;
}

function woodMaterial(wood, color, finish, area = "top") {
  const useFlatSurface = area === "top" || area === "sides" || area === "head";
  if (wood === "Jednolity kolor") {
    const candy = color === "paint:candy-apple-red";
    const metallic = String(color).startsWith("paint:");
    const materialOptions = {
      color: resolveSolidPaintColor(color),
      map: paintTextureForColor(color),
      roughness: finish === "Gloss" ? candy ? .2 : .24 : .58,
      clearcoat: finish === "Gloss" ? candy ? .9 : .74 : .12,
      clearcoatRoughness: finish === "Gloss" ? .09 : .42,
      metalness: metallic ? .08 : .03,
      side: THREE.FrontSide
    };
    return useFlatSurface ? flatWoodMaterial(materialOptions) : physicalMaterial(materialOptions);
  }

  const tint = color === "natural" ? "#ffffff" : color;
  const materialOptions = {
    color: color === "natural" ? tint : "#ffffff",
    map: selectedTopTexture(wood, color, area, finish),
    roughness: finish === "Gloss" ? .25 : .58,
    clearcoat: finish === "Gloss" ? .82 : .08,
    clearcoatRoughness: finish === "Gloss" ? .12 : .48,
    side: THREE.FrontSide
  };
  return useFlatSurface ? flatWoodMaterial(materialOptions) : physicalMaterial(materialOptions);
}

function bodyMaterial() {
  const finish = fieldValue("bodyFinish");
  const color = solidColors[finish] || "#6f3d2b";
  const glossy = finish === "Lakier bezbarwny mat" ? .1 : 0;
  return physicalMaterial({
    color,
    map: finish.includes("Czarny") ? null : selectedBodyTexture(),
    roughness: finish === "Olejowosk" ? .72 : .56,
    clearcoat: glossy,
    side: THREE.FrontSide
  });
}

function hardwareMaterial(name) {
  const finish = metalFinishes[name] || metalFinishes.Chrom;
  return physicalMaterial(finish);
}

function metalLogoMaterial() {
  return new THREE.MeshBasicMaterial({
    color: "#ffffff",
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
}

function pickupMaterial() {
  return hardwareMaterial(fieldValue("pickupCenterColor"));
}

function pickupMagnetMaterial() {
  return physicalMaterial({
    color: "#c4c9ca",
    metalness: .48,
    roughness: .22,
    clearcoat: .42,
    clearcoatRoughness: .12,
    emissive: "#171b1c",
    emissiveIntensity: .1
  });
}

function fretMaterial() {
  if (fieldValue("fretMaterial") === "Niklowane") {
    return physicalMaterial({
      color: "#beb7aa",
      metalness: .45,
      roughness: .24,
      clearcoat: .4,
      emissive: "#171512",
      emissiveIntensity: .08
    });
  }

  return physicalMaterial({
    color: "#d7dcdd",
    metalness: .55,
    roughness: .2,
    clearcoat: .5,
    emissive: "#161b1c",
    emissiveIntensity: .1
  });
}

function markerMaterial() {
  return bindingMaterial();
}

function isPearlBinding(selected) {
  return !selected || normalizedLabel(selected.value) === "perlowy";
}

function bindingMaterial() {
  const selected = form.querySelector('[name="binding"]:checked');
  const isPearl = isPearlBinding(selected);
  const color = isPearl ? "#CEC0A4" : selected?.dataset.color || "#CEC0A4";
  return physicalMaterial({
    color,
    metalness: 0,
    roughness: isPearl ? .34 : .34,
    clearcoat: isPearl ? .62 : .52,
    clearcoatRoughness: isPearl ? .24 : .18,
    iridescence: isPearl ? .06 : .08,
    iridescenceIOR: 1.18,
    sheen: isPearl ? .28 : 0,
    emissive: isPearl ? "#211b13" : "#050403",
    emissiveIntensity: isPearl ? .08 : .05
  });
}

function bodyBindingRimMaterial() {
  const selected = form.querySelector('[name="binding"]:checked');
  const isPearl = isPearlBinding(selected);
  return new THREE.MeshBasicMaterial({
    color: isPearl ? "#CEC0A4" : selected?.dataset.color || "#CEC0A4",
    opacity: isPearl ? .78 : .68,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false
  });
}

function bodyBindingGlowMaterial() {
  const selected = form.querySelector('[name="binding"]:checked');
  const isPearl = isPearlBinding(selected);
  return new THREE.ShaderMaterial({
    uniforms: {
      rimColor: { value: new THREE.Color(isPearl ? "#CEC0A4" : selected?.dataset.color || "#CEC0A4") },
      rimOpacity: { value: isPearl ? .12 : .16 },
      rimWidth: { value: .22 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 rimColor;
      uniform float rimOpacity;
      uniform float rimWidth;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vViewDir)));
        float rim = 1.0 - smoothstep(0.0, rimWidth, facing);
        float alpha = rim * rimOpacity;
        if (alpha < 0.035) discard;
        gl_FragColor = vec4(rimColor, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

function materialForRole(role) {
  const topColor = hiddenValue("topColor");
  const sideColor = hiddenValue("sideColor");
  const topWood = fieldValue("topWood");
  const sideWood = fieldValue("sideWood");
  const headMode = fieldValue("headMode");

  if (role === "top") return woodMaterial(topWood, topColor, fieldValue("topFinish"), "top");
  if (role === "sides") return woodMaterial(sideWood, sideColor, fieldValue("sideFinish"), "sides");
  if (role === "head") {
    if (headMode === "Jak top") return woodMaterial(topWood, topColor, fieldValue("headFinish"), "head");
    if (headMode === "Jak boki") return woodMaterial(sideWood, sideColor, fieldValue("headFinish"), "head");
    return physicalMaterial({ color: "#020202", roughness: fieldValue("headFinish") === "Gloss" ? .24 : .68, clearcoat: fieldValue("headFinish") === "Gloss" ? .75 : 0, side: THREE.FrontSide });
  }
  if (role === "fretboard") return physicalMaterial({ color: solidColors[fieldValue("fretboard")] || solidColors.Heban, roughness: .7 });
  if (role === "binding") return bindingMaterial();
  if (role === "bodyBindingRim") return bodyBindingRimMaterial();
  if (role === "bodyBindingGlow") return bodyBindingGlowMaterial();
  if (role === "markers") return markerMaterial();
  if (role === "frets") return fretMaterial();
  if (role === "nut") return physicalMaterial({ color: solidColors[fieldValue("nut")] || solidColors.Kość, roughness: .4 });
  if (role === "pickupFrame") return hardwareMaterial(fieldValue("pickupFrameColor"));
  if (role === "pickupCenter") return hardwareMaterial(fieldValue("pickupCenterColor"));
  if (role === "pickupMagnets") return pickupMagnetMaterial();
  if (role === "pickup") return pickupMaterial();
  if (role === "metalLogo") return metalLogoMaterial();
  if (role === "tuners") return hardwareMaterial(fieldValue("hardwareColor"));
  if (role === "knobs") return hardwareMaterial(fieldValue("knobColor"));
  if (role === "hardware") return hardwareMaterial(fieldValue("hardwareColor"));
  return bodyMaterial();
}

function applyMaterials() {
  const activeVariant = activeElectronicsVariant();
  meshes.forEach(mesh => {
    if (mesh.userData.preserveMaterial) {
      mesh.material.needsUpdate = true;
      return;
    }
    if (mesh.userData.glossCoat) {
      mesh.visible = (mesh.userData.geometryVariant || "default") === activeVariant;
      mesh.material = glossCoatMaterial(mesh.userData.role);
      mesh.material.needsUpdate = true;
      return;
    }
    if ((mesh.userData.role === "top" || mesh.userData.role === "sides") && (mesh.userData.geometryVariant || "default") !== activeVariant) {
      mesh.visible = false;
      return;
    }
    if (isHiddenForElectronicsVariant(mesh, activeVariant)) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mesh.material = materialForRole(mesh.userData.role);
    mesh.material.transparent = false;
    mesh.material.opacity = 1;
    mesh.material.alphaMap = null;
    mesh.material.alphaTest = 0;
    mesh.material.depthWrite = true;

    if (mesh.userData.role === "body") {
      mesh.renderOrder = 0;
      mesh.material.depthTest = true;
      mesh.material.polygonOffset = false;
    }
    if (mesh.userData.role === "sides") {
      mesh.renderOrder = 1;
      mesh.material.depthTest = true;
      mesh.material.polygonOffset = true;
      mesh.material.polygonOffsetFactor = -1;
      mesh.material.polygonOffsetUnits = -1;
    }
    if (mesh.userData.role === "top") {
      mesh.renderOrder = 3;
      if (mesh.userData.surfaceSkin) mesh.renderOrder = 3.75;
      mesh.material.depthTest = true;
      mesh.material.polygonOffset = true;
      mesh.material.polygonOffsetFactor = mesh.userData.surfaceSkin ? -40 : -10;
      mesh.material.polygonOffsetUnits = mesh.userData.surfaceSkin ? -40 : -10;
    }
    if (mesh.userData.role === "binding") {
      mesh.renderOrder = 4;
    }
    if (["hardware", "pickupFrame", "pickupCenter", "pickupMagnets", "tuners", "knobs", "nut", "frets", "markers"].includes(mesh.userData.role)) {
      mesh.renderOrder = 5;
    }
    if (mesh.userData.role === "metalLogo") {
      mesh.renderOrder = 8;
      mesh.material.polygonOffset = true;
      mesh.material.polygonOffsetFactor = -8;
      mesh.material.polygonOffsetUnits = -8;
      mesh.material.depthTest = true;
      mesh.material.depthWrite = false;
    }
    mesh.material.needsUpdate = true;
  });
  updateViewerDebug("materials");
  render();
}

function fitCamera() {
  if (!model) return;

  const box = new THREE.Box3();
  const fitRoles = new Set(["top", "sides", "head", "fretboard", "body", "hardware", "pickupFrame", "pickupCenter", "pickupMagnets", "tuners", "knobs", "nut", "frets", "markers"]);
  let found = false;
  meshes.forEach(mesh => {
    if (!mesh.visible || !fitRoles.has(mesh.userData.role)) return;
    box.expandByObject(mesh);
    found = true;
  });
  if (!found) box.setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  fittedHeight = Math.max(size.y, size.x * 1.25, 1);
  if (!fixedViewHeight) fixedViewHeight = fittedHeight;
  resize();
}

function updateZoomFocusPoint() {
  const pickupBox = roleBounds("pickupFrame") || roleBounds("pickupCenter");
  if (pickupBox) {
    const pickupSize = pickupBox.getSize(new THREE.Vector3());
    zoomFocusPoint.set(
      pickupBox.min.x + pickupSize.x * .5,
      pickupBox.min.y + pickupSize.y * .26,
      0
    );
    return;
  }

  const bodyBox = roleBounds("binding", mesh => mesh.userData.forceRole === "binding") || roleBounds("top") || roleBounds("body");
  if (!bodyBox) {
    zoomFocusPoint.set(0, 0, 0);
    return;
  }

  const bodySize = bodyBox.getSize(new THREE.Vector3());
  zoomFocusPoint.set(
    bodyBox.min.x + bodySize.x * .5,
    bodyBox.max.y - bodySize.y * .6,
    0
  );
}

function normalizeModel(object) {
  object.updateWorldMatrix(true, true);
  const before = new THREE.Box3().setFromObject(object);
  const size = before.getSize(new THREE.Vector3());

  if (size.z > size.y * 1.2) {
    object.rotation.x = -Math.PI / 2;
    object.updateWorldMatrix(true, true);
  }

  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.userData.normalizationCenter = center.clone();
  object.position.sub(center);
  object.updateWorldMatrix(true, true);
}

function centerObjectGeometry(object) {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.traverse(child => {
    if (!child.isMesh) return;
    const localCenter = child.worldToLocal(center.clone());
    child.geometry.translate(-localCenter.x, -localCenter.y, -localCenter.z);
    child.geometry.computeBoundingBox();
    child.geometry.computeVertexNormals();
  });
  object.position.set(0, 0, 0);
  object.updateWorldMatrix(true, true);
}

function removeSteepSideFaces(object, threshold = .58) {
  const dominantAxis = dominantSurfaceAxis(object);
  if (dominantAxis === -1) return;

  object.traverse(child => {
    if (!child.isMesh || child.userData.skipLayer || !child.geometry?.attributes?.position) return;
    keepFacesOnAxis(child, dominantAxis, threshold);
  });
}

function keepOuterSurfaceFaces(object, threshold = .82, depthPadding = .55) {
  const dominantAxis = dominantSurfaceAxis(object);
  if (dominantAxis === -1) return;

  object.traverse(child => {
    if (!child.isMesh || child.userData.skipLayer || !child.geometry?.attributes?.position) return;
    keepFacesOnAxis(child, dominantAxis, threshold, { outerOnly: true, depthPadding });
  });
}

function dominantSurfaceAxis(object) {
  const axes = [0, 0, 0];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();

  object.traverse(child => {
    if (!child.isMesh || child.userData.skipLayer || !child.geometry?.attributes?.position) return;

    const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry;
    const position = geometry.attributes.position;
    for (let index = 0; index < position.count; index += 3) {
      a.fromBufferAttribute(position, index);
      b.fromBufferAttribute(position, index + 1);
      c.fromBufferAttribute(position, index + 2);
      faceNormal.subVectors(c, b).cross(a.clone().sub(b)).normalize();
      axes[0] += Math.abs(faceNormal.x);
      axes[1] += Math.abs(faceNormal.y);
      axes[2] += Math.abs(faceNormal.z);
    }
  });

  const max = Math.max(...axes);
  return max > 0 ? axes.indexOf(max) : -1;
}

function keepFacesOnAxis(mesh, dominantAxis, threshold, options = {}) {
  const original = mesh.geometry;
  const geometry = original.index ? original.toNonIndexed() : original.clone();
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const normal = geometry.attributes.normal;
  const positions = [];
  const normals = [];
  const uvs = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();
  const bounds = geometry.boundingBox;
  const minAxis = dominantAxis === 0 ? bounds.min.x : dominantAxis === 1 ? bounds.min.y : bounds.min.z;
  const maxAxis = dominantAxis === 0 ? bounds.max.x : dominantAxis === 1 ? bounds.max.y : bounds.max.z;
  const axisRange = Math.max(maxAxis - minAxis, .0001);
  const outerPadding = options.depthPadding ?? Math.max(axisRange * .025, .08);
  const frontLimit = maxAxis - outerPadding;

  const axisValue = point => dominantAxis === 0 ? point.x : dominantAxis === 1 ? point.y : point.z;

  for (let index = 0; index < position.count; index += 3) {
    a.fromBufferAttribute(position, index);
    b.fromBufferAttribute(position, index + 1);
    c.fromBufferAttribute(position, index + 2);
    faceNormal.subVectors(c, b).cross(a.clone().sub(b)).normalize();

    const alignment = dominantAxis === 0 ? faceNormal.x : dominantAxis === 1 ? faceNormal.y : faceNormal.z;
    if (Math.abs(alignment) < threshold) continue;
    if (options.outerOnly) {
      const centerOnAxis = (axisValue(a) + axisValue(b) + axisValue(c)) / 3;
      if (centerOnAxis < frontLimit) continue;
    }

    for (let vertex = 0; vertex < 3; vertex += 1) {
      const sourceIndex = index + vertex;
      positions.push(position.getX(sourceIndex), position.getY(sourceIndex), position.getZ(sourceIndex));
      normals.push(normal.getX(sourceIndex), normal.getY(sourceIndex), normal.getZ(sourceIndex));
      if (uv) uvs.push(uv.getX(sourceIndex), uv.getY(sourceIndex));
    }
  }

  if (positions.length === 0) {
    mesh.userData.skipLayer = true;
    mesh.visible = false;
    geometry.dispose();
    return;
  }
  if (positions.length === position.count * 3) {
    geometry.dispose();
    return;
  }

  const cleaned = new THREE.BufferGeometry();
  cleaned.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  cleaned.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  if (uvs.length) cleaned.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  cleaned.computeBoundingBox();
  cleaned.computeVertexNormals();
  mesh.geometry.dispose();
  mesh.geometry = cleaned;
  geometry.dispose();
}

function prepareForcedLayerModel(object, role, name, renderOrder = 3, meshFilter = null) {
  object.name = name;
  object.userData.forceRole = role;
  object.traverse(child => {
    if (!child.isMesh) return;
    const keepMesh = !meshFilter || meshFilter(child);
    if (!keepMesh) {
      child.userData.skipLayer = true;
      child.visible = false;
      return;
    }
    child.userData.forceRole = role;
    child.name = child.name || `${name}Mesh`;
    child.renderOrder = renderOrder;
    child.castShadow = role !== "binding";
    child.receiveShadow = role !== "binding";
  });
}

function tagGeometryVariant(object, variant) {
  object.userData.geometryVariant = variant;
  object.traverse(child => {
    if (!child.isMesh) return;
    child.userData.geometryVariant = variant;
  });
}

function isNamedLayerMesh(mesh, expectedName) {
  return normalizedLabel(mesh.name || "") === normalizedLabel(expectedName);
}

function loadImageElement(path) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = encodeURI(path);
  });
}

async function fileLogoTexture() {
  const image = await loadImageElement(metalLogoImagePath);
  if (!image) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(-Math.PI / 2);
  context.drawImage(image, -214, -48, 428, 96);
  context.restore();

  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < data.data.length; index += 4) {
    const r = data.data[index];
    const g = data.data[index + 1];
    const b = data.data[index + 2];
    const lightness = (r + g + b) / 3;
    const sourceAlpha = data.data[index + 3];
    const keep = sourceAlpha > 18;
    data.data[index] = keep ? 226 : 0;
    data.data[index + 1] = keep ? 232 : 0;
    data.data[index + 2] = keep ? 232 : 0;
    data.data[index + 3] = keep ? Math.min(255, Math.max(220, sourceAlpha * (lightness > 160 ? 1.2 : 1.04))) : 0;
  }
  context.putImageData(data, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createMetalLogoLayer(texture) {
  const topBox = roleBounds("top");
  const bodyBindingBox = roleBounds("binding", mesh => mesh.userData.forceRole === "binding");
  const bodyBox = bodyBindingBox || roleBounds("body") || topBox;
  if (!texture || !topBox || !bodyBox) return null;

  const topSize = topBox.getSize(new THREE.Vector3());
  const bodySize = bodyBox.getSize(new THREE.Vector3());
  const width = Math.max(bodySize.x * .14, 20);
  const height = width * 2.57;
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "MetalLogoFromFile";
  mesh.userData.forceRole = "metalLogo";
  mesh.userData.preserveMaterial = true;
  mesh.renderOrder = 8;
  const desiredWorldPosition = new THREE.Vector3(
    bodyBox.min.x + bodySize.x * .405,
    bodyBox.max.y - bodySize.y * .075,
    topBox.max.z + Math.max(topSize.z * .42, 1.8)
  );
  mesh.position.copy(model.worldToLocal(desiredWorldPosition));
  return mesh;
}

function alignMetalLogoGeometryLayer(object) {
  const topBox = roleBounds("top");
  const bodyBindingBox = roleBounds("binding", mesh => mesh.userData.forceRole === "binding");
  const bodyBox = bodyBindingBox || roleBounds("body") || topBox;
  if (!object || !topBox || !bodyBox) return;

  centerObjectGeometry(object);
  object.rotation.z = Math.PI / 2;
  object.updateWorldMatrix(true, true);

  const logoBox = new THREE.Box3().setFromObject(object);
  const logoSize = logoBox.getSize(new THREE.Vector3());
  const bodySize = bodyBox.getSize(new THREE.Vector3());
  const scale = Math.min(
    bodySize.x * .16 / Math.max(logoSize.x, .0001),
    bodySize.y * .28 / Math.max(logoSize.y, .0001)
  ) * .5;
  object.scale.setScalar(scale);
  object.updateWorldMatrix(true, true);

  const targetWorld = new THREE.Vector3(
    bodyBox.min.x + bodySize.x * .375,
    bodyBox.max.y - bodySize.y * .13,
    topBox.max.z + 4.8
  );
  object.position.copy(model.worldToLocal(targetWorld.clone()));
  object.updateWorldMatrix(true, true);
}

function updateMetalLogoVisibility(yawRadians) {
  const frontAmount = Math.cos(yawRadians - baseYaw);
  const visible = frontAmount > .08;
  meshes.forEach(mesh => {
    if (mesh.userData.role === "metalLogo") mesh.visible = visible;
  });
}

function updateView() {
  const degrees = Number(frameSlider.value || 0);
  const yaw = baseYaw + THREE.MathUtils.degToRad(degrees);
  pivot.rotation.y = yaw;
  updateMetalLogoVisibility(yaw);

  const zoomValue = Number(zoomSlider.value || 0);
  const zoom = 1.24 + zoomValue / 62;
  const focusAmount = THREE.MathUtils.smoothstep(zoomValue / 100, 0, 1);
  pivot.position.x = -zoomFocusPoint.x * focusAmount;
  pivot.position.y = -zoomFocusPoint.y * focusAmount;
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
  render();
}

function resize() {
  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);
  const aspect = width / height;
  const viewHeight = (fixedViewHeight || fittedHeight) * 1.32;
  const viewWidth = viewHeight * aspect;

  camera.left = -viewWidth / 2;
  camera.right = viewWidth / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  updateViewerDebug("resize");
  updateView();
}

function render() {
  renderer.render(scene, camera);
}

async function init() {
  container.dataset.viewerStatus = "loading-models";
  const loader = new FBXLoader();
  const layerLoader = new ThreeMFLoader();
  const variantLayerPromises = Object.entries(electronicsGeometryVariants).flatMap(([variant, paths]) => [
    layerLoader.loadAsync(encodeURI(paths.top)).then(layer => ({ variant, role: "top", layer })),
    layerLoader.loadAsync(encodeURI(paths.sides)).then(layer => ({ variant, role: "sides", layer }))
  ]);
  const [mainModel, variantLayers, bodyBindingModel, metalLogoModel] = await Promise.all([
    loader.loadAsync(encodeURI(modelPath)),
    Promise.all(variantLayerPromises),
    layerLoader.loadAsync(encodeURI(layerModelPaths.binding)),
    layerLoader.loadAsync(encodeURI(layerModelPaths.metalLogo))
  ]);
  variantLayers.forEach(({ variant, role, layer }) => {
    const isDefaultTop = variant === "default" && role === "top";
    prepareForcedLayerModel(
      layer,
      role,
      `${variant === "default" ? "" : `${variant}-`}${role === "top" ? "TopLayer3MF" : "SidesLayer3MF"}`,
      role === "top" ? 2 : 1,
      isDefaultTop ? child => isNamedLayerMesh(child, "Top") : null
    );
    tagGeometryVariant(layer, variant);
    if (role === "top") keepOuterSurfaceFaces(layer, .9, .025);
  });
  prepareForcedLayerModel(bodyBindingModel, "binding", "BodyBindingKorpus", 4);
  prepareForcedLayerModel(metalLogoModel, "metalLogo", "MetalLogo3MF", 8);

  model = new THREE.Group();
  model.name = "WeirdoConfiguredModel";
  model.add(mainModel);
  variantLayers.forEach(({ layer }) => model.add(layer));
  model.add(bodyBindingModel);
  container.dataset.viewerStatus = "models-loaded";
  normalizeModel(model);

  model.traverse(child => {
    if (!child.isMesh) return;
    if (child.userData.skipLayer) return;

    child.geometry.computeBoundingBox();
    if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals();
    child.castShadow = true;
    child.receiveShadow = true;
    child.userData.sourceMaterial = Array.isArray(child.material) ? child.material.map(item => item?.name || "").join(", ") : child.material?.name || "";
    const inferredRole = meshRole(child);
    child.userData.role = child.userData.forceRole || inferredRole;
    if (!child.userData.forceRole && (inferredRole === "top" || inferredRole === "sides")) {
      child.visible = false;
      return;
    }
    meshes.push(child);
  });
  alignGeometryVariantsToDefault();
  liftRoleAbove("top", ["sides", "body"], .12);
  addRoleSurfaceSkin("top", "TopCleanSurfaceSkin", .085);
  addRoleGlossCoat("top", "TopGlossCoat", .075);
  addRoleGlossCoat("sides", "SidesGlossCoat", .06);
  applyWoodUvs();
  alignMetalLogoGeometryLayer(metalLogoModel);
  if (metalLogoModel) {
    model.add(metalLogoModel);
    metalLogoModel.traverse(child => {
      if (!child.isMesh || child.userData.skipLayer) return;
      child.geometry.computeBoundingBox();
      if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals();
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.sourceMaterial = Array.isArray(child.material) ? child.material.map(item => item?.name || "").join(", ") : child.material?.name || "";
      child.userData.role = child.userData.forceRole || meshRole(child);
      meshes.push(child);
    });
  }

  updateZoomFocusPoint();
  pivot.add(model);
  fitCamera();
  await Promise.all(texturePromises);
  applyMaterials();
  updateView();
  await waitForStableFrames();
  render();
  window.addEventListener("resize", resize);
  window.dispatchEvent(new CustomEvent("weirdo:viewer3d-ready"));
  container.dataset.viewerStatus = "ready";
}

form.addEventListener("input", applyMaterials);
form.addEventListener("change", applyMaterials);
frameSlider.addEventListener("input", updateView);
zoomSlider.addEventListener("input", updateView);

init().catch(error => {
  container.dataset.viewerStatus = "failed";
  container.dataset.viewerError = error.message || String(error);
  window.dispatchEvent(new CustomEvent("weirdo:viewer3d-failed", {
    detail: { error: error.message || String(error) }
  }));
  console.warn("Nie udało się uruchomić podglądu 3D, zostaje podgląd 2D.", error);
});
