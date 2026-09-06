const form = document.querySelector("#configForm");
const canvas = document.querySelector("#guitarCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const loading = document.querySelector("#canvasLoading");
const stageWrap = document.querySelector(".stage-wrap");
const frameSlider = document.querySelector("#frameSlider");
const zoomSlider = document.querySelector("#zoomSlider");
let viewer3dReady = false;

const defaults = {
  topWood: "Klon falisty",
  topColor: "burst:sunshine",
  topFinish: "Gloss",
  sideWood: "Jednolity kolor",
  sideColor: "#101010",
  sideFinish: "Gloss",
  fretboard: "Heban",
  bodyWood: "Mahoń sapeli",
  bodyFinish: "Olejowosk",
  bindingShape: "Standard WEIRDO",
  binding: "Perłowy",
  hardwareColor: "Chrom",
  knobColor: "Chrom",
  electronicsLayout: "Układ 1: 4 gałki + 2 switche",
  headMode: "Czarna",
  headFinish: "Gloss",
  pickups: "Czarne bez puszek",
  pickupFrameColor: "Chrom",
  pickupCenterColor: "Czarny",
  pickupMagnetColor: "Szare",
  bridge: "Tune-o-matic Gotoh",
  tuners: "Gotoh SG381 MG",
  nut: "Kość",
  straplocks: "Dunlop Flushmount"
};

const finishColors = [
  ["Bez barwnika", "natural"],
  ["Zielony jasny", "#6f9f55"],
  ["Zielony ciemny", "#24563b"],
  ["Żółty", "#d6a824"],
  ["Pomarańczowy jasny", "#d9782d"],
  ["Pomarańczowy ciemny", "#9b451d"],
  ["Czerwony", "#b51716"],
  ["Fioletowy", "#633f76"],
  ["Niebieski", "#1c5fa8"],
  ["Szary", "#66686b"],
  ["Czarny", "#101010"],
  ["Biały", "#f2eee6"],
  ["Kremowy", "#d8c39a"]
];

const burstColors = [
  ["Bez barwnika", "natural", "natural"],
  ["Evil green", "burst:evil-green", "linear-gradient(135deg, #06150b 0%, #14502d 35%, #79b957 100%)"],
  ["Devil red", "burst:devil-red", "linear-gradient(135deg, #170203 0%, #9b1512 42%, #e07821 100%)"],
  ["Purple rain", "burst:purple-rain", "linear-gradient(135deg, #12051d 0%, #61307f 48%, #1b66b0 100%)"],
  ["Sunshine", "burst:sunshine", "linear-gradient(135deg, #6f2d08 0%, #db7e21 48%, #f0c83a 100%)"],
  ["Foggy", "burst:foggy", "linear-gradient(135deg, #060606 0%, #565b5f 52%, #c1b9a7 100%)"]
];

const darkWoodColors = finishColors.filter(([name]) => !["Szary", "Biały"].includes(name));

const solidPaintColors = [
  ["Czarny metallic", "#101010", "radial-gradient(circle at 35% 25%, #4a4a46 0%, #101010 42%, #020202 100%)"],
  ["Biały metallic", "#f2eee6", "radial-gradient(circle at 35% 25%, #ffffff 0%, #eee8db 48%, #bcb8b0 100%)"],
  ["Kremowy metallic", "#d8c39a", "radial-gradient(circle at 35% 25%, #fff2cb 0%, #d8c39a 50%, #9c8358 100%)"],
  ["Candy red metallic", "solid:candy-red", "radial-gradient(circle at 35% 25%, #ff6a54 0%, #b51616 48%, #350304 100%)"]
];

const bindingOptions = [
  ["Perłowy", "#CEC0A4", true],
  ["Silver dust", "#8f9497"],
  ["Czerwony", "#8f403d"],
  ["Zielony", "#4f775e"],
  ["Fioletowy", "#685979"],
  ["Żółty", "#ad9554"],
  ["Ciemny szary", "#4d4d4d"]
];

const assetBase = window.location.protocol === "file:" ? "." : window.location.pathname.includes("/configurator") ? "/configurator" : "";
const inventoryPath = `${assetBase}/materials.inventory.json`;

const paths = {
  frames: [
    `${assetBase}/elementy/calosc%208/1.png`,
    `${assetBase}/elementy/calosc%208/2.png`,
    `${assetBase}/elementy/calosc%208/3.png`,
    `${assetBase}/elementy/calosc%208/4.png`,
    `${assetBase}/elementy/calosc%208/Visual_(zesp)_2026-Sep-04_11-11-35PM-000_CustomizedView2991787094.png`,
    `${assetBase}/elementy/calosc%208/6.png`,
    `${assetBase}/elementy/calosc%208/7.png`,
    `${assetBase}/elementy/calosc%208/8.png`
  ],
  body: `${assetBase}/elementy/body.png`,
  sides: `${assetBase}/elementy/Boki/boki.png`,
  top: `${assetBase}/elementy/top.png`,
  binding: `${assetBase}/elementy/Binding/binding.png`,
  head: `${assetBase}/elementy/Head.png`,
  fretboard: `${assetBase}/elementy/Podstrunnica/Podstrunnica.PNG`,
  hardware: `${assetBase}/elementy/osprzet.png`,
  knobs: `${assetBase}/elementy/galki.png`,
  nut: `${assetBase}/elementy/siodelko.png`,
  mapleNatural: `${assetBase}/tekstury/runtime/maple-flame.png`,
  mapleEnhanced: `${assetBase}/tekstury/runtime/maple-flame.png`,
  poplarBurl: `${assetBase}/tekstury/runtime/poplar-burl.png`,
  mahogany: `${assetBase}/tekstury/runtime/mahogany-top.png`,
  europeanWalnut: `${assetBase}/tekstury/runtime/walnut.png`,
  americanWalnut: `${assetBase}/tekstury/runtime/walnut.png`
};

const images = {};
const masks = {};
const frontReferenceTransform = { scale: .7727, x: 173, y: 205 };

function renderPalettes() {
  ["top", "side"].forEach(kind => {
    const input = document.querySelector(`#${kind}Color`);
    const palette = colorPaletteForWood(fieldValue(`${kind}Wood`) || defaults[`${kind}Wood`]);
    const current = input?.value || defaults[`${kind}Color`];
    const selected = palette.some(([, color]) => color === current) ? current : palette[0][1];
    if (input && input.value !== selected) input.value = selected;
    const target = `${kind}Color`;
    const container = document.querySelector(`#${kind}ColorChoices`);
    container.innerHTML = palette.map(([name, color, swatch]) => `
      <button class="finish-color${color === selected ? " active" : ""}" type="button" data-target="${target}" data-color="${color}" title="${name}" aria-label="${name}">
        <span class="${color === "natural" ? "natural-color" : ""}"${color === "natural" ? "" : ` style="background:${swatch || color}"`}></span>
        <small>${name}</small>
      </button>
    `).join("");
  });

  document.querySelector("#bindingChoices").innerHTML = bindingOptions.map(([name, color, recommended]) => `
    <label class="swatch-label" title="${recommended ? "Rekomendowane" : name}">
      <input type="radio" name="binding" value="${name}" data-color="${color}" ${recommended ? "checked" : ""}>
      <span class="color-dot" style="background:${color}"></span>
      <span>${name}</span>
    </label>
  `).join("");
}

function normalizedWood(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function colorPaletteForWood(wood) {
  const label = normalizedWood(wood);
  if (label.includes("jednolity")) return solidPaintColors;
  if (label.includes("klon") || label.includes("topola")) return burstColors;
  return darkWoodColors;
}

function fieldValue(name) {
  const checked = form.querySelector(`[name="${name}"]:checked`);
  return checked ? checked.value : form.elements[name]?.value || "";
}

function selectedColorName(value, wood = "") {
  const allColors = wood ? colorPaletteForWood(wood) : [...finishColors, ...burstColors, ...solidPaintColors];
  return allColors.find(([, color]) => color === value)?.[0] || value;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Nie udało się wczytać: ${src}`));
    img.src = src;
  });
}

async function loadImages() {
  const entries = Object.entries(paths).flatMap(([key, value]) => {
    if (Array.isArray(value)) return value.map((src, index) => [`frame${index}`, src]);
    return [[key, value]];
  });

  await Promise.all(entries.map(async ([key, src]) => {
    try {
      images[key] = await loadImage(src);
    } catch (error) {
      console.warn(error.message || error);
      images[key] = null;
    }
  }));

  ["body", "sides", "top", "binding", "head", "fretboard", "hardware", "knobs", "nut"].forEach(key => {
    if (images[key]) masks[key] = createMask(images[key]);
  });
  paths.frames.forEach((_, index) => {
    if (images[`frame${index}`]) masks[`frame${index}`] = createMask(images[`frame${index}`]);
  });
}

function createCanvas(width = canvas.width, height = canvas.height) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  return element;
}

function blankLayer() {
  return createCanvas();
}

function createMask(img) {
  const mask = createCanvas(img.width, img.height);
  const maskCtx = mask.getContext("2d", { willReadFrequently: true });
  maskCtx.drawImage(img, 0, 0);
  const data = maskCtx.getImageData(0, 0, mask.width, mask.height);

  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i];
    const g = data.data[i + 1];
    const b = data.data[i + 2];
    const distance = Math.abs(r - 178) + Math.abs(g - 178) + Math.abs(b - 178);
    data.data[i + 3] = distance < 34 ? 0 : 255;
  }

  maskCtx.putImageData(data, 0, 0);
  return mask;
}

function drawMaskedBase(targetCtx, img, mask) {
  if (!img || !mask) return;
  targetCtx.drawImage(img, 0, 0);
  targetCtx.globalCompositeOperation = "destination-in";
  targetCtx.drawImage(mask, 0, 0);
  targetCtx.globalCompositeOperation = "source-over";
}

function drawTransformedLayer(targetCtx, layer, transform = frontReferenceTransform) {
  targetCtx.save();
  targetCtx.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
  targetCtx.drawImage(layer, 0, 0);
  targetCtx.restore();
}

function solidLayer(mask, color) {
  if (!mask) return blankLayer();
  const layer = createCanvas();
  const layerCtx = layer.getContext("2d");
  layerCtx.fillStyle = resolveSolidPaintColor(color);
  layerCtx.fillRect(0, 0, layer.width, layer.height);
  applySolidPaintFinish(layerCtx, layer.width, layer.height, color);
  layerCtx.globalCompositeOperation = "destination-in";
  layerCtx.drawImage(mask, 0, 0);
  layerCtx.globalCompositeOperation = "source-over";
  return layer;
}

function resolveSolidPaintColor(color) {
  if (color === "natural") return "#d6b27a";
  if (color === "solid:candy-red") return "#b51616";
  return color;
}

function applySolidPaintFinish(context, width, height, color) {
  context.save();
  context.globalCompositeOperation = "screen";
  const shine = context.createLinearGradient(width * .12, height * .08, width * .86, height * .92);
  shine.addColorStop(0, "rgba(255,255,255,.22)");
  shine.addColorStop(.24, "rgba(255,255,255,.04)");
  shine.addColorStop(.48, "rgba(255,255,255,.16)");
  shine.addColorStop(.72, "rgba(255,255,255,.02)");
  shine.addColorStop(1, "rgba(255,255,255,.12)");
  context.fillStyle = shine;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = "overlay";
  context.globalAlpha = color === "solid:candy-red" ? .34 : .2;
  context.fillStyle = color === "solid:candy-red" ? "#ff3c2f" : "#ffffff";
  for (let x = -width; x < width * 2; x += 22) {
    context.fillRect(x, 0, 2, height);
  }
  context.restore();
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
}

function textureForWood(wood, color) {
  if (wood === "Klon falisty") return color === "natural" ? images.mapleNatural : images.mapleEnhanced;
  if (wood === "Topola czeczot") return images.poplarBurl;
  if (wood === "Mahoń") return images.mahogany;
  if (wood === "Orzech amerykański") return images.americanWalnut;
  return images.europeanWalnut;
}

function drawCoverTexture(targetCtx, texture, wood) {
  if (!texture) return;
  const rotate = wood !== "Topola czeczot";
  const cropScale = wood === "Topola czeczot" ? 1.45 : 1;
  targetCtx.save();
  targetCtx.filter = wood === "Klon falisty" ? "contrast(1.45) brightness(.68)" : wood === "Topola czeczot" ? "contrast(1.32) brightness(.82)" : wood === "Mahoń" ? "contrast(1.2) brightness(.78) saturate(1.08)" : "contrast(1.2) brightness(.75)";

  if (rotate) {
    const rotatedW = canvas.height;
    const rotatedH = canvas.width;
    const scale = Math.max(rotatedW / texture.width, rotatedH / texture.height) * cropScale;
    const drawW = texture.width * scale;
    const drawH = texture.height * scale;
    targetCtx.translate(canvas.width, 0);
    targetCtx.rotate(Math.PI / 2);
    targetCtx.drawImage(texture, (rotatedW - drawW) / 2, (rotatedH - drawH) / 2, drawW, drawH);
  } else {
    const scale = Math.max(canvas.width / texture.width, canvas.height / texture.height) * cropScale;
    const drawW = texture.width * scale;
    const drawH = texture.height * scale;
    targetCtx.drawImage(texture, (canvas.width - drawW) / 2, (canvas.height - drawH) / 2, drawW, drawH);
  }

  targetCtx.restore();
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

function applyBurstColor(context, width, height, color) {
  const burst = burstDefinition(color);
  if (!burst) return false;

  context.save();
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = .34;
  context.fillStyle = "#050505";
  context.fillRect(0, 0, width, height);

  const radial = context.createRadialGradient(width * .5, height * .5, width * .08, width * .5, height * .5, width * .62);
  radial.addColorStop(0, burst.center);
  radial.addColorStop(.48, burst.mid);
  radial.addColorStop(1, burst.edge);
  context.globalCompositeOperation = "color";
  context.globalAlpha = .98;
  context.fillStyle = radial;
  context.fillRect(0, 0, width, height);

  const edgeShade = context.createRadialGradient(width * .5, height * .5, width * .28, width * .5, height * .5, width * .68);
  edgeShade.addColorStop(0, "rgba(255,255,255,0)");
  edgeShade.addColorStop(.58, "rgba(0,0,0,.1)");
  edgeShade.addColorStop(1, "rgba(0,0,0,.72)");
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = .72;
  context.fillStyle = edgeShade;
  context.fillRect(0, 0, width, height);

  const centerLift = context.createRadialGradient(width * .5, height * .46, 0, width * .5, height * .46, width * .42);
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

function woodLayer(mask, color, wood, finish) {
  if (!mask) return blankLayer();
  if (wood === "Jednolity kolor") return solidLayer(mask, color);

  const layer = createCanvas();
  const layerCtx = layer.getContext("2d");
  const texture = textureForWood(wood, color);
  if (!texture) return solidLayer(mask, color);
  drawCoverTexture(layerCtx, texture, wood);

  if (color !== "natural") {
    const vivid = wood === "Klon falisty" || wood === "Topola czeczot";
    const burstApplied = vivid && applyBurstColor(layerCtx, layer.width, layer.height, color);
    if (burstApplied) {
      // Burst handles its own depth and color blend.
    } else {
      if (vivid) {
        layerCtx.globalCompositeOperation = "multiply";
        layerCtx.globalAlpha = wood === "Topola czeczot" ? .2 : .26;
        layerCtx.fillStyle = "#050505";
        layerCtx.fillRect(0, 0, layer.width, layer.height);
      }
      layerCtx.globalCompositeOperation = "color";
      layerCtx.globalAlpha = vivid ? .95 : .78;
      layerCtx.fillStyle = color;
      layerCtx.fillRect(0, 0, layer.width, layer.height);
      layerCtx.globalCompositeOperation = "multiply";
      layerCtx.globalAlpha = vivid ? .24 : .18;
      layerCtx.fillRect(0, 0, layer.width, layer.height);
    }
  }

  layerCtx.globalCompositeOperation = "source-over";
  if (finish === "Gloss") {
    const shine = layerCtx.createLinearGradient(0, 420, 0, 1420);
    shine.addColorStop(0, "rgba(255,255,255,.14)");
    shine.addColorStop(.42, "rgba(255,255,255,.02)");
    shine.addColorStop(.62, "rgba(0,0,0,.12)");
    shine.addColorStop(1, "rgba(255,255,255,.12)");
    layerCtx.fillStyle = shine;
    layerCtx.fillRect(0, 0, layer.width, layer.height);
  } else {
    layerCtx.globalAlpha = .16;
    layerCtx.fillStyle = "#111";
    layerCtx.fillRect(0, 0, layer.width, layer.height);
    layerCtx.globalAlpha = 1;
  }

  layerCtx.globalCompositeOperation = "destination-in";
  layerCtx.drawImage(mask, 0, 0);
  layerCtx.globalCompositeOperation = "source-over";
  return layer;
}

function tintOriginalLayer(img, mask, color, strength = .68) {
  if (!img || !mask) return blankLayer();
  const layer = createCanvas();
  const layerCtx = layer.getContext("2d");
  drawMaskedBase(layerCtx, img, mask);
  layerCtx.globalCompositeOperation = "source-atop";
  layerCtx.globalAlpha = strength;
  layerCtx.fillStyle = color;
  layerCtx.fillRect(0, 0, layer.width, layer.height);
  layerCtx.globalAlpha = 1;
  layerCtx.globalCompositeOperation = "source-over";
  return layer;
}

async function loadInventory() {
  try {
    const response = await fetch(inventoryPath, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("Nie udalo sie wczytac dostepnosci materialow:", error);
    return null;
  }
}

function applyAvailabilityForGroup(inputName, entries = {}) {
  const inputs = Array.from(form.querySelectorAll(`input[name="${inputName}"]`));
  let selectedWasDisabled = false;

  inputs.forEach(input => {
    const item = entries[input.value];
    const available = item?.available !== false;
    const label = input.closest(".choice");
    const note = item?.note || "Chwilowo niedostepne";

    input.disabled = !available;
    if (!label) return;

    label.classList.toggle("unavailable", !available);
    label.setAttribute("aria-disabled", available ? "false" : "true");
    label.querySelector(".availability-note")?.remove();

    if (!available) {
      label.insertAdjacentHTML("beforeend", `<em class="availability-note">${note}</em>`);
      if (input.checked) selectedWasDisabled = true;
    }
  });

  if (selectedWasDisabled) {
    const fallback = inputs.find(input => !input.disabled);
    if (fallback) {
      fallback.checked = true;
      form.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

function applyInventory(inventory) {
  if (!inventory?.woods) return;
  applyAvailabilityForGroup("topWood", inventory.woods.top);
  applyAvailabilityForGroup("sideWood", inventory.woods.sides);
  updateSummary();
}

function bodyBaseLayer() {
  const finish = fieldValue("bodyFinish");
  const wood = fieldValue("bodyWood");
  let color = wood === "Jesion" ? "#b28d62" : "#7b4632";
  let strength = finish === "Olejowosk" ? .22 : .34;

  if (finish === "Czarny mat") {
    color = "#0b0b0b";
    strength = .9;
  }
  if (finish === "Czarny metalik") {
    color = "#1d1f22";
    strength = .86;
  }

  const layer = tintOriginalLayer(images.body, masks.body, color, strength);
  const layerCtx = layer.getContext("2d");

  if (finish === "Czarny metalik") {
    const metal = layerCtx.createLinearGradient(0, 880, 0, 1500);
    metal.addColorStop(0, "rgba(255,255,255,.08)");
    metal.addColorStop(.55, "rgba(255,255,255,.015)");
    metal.addColorStop(1, "rgba(255,255,255,.06)");
    layerCtx.globalCompositeOperation = "source-atop";
    layerCtx.fillStyle = metal;
    layerCtx.fillRect(0, 0, layer.width, layer.height);
    layerCtx.globalCompositeOperation = "source-over";
  }

  return layer;
}

function fretboardLayer() {
  const selected = form.querySelector('[name="fretboard"]:checked');
  return tintOriginalLayer(images.fretboard, masks.fretboard, selected?.dataset.color || "#181513", .74);
}

function bindingLayer() {
  const selected = form.querySelector('[name="binding"]:checked');
  return tintOriginalLayer(images.binding, masks.binding, selected?.dataset.color || "#CEC0A4", .72);
}

function headLayer(topColor, sideColor, topWood, sideWood) {
  const mode = fieldValue("headMode");
  const finish = fieldValue("headFinish");

  if (mode === "Jak top") return woodLayer(masks.head, topColor, topWood, finish);
  if (mode === "Jak boki") return woodLayer(masks.head, sideColor, sideWood, finish);
  return tintOriginalLayer(images.head, masks.head, "#050505", .92);
}

function nutLayer() {
  const colors = {
    "Kość": "#e7dcc0",
    "Mosiądz": "#b8872f",
    "TUSQ": "#f1eee3",
    "Róg czarny": "#0b0b0b"
  };
  return tintOriginalLayer(images.nut, masks.nut, colors[fieldValue("nut")] || "#e7dcc0", .68);
}

function metalFinish(name) {
  return {
    "Chrom": { color: "#dfe5e4", strength: .58, dark: "#596062", mid: "#aeb7b7", light: "#ffffff" },
    "Nikiel": { color: "#bbb5a8", strength: .58, dark: "#635f58", mid: "#aaa59b", light: "#f1eadc" },
    "Czarny": { color: "#070707", strength: .88, dark: "#020202", mid: "#303030", light: "#777777" },
    "Złoty": { color: "#d2a23a", strength: .72, dark: "#684911", mid: "#b98520", light: "#ffd978" }
  }[name] || { color: "#dfe5e4", strength: .58, dark: "#596062", mid: "#aeb7b7", light: "#ffffff" };
}

function hardwareLayer() {
  const finish = metalFinish(fieldValue("hardwareColor"));
  const layer = tintOriginalLayer(images.hardware, masks.hardware, finish.color, finish.strength);
  const layerCtx = layer.getContext("2d");
  const shine = layerCtx.createLinearGradient(0, 1040, 0, 1540);
  shine.addColorStop(0, "rgba(255,255,255,.16)");
  shine.addColorStop(.42, "rgba(255,255,255,.02)");
  shine.addColorStop(.72, "rgba(0,0,0,.22)");
  shine.addColorStop(1, "rgba(255,255,255,.08)");
  layerCtx.globalCompositeOperation = "source-atop";
  layerCtx.fillStyle = shine;
  layerCtx.fillRect(0, 0, layer.width, layer.height);
  layerCtx.globalCompositeOperation = "source-over";
  return layer;
}

function knobsLayer() {
  const finish = metalFinish(fieldValue("knobColor"));
  return tintOriginalLayer(images.knobs, masks.knobs, finish.color, finish.strength);
}

function roundedRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function pickupPlateLayer() {
  const frame = metalFinish(fieldValue("pickupFrameColor"));
  const center = metalFinish(fieldValue("pickupCenterColor"));
  const magnet = { dark: "#687073", mid: "#9aa3a5", light: "#d3d8d9" };
  const layer = createCanvas();
  const layerCtx = layer.getContext("2d");
  const pickups = [
    { x: 541, y: 1108, width: 100, height: 42 },
    { x: 541, y: 1250, width: 100, height: 42 }
  ];

  pickups.forEach(pickup => {
    roundedRectPath(layerCtx, pickup.x, pickup.y, pickup.width, pickup.height, 6);
    const frameGradient = layerCtx.createLinearGradient(pickup.x, pickup.y, pickup.x + pickup.width, pickup.y);
    frameGradient.addColorStop(0, frame.dark);
    frameGradient.addColorStop(.5, frame.light);
    frameGradient.addColorStop(1, frame.mid);
    layerCtx.fillStyle = frameGradient;
    layerCtx.fill();

    roundedRectPath(layerCtx, pickup.x + 8, pickup.y + 7, pickup.width - 16, pickup.height - 14, 4);
    const centerGradient = layerCtx.createLinearGradient(pickup.x, pickup.y, pickup.x, pickup.y + pickup.height);
    centerGradient.addColorStop(0, center.light);
    centerGradient.addColorStop(.18, center.mid);
    centerGradient.addColorStop(1, center.dark);
    layerCtx.fillStyle = centerGradient;
    layerCtx.fill();

    layerCtx.globalAlpha = center.color === "#070707" ? .34 : .13;
    layerCtx.fillStyle = "#000";
    layerCtx.fillRect(pickup.x + 8, pickup.y + 7, pickup.width - 16, pickup.height - 14);
    layerCtx.globalAlpha = 1;

    for (let row = 0; row < 2; row += 1) {
      for (let pole = 0; pole < 6; pole += 1) {
        const cx = pickup.x + 10 + pole * 17;
        const cy = pickup.y + 10 + row * 27;
        layerCtx.beginPath();
        layerCtx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        layerCtx.fillStyle = magnet.light;
        layerCtx.fill();
        layerCtx.beginPath();
        layerCtx.arc(cx, cy, 2.4, 0, Math.PI * 2);
        layerCtx.fillStyle = magnet.mid;
        layerCtx.fill();
      }
    }
  });

  return layer;
}

function drawFrameOnly(index) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const frame = images[`frame${index}`] || images.frame0;
  const mask = masks[`frame${index}`] || masks.frame0;
  drawMaskedBase(ctx, frame, mask);
  drawReferenceBadge();
}

function drawReferenceBadge() {
  const text = "Ujęcie referencyjne. Konfiguracja materiałów jest składana na froncie.";
  ctx.save();
  ctx.fillStyle = "rgba(17, 16, 14, .72)";
  ctx.strokeStyle = "rgba(214, 168, 116, .55)";
  ctx.lineWidth = 2;
  ctx.roundRect(318, 1440, 644, 54, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e7d7bf";
  ctx.font = "600 21px Manrope, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 640, 1467);
  ctx.restore();
}

function drawConfiguredFront() {
  const topColor = document.querySelector("#topColor").value;
  const sideColor = document.querySelector("#sideColor").value;
  const topWood = fieldValue("topWood");
  const sideWood = fieldValue("sideWood");

  const model = createCanvas();
  const modelCtx = model.getContext("2d");
  modelCtx.drawImage(bodyBaseLayer(), 0, 0);
  modelCtx.drawImage(woodLayer(masks.sides, sideColor, sideWood, fieldValue("sideFinish")), 0, 0);
  modelCtx.save();
  modelCtx.shadowColor = "rgba(0,0,0,.45)";
  modelCtx.shadowBlur = 10;
  modelCtx.shadowOffsetX = 3;
  modelCtx.drawImage(woodLayer(masks.top, topColor, topWood, fieldValue("topFinish")), 0, 0);
  modelCtx.restore();
  modelCtx.drawImage(headLayer(topColor, sideColor, topWood, sideWood), 0, 0);
  modelCtx.drawImage(fretboardLayer(), 0, 0);
  modelCtx.drawImage(bindingLayer(), 0, 0);
  modelCtx.drawImage(hardwareLayer(), 0, 0);
  modelCtx.drawImage(knobsLayer(), 0, 0);
  modelCtx.drawImage(pickupPlateLayer(), 0, 0);
  modelCtx.drawImage(nutLayer(), 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.7)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 16;
  drawTransformedLayer(ctx, model);
  ctx.restore();
}

function drawCanvas(force = false) {
  if (!force && viewer3dReady && !stageWrap?.classList.contains("viewer-3d-fallback")) return;

  const degrees = Number(frameSlider.value) || 0;
  const index = Math.round(degrees / 45) % 8;
  if (index === 0) drawConfiguredFront();
  else drawFrameOnly(index);

  const zoom = 1.18 + Number(zoomSlider.value) / 160;
  canvas.style.transform = `scale(${zoom})`;
}

function updateSummary() {
  const data = new FormData(form);
  const topColor = selectedColorName(data.get("topColor"), data.get("topWood"));
  const sideColor = selectedColorName(data.get("sideColor"), data.get("sideWood"));
  const rows = [
    ["Top", `${data.get("topWood")} / ${topColor} / ${data.get("topFinish")}`],
    ["Boki", `${data.get("sideWood")} / ${sideColor} / ${data.get("sideFinish")}`],
    ["Podstrunnica", `${data.get("fretboard")} / markery ${data.get("binding")} / progi ${data.get("fretMaterial")}`],
    ["Drewno korpusu", `${data.get("bodyWood")} / ${data.get("bodyFinish")}`],
    ["Kształt bindingu", data.get("bindingShape")],
    ["Kolor bindingu i markerów", data.get("binding")],
    ["Kolor osprzętu", data.get("hardwareColor")],
    ["Kolor gałek", data.get("knobColor")],
    ["Układ elektroniki", data.get("electronicsLayout")],
    ["Główka", `${data.get("headMode")} / ${data.get("headFinish")}`],
    ["Pickupy", data.get("pickups")],
    ["Ramka pickupów", data.get("pickupFrameColor")],
    ["Środek pickupów", data.get("pickupCenterColor")],
    ["Magnesy pickupów", data.get("pickupMagnetColor")],
    ["Mostek", data.get("bridge")],
    ["Klucze", data.get("tuners")],
    ["Siodełko", data.get("nut")],
    ["Straplocki", data.get("straplocks")],
    ["Menzura / liczba progów", `${data.get("scale")} / ${data.get("fretCount")}`],
    ["Rozmiar progów", data.get("fretSize")],
    ["Modyfikacje", data.get("modifications") || "Brak"]
  ];

  document.querySelector("#summaryList").innerHTML = rows.map(([label, value]) => `<div class="summary-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
  document.querySelector("#previewTop").textContent = `${data.get("topWood")} / ${topColor}`;
  document.querySelector("#previewSides").textContent = `${data.get("sideWood")} / ${sideColor}`;
  document.querySelector("#previewHardware").textContent = data.get("hardwareColor");
}

function showToast(message, duration = 4200) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

function getSummaryItems() {
  return Array.from(document.querySelectorAll("#summaryList .summary-row")).map(row => ({
    label: row.querySelector("span")?.textContent?.trim() || "",
    value: row.querySelector("strong")?.textContent?.trim() || ""
  }));
}

function resetForm() {
  form.reset();
  document.querySelector("#topColor").value = defaults.topColor;
  document.querySelector("#sideColor").value = defaults.sideColor;
  applyPickupPreset(defaults.pickups);
  frameSlider.value = "0";
  zoomSlider.value = "0";
  renderPalettes();
  window.weirdoViewer3d?.rerender?.();
  drawCanvas();
  updateSummary();
}

function setRadioValue(name, value) {
  const input = form.querySelector(`input[name="${name}"][value="${value}"]`);
  if (!input) return;
  input.checked = true;
}

function applyHardwarePreset(value) {
  setRadioValue("knobColor", value);
  setRadioValue("pickups", "Otwarta ramka");
  setRadioValue("pickupFrameColor", value);
  setRadioValue("pickupCenterColor", "Czarny");
  setPickupCustomLocked(false);
}

function pickupPresetValues(value) {
  return {
    "Czarne bez puszek": { frame: "Czarny", center: "Czarny", locked: true },
    "W niklowych puszkach": { frame: "Nikiel", center: "Nikiel", locked: true },
    "W chromowanych puszkach": { frame: "Chrom", center: "Chrom", locked: true },
    "W złotych puszkach": { frame: "Złoty", center: "Złoty", locked: true },
    "Otwarta ramka": { frame: "Chrom", center: "Czarny", locked: false }
  }[value] || { locked: false };
}

function setPickupCustomLocked(locked) {
  document.querySelectorAll(".pickup-custom-fieldset").forEach(fieldset => {
    fieldset.classList.toggle("is-locked", locked);
    fieldset.setAttribute("aria-disabled", locked ? "true" : "false");
  });
}

function applyPickupPreset(value = fieldValue("pickups")) {
  const preset = pickupPresetValues(value);
  if (preset.frame) setRadioValue("pickupFrameColor", preset.frame);
  if (preset.center) setRadioValue("pickupCenterColor", preset.center);
  setPickupCustomLocked(preset.locked);
}

renderPalettes();
applyPickupPreset();

document.addEventListener("click", event => {
  const colorButton = event.target.closest(".finish-color");
  if (!colorButton) return;
  const input = document.querySelector(`#${colorButton.dataset.target}`);
  input.value = colorButton.dataset.color;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  window.weirdoViewer3d?.rerender?.();
  colorButton.parentElement.querySelectorAll(".finish-color").forEach(button => {
    button.classList.toggle("active", button === colorButton);
  });
  if (!viewer3dReady || stageWrap?.classList.contains("viewer-3d-fallback")) drawCanvas();
  updateSummary();
});

form.addEventListener("input", () => {
  if (!viewer3dReady || stageWrap?.classList.contains("viewer-3d-fallback")) drawCanvas();
  updateSummary();
});

form.addEventListener("change", event => {
  if (event.target?.name === "topWood" || event.target?.name === "sideWood") {
    renderPalettes();
  }
  if (event.target?.name === "hardwareColor") {
    applyHardwarePreset(event.target.value);
    window.weirdoViewer3d?.rerender?.();
  }
  if (event.target?.name === "pickups") {
    applyPickupPreset(event.target.value);
    window.weirdoViewer3d?.rerender?.();
  }
  if (!viewer3dReady || stageWrap?.classList.contains("viewer-3d-fallback")) drawCanvas();
  updateSummary();
});

frameSlider.addEventListener("input", drawCanvas);
zoomSlider.addEventListener("input", drawCanvas);
document.querySelector("#resetButton").addEventListener("click", resetForm);

window.addEventListener("weirdo:viewer3d-ready", () => {
  viewer3dReady = true;
  stageWrap?.classList.add("viewer-3d-ready");
  stageWrap?.classList.remove("viewer-3d-fallback");
  loading.hidden = true;
});

window.addEventListener("weirdo:viewer3d-failed", event => {
  stageWrap?.classList.add("viewer-3d-fallback");
  loading.hidden = true;
  drawCanvas(true);
  console.warn("PodglÄ…d 3D nie wystartowaĹ‚, pokazujÄ™ fallback 2D.", event.detail?.error);
});

window.setTimeout(() => {
  if (viewer3dReady) return;
  stageWrap?.classList.add("viewer-3d-fallback");
  loading.hidden = true;
  drawCanvas(true);
}, 8000);

form.addEventListener("submit", async event => {
  event.preventDefault();
  updateSummary();
  frameSlider.value = "0";
  drawCanvas(true);

  const submitButton = form.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Wysyłanie...";

  try {
    const payload = {
      customerName: form.elements.customerName.value,
      customerEmail: form.elements.customerEmail.value,
      website: form.elements.website.value,
      summary: getSummaryItems(),
      image: canvas.toDataURL("image/jpeg", .88)
    };

    const response = await fetch("/api/send-configuration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nie udało się wysłać konfiguracji.");
    showToast("Konfiguracja została wysłana. Skontaktujemy się w sprawie szczegółów.");
  } catch (error) {
    showToast(error.message || "Nie udało się wysłać konfiguracji.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});

Promise.all([loadImages(), loadInventory()]).then(([, inventory]) => {
  applyInventory(inventory);
  drawCanvas();
  updateSummary();
}).catch(error => {
  loading.textContent = error.message || "Nie udało się wczytać warstw wizualizacji.";
});
