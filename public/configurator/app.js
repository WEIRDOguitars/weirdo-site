const tabs = ["body", "neck", "electronics", "hardware", "extras", "summary"];
let activeTab = 0;

const defaults = {
  bodyWood: "Mahoń sapeli", bodyFinish: "Olejowosk", topWood: "Klon falisty", topColor: "#d6a824",
  sideWood: "Jednolity kolor", sideColor: "#101010", finish: "Gloss",
  binding: "Perłowy", head: "Czarna", fretboard: "Heban", fretMaterial: "Stal nierdzewna",
  fretSize: "Do ustalenia", bridge: "Tune-o-matic Gotoh", hardwareColor: "Chrom",
  tuners: "Do ustalenia", nut: "Kość", straplocks: "Dunlop Flushmount", pickups: "Czarne bez puszek"
};

const bindingOptions = [
  ["Perłowy", "#ddd8ca", true], ["Silver dust", "#929699"], ["Czerwony", "#9d4542"],
  ["Zielony", "#4d8062"], ["Fioletowy", "#716087"], ["Żółty", "#b89d55"], ["Ciemny szary", "#4d4d4d"]
];

const finishColors = [
  ["Bez barwnika", "natural"],
  ["Zielony jasny", "#6f9f55"], ["Zielony ciemny", "#24563b"], ["Żółty", "#d6a824"],
  ["Pomarańczowy jasny", "#d9782d"], ["Pomarańczowy ciemny", "#9b451d"], ["Czerwony", "#8f241e"],
  ["Fioletowy", "#633f76"], ["Niebieski", "#24588f"], ["Szary", "#66686b"], ["Czarny", "#101010"]
];

const form = document.querySelector("#configForm");
const canvas = document.querySelector("#guitarCanvas");
const ctx = canvas.getContext("2d");
const loading = document.querySelector("#canvasLoading");
const imagePaths = {
  body: "/configurator/elementy/body.png", sides: "/configurator/elementy/Boki/boki.png", top: "/configurator/elementy/top.png",
  binding: "/configurator/elementy/binding 1.png", neck: "/configurator/elementy/gryf.png", head: "/configurator/elementy/Head.png",
  fretboard: "/configurator/elementy/Podstrunnica/Podstrunnica.PNG", frets: "/configurator/elementy/progi/progi1.png",
  flameMaple: "/configurator/assets/textures/flame-maple.png", poplarBurl: "/configurator/assets/textures/poplar-burl.png",
  europeanWalnut: "/configurator/assets/textures/european-walnut.png", americanWalnut: "/configurator/assets/textures/american-walnut.png",
  mapleNatural: "/configurator/drewno/klon bezbarwny.png", mapleEnhanced: "/configurator/drewno/klon podbity.png",
  poplarBurlCustom: "/configurator/drewno/czeczot.png"
};
const images = {};

document.querySelector("#bindingChoices").innerHTML = bindingOptions.map(([name, color, recommended]) => `
  <label class="swatch-label" title="${recommended ? "Rekomendowane" : name}">
    <input type="radio" name="binding" value="${name}" data-color="${color}" ${recommended ? "checked" : ""}>
    <span class="color-dot" style="background:${color}"></span><span>${name}</span>
  </label>`).join("");

function renderFinishColors(containerId, inputId, selectedColor) {
  document.querySelector(containerId).innerHTML = finishColors.map(([name, color]) => `
    <button class="finish-color${color === selectedColor ? " active" : ""}" type="button" data-target="${inputId}" data-color="${color}" aria-label="${name}" title="${name}">
      <span class="${color === "natural" ? "natural-color" : ""}"${color === "natural" ? "" : ` style="background:${color}"`}></span><small>${name}</small>
    </button>`).join("");
}

renderFinishColors("#topColorChoices", "topColor", defaults.topColor);
renderFinishColors("#sideColorChoices", "sideColor", defaults.sideColor);

function loadImages() {
  return Promise.all(Object.entries(imagePaths).map(([key, src]) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images[key] = img; resolve(); };
    img.onerror = reject;
    img.src = src;
  })));
}

function fieldValue(name) {
  const checked = form.querySelector(`[name="${name}"]:checked`);
  return checked ? checked.value : form.elements[name]?.value || "";
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [parseInt(value.slice(0,2),16), parseInt(value.slice(2,4),16), parseInt(value.slice(4,6),16)];
}

function tintedLayer(img, color, strength = 0.8) {
  const layer = document.createElement("canvas");
  layer.width = canvas.width; layer.height = canvas.height;
  const layerCtx = layer.getContext("2d");
  layerCtx.drawImage(img, 0, 0);
  layerCtx.globalCompositeOperation = "source-atop";
  layerCtx.globalAlpha = strength;
  layerCtx.fillStyle = color;
  layerCtx.fillRect(0, 0, layer.width, layer.height);
  layerCtx.globalCompositeOperation = "multiply";
  layerCtx.globalAlpha = .32;
  layerCtx.drawImage(img, 0, 0);
  return layer;
}

function topSeparationLayer(img) {
  const layer = document.createElement("canvas");
  layer.width = canvas.width; layer.height = canvas.height;
  const layerCtx = layer.getContext("2d");
  const offsets = [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,-1],[-1,1],[1,1]];

  offsets.forEach(([x, y]) => layerCtx.drawImage(img, x, y));
  layerCtx.globalCompositeOperation = "source-in";
  layerCtx.fillStyle = "rgba(10,8,6,.68)";
  layerCtx.fillRect(0, 0, layer.width, layer.height);
  layerCtx.globalCompositeOperation = "destination-out";
  layerCtx.drawImage(img, 0, 0);
  return layer;
}

function woodLayer(img, color, wood, finish = "Mat") {
  const layer = document.createElement("canvas");
  layer.width = canvas.width; layer.height = canvas.height;
  const layerCtx = layer.getContext("2d");
  const solid = wood === "Jednolity kolor";

  const textureMap = {
    "Klon falisty": images.flameMaple,
    "Topola czeczot": images.poplarBurl,
    "Orzech włoski": images.europeanWalnut,
    "Orzech amerykański": images.americanWalnut
  };

  if (solid) {
    layerCtx.fillStyle = color === "natural" ? "#171717" : color;
    layerCtx.fillRect(0, 0, layer.width, layer.height);
  } else {
    const texture = wood === "Klon falisty"
      ? (color === "natural" ? images.mapleNatural : images.mapleEnhanced)
      : wood === "Topola czeczot"
        ? images.poplarBurlCustom
        : (textureMap[wood] || images.flameMaple);
    const vividWood = wood === "Klon falisty" || wood === "Topola czeczot";
    if (vividWood) layerCtx.filter = "contrast(1.32) brightness(.78)";
    const rotateTexture = wood === "Klon falisty" || wood === "Orzech włoski" || wood === "Orzech amerykański";
    if (wood === "Klon falisty") {
      const sourceX = Math.round(texture.width * .072);
      const sourceY = Math.round(texture.height * .02);
      const sourceWidth = Math.round(texture.width * .858);
      const sourceHeight = Math.round(texture.height * .956);
      const rotatedWidth = layer.height;
      const rotatedHeight = layer.width;
      const scale = Math.max(rotatedWidth / sourceWidth, rotatedHeight / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      layerCtx.save();
      layerCtx.translate(layer.width, 0);
      layerCtx.rotate(Math.PI / 2);
      layerCtx.drawImage(
        texture,
        sourceX, sourceY, sourceWidth, sourceHeight,
        (rotatedWidth - drawWidth) / 2, (rotatedHeight - drawHeight) / 2,
        drawWidth, drawHeight
      );
      layerCtx.restore();
    } else if (wood === "Topola czeczot") {
      const sourceX = Math.round(texture.width * .12);
      const sourceY = Math.round(texture.height * .05);
      const sourceWidth = Math.round(texture.width * .76);
      const sourceHeight = Math.round(texture.height * .9);
      const scale = Math.max(layer.width / sourceWidth, layer.height / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      layerCtx.drawImage(
        texture,
        sourceX, sourceY, sourceWidth, sourceHeight,
        (layer.width - drawWidth) / 2, (layer.height - drawHeight) / 2,
        drawWidth, drawHeight
      );
    } else if (rotateTexture) {
      const targetWidth = 1040;
      const targetHeight = texture.width * (targetWidth / texture.height);
      layerCtx.save();
      layerCtx.translate(layer.width, 0);
      layerCtx.rotate(Math.PI / 2);
      for (let y = -layer.width; y < layer.height + layer.width; y += targetHeight) {
        for (let x = 0; x < layer.width; x += targetWidth) {
          layerCtx.drawImage(texture, y, x, targetHeight, targetWidth);
        }
      }
      layerCtx.restore();
    } else {
      const targetHeight = layer.height;
      const targetWidth = texture.width * (targetHeight / texture.height);
      for (let x = 0; x < layer.width; x += targetWidth) {
        layerCtx.drawImage(texture, x, 0, targetWidth, targetHeight);
      }
    }
    layerCtx.filter = "none";
    if (color !== "natural") {
      layerCtx.globalCompositeOperation = "color";
      layerCtx.globalAlpha = vividWood ? 1 : .9;
      layerCtx.fillStyle = color;
      layerCtx.fillRect(0, 0, layer.width, layer.height);
      if (vividWood) {
        layerCtx.globalCompositeOperation = "source-over";
        layerCtx.globalAlpha = .38;
        layerCtx.fillStyle = color;
        layerCtx.fillRect(0, 0, layer.width, layer.height);
      }
      layerCtx.globalCompositeOperation = "multiply";
      layerCtx.globalAlpha = vividWood ? .34 : .28;
      layerCtx.fillStyle = color;
      layerCtx.fillRect(0, 0, layer.width, layer.height);
    }
  }

  layerCtx.globalCompositeOperation = "source-over";
  if (finish === "Gloss") {
    const shine = layerCtx.createLinearGradient(0, 100, 0, 620);
    shine.addColorStop(0, "rgba(255,255,255,.12)");
    shine.addColorStop(.28, "rgba(255,255,255,.025)");
    shine.addColorStop(.62, "rgba(0,0,0,.06)");
    shine.addColorStop(1, "rgba(255,255,255,.08)");
    layerCtx.globalAlpha = 1;
    layerCtx.fillStyle = shine;
    layerCtx.fillRect(0, 0, layer.width, layer.height);
  }

  layerCtx.globalAlpha = 1;
  layerCtx.globalCompositeOperation = "destination-in";
  layerCtx.drawImage(img, 0, 0);
  return layer;
}

function drawFrets() {
  const fretPositions = [752, 771, 793, 818, 845, 875, 906, 940, 977, 1016, 1059, 1105, 1154, 1208, 1266, 1330, 1400, 1477];
  ctx.save();
  fretPositions.forEach((x, index) => {
    const progress = index / (fretPositions.length - 1);
    const top = 321 + progress * 8;
    const bottom = 410 - progress * 9;
    const gradient = ctx.createLinearGradient(x - 2, 0, x + 2, 0);
    gradient.addColorStop(0, "rgba(80,80,78,.8)");
    gradient.addColorStop(.45, "rgba(245,241,224,.95)");
    gradient.addColorStop(1, "rgba(92,91,87,.85)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = fieldValue("fretMaterial") === "Stal nierdzewna" ? 3 : 2.4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  });
  ctx.restore();
}

function drawFretLayer() {
  // Odniesienie służy tylko do relacji progów względem korpusu.
  const referenceBounds = { x: 318, y: 114, width: 607, height: 455 };
  const guitarBounds = { x: 197, y: 100, width: 703, height: 527 };
  const scaleX = guitarBounds.width / referenceBounds.width;
  const scaleY = guitarBounds.height / referenceBounds.height;
  const offsetX = guitarBounds.x - referenceBounds.x * scaleX;
  const offsetY = guitarBounds.y - referenceBounds.y * scaleY;

  ctx.save();
  ctx.setTransform(scaleX, 0, 0, scaleY, offsetX, offsetY);
  ctx.drawImage(images.frets, 0, 0);
  ctx.restore();
}

function roundedRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawPickup(x, y, width, height, variant) {
  ctx.save();
  if (variant === "Czarne bez puszek" || variant === "Chromowana ramka z czarnym środkiem") {
    if (variant === "Chromowana ramka z czarnym środkiem") {
      roundedRectPath(ctx, x, y, width, height, 7);
      const frame = ctx.createLinearGradient(x, y, x + width, y);
      frame.addColorStop(0, "#5e6466"); frame.addColorStop(.5, "#edf1f0"); frame.addColorStop(1, "#6f7476");
      ctx.fillStyle = frame; ctx.fill();
      roundedRectPath(ctx, x + 5, y + 5, width - 10, height - 10, 5);
      ctx.fillStyle = "#080808"; ctx.fill();
    }
    const gap = 4;
    const inset = variant === "Chromowana ramka z czarnym środkiem" ? 8 : 0;
    const coilY = y + inset;
    const coilHeight = height - inset * 2;
    const coilWidth = (width - inset * 2 - gap) / 2;
    [x + inset, x + inset + coilWidth + gap].forEach((coilX, coilIndex) => {
      roundedRectPath(ctx, coilX, coilY, coilWidth, coilHeight, 7);
      const coilGradient = ctx.createLinearGradient(coilX, y, coilX + coilWidth, y);
      coilGradient.addColorStop(0, "#050505");
      coilGradient.addColorStop(.5, "#242424");
      coilGradient.addColorStop(1, "#070707");
      ctx.fillStyle = coilGradient;
      ctx.fill();
      ctx.strokeStyle = variant === "Chromowana ramka z czarnym środkiem" ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.12)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      for (let pole = 0; pole < 6; pole += 1) {
        const poleY = coilY + 12 + pole * ((coilHeight - 24) / 5);
        ctx.beginPath();
        ctx.arc(coilX + coilWidth / 2, poleY, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = coilIndex === 0 ? "#b9b8b2" : "#55534f";
        ctx.fill();
      }
    });
  } else {
    const palette = variant.includes("złotych")
      ? ["#8b6418", "#f0cc68", "#a9781d"]
      : variant.includes("niklowych")
        ? ["#666b6d", "#e8eceb", "#777c7e"]
        : ["#060606", "#343434", "#080808"];
    roundedRectPath(ctx, x, y, width, height, 6);
    const cover = ctx.createLinearGradient(x, y, x + width, y);
    cover.addColorStop(0, palette[0]); cover.addColorStop(.5, palette[1]); cover.addColorStop(1, palette[2]);
    ctx.fillStyle = cover;
    ctx.fill();
    ctx.strokeStyle = variant.includes("czarnych") ? "#555" : "rgba(255,255,255,.48)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (let pole = 0; pole < 6; pole += 1) {
      const poleY = y + 12 + pole * ((height - 24) / 5);
      ctx.beginPath();
      ctx.arc(x + width * .58, poleY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = variant.includes("czarnych") ? "#777" : "#55524c";
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPickups() {
  const variant = fieldValue("pickups");
  drawPickup(571, 303, 65, 124, variant);
  drawPickup(715, 304, 64, 122, variant);
}

function hardwarePalette() {
  const color = fieldValue("hardwareColor");
  if (color === "Złoty") return ["#735112", "#f0cf70", "#9d701d"];
  if (color === "Czarny") return ["#050505", "#3a3a3a", "#090909"];
  if (color === "Satynowy nikiel") return ["#696b68", "#babbb5", "#747570"];
  return ["#5c6265", "#f1f4f3", "#747a7c"];
}

function drawGotohBridge() {
  if (fieldValue("bridge") !== "Tune-o-matic Gotoh") return;
  const [dark, light, mid] = hardwarePalette();
  const x = 519, y = 301, width = 40, height = 136;
  ctx.save();
  roundedRectPath(ctx, x, y + 8, width, height - 16, 12);
  const metal = ctx.createLinearGradient(x, y, x + width, y);
  metal.addColorStop(0, dark); metal.addColorStop(.45, light); metal.addColorStop(1, mid);
  ctx.fillStyle = metal; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.42)"; ctx.lineWidth = 1.5; ctx.stroke();
  [y + 8, y + height - 8].forEach(postY => {
    ctx.beginPath(); ctx.arc(x + width / 2, postY, 9, 0, Math.PI * 2);
    ctx.fillStyle = metal; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + width / 2, postY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = dark; ctx.fill();
  });
  for (let string = 0; string < 6; string += 1) {
    const saddleY = y + 28 + string * 16;
    ctx.fillStyle = string % 2 ? mid : light;
    ctx.fillRect(x + 8, saddleY, width - 16, 9);
    ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.strokeRect(x + 8, saddleY, width - 16, 9);
    ctx.beginPath(); ctx.arc(x + width / 2, saddleY + 4.5, 2, 0, Math.PI * 2);
    ctx.fillStyle = dark; ctx.fill();
  }
  ctx.restore();
}

function drawCanvas() {
  if (!images.body) return;
  const topColor = document.querySelector("#topColor").value;
  const sideColor = document.querySelector("#sideColor").value;
  const finish = fieldValue("finish");
  const topWood = fieldValue("topWood");
  const sideWood = fieldValue("sideWood");
  const bodyFinish = fieldValue("bodyFinish");
  const bindingInput = form.querySelector('[name="binding"]:checked');
  const fretboardInput = form.querySelector('[name="fretboard"]:checked');
  const headInput = form.querySelector('[name="head"]:checked');
  const headColor = headInput.dataset.color === "match" ? topColor : headInput.dataset.color;
  let bodyColor = fieldValue("bodyWood") === "Jesion" ? "#a78661" : "#6b372a";
  let bodyStrength = bodyFinish === "Olejowosk" ? .28 : .42;
  if (bodyFinish === "Czarny mat") { bodyColor = "#121212"; bodyStrength = .9; }
  if (bodyFinish === "Czarny metalik") { bodyColor = "#242528"; bodyStrength = .88; }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tintedLayer(images.body, bodyColor, bodyStrength), 0, 0);
  ctx.drawImage(woodLayer(images.sides, sideColor, sideWood, finish), 0, 0);
  drawPickups();
  drawGotohBridge();
  const topLayer = woodLayer(images.top, topColor, topWood, finish);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.72)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.drawImage(topLayer, 0, 0);
  ctx.restore();
  ctx.drawImage(topSeparationLayer(images.top), 0, 0);
  ctx.drawImage(topLayer, 0, 0);
  ctx.drawImage(images.neck, 0, 0);
  ctx.drawImage(tintedLayer(images.fretboard, fretboardInput.dataset.color, .62), 0, 0);
  drawFretLayer();
  ctx.drawImage(headInput.dataset.color === "match" ? woodLayer(images.head, headColor, topWood, finish) : woodLayer(images.head, headColor, "Jednolity kolor", finish), 0, 0);
  ctx.drawImage(tintedLayer(images.binding, bindingInput.dataset.color, .58), 0, 0);

  canvas.style.filter = "drop-shadow(0 22px 30px #0009)";
}

function updateSummary() {
  const data = new FormData(form);
  const colorName = value => finishColors.find(([, color]) => color === value)?.[0] || value;
  const items = [
    ["Korpus", data.get("bodyWood")], ["Wykończenie korpusu", data.get("bodyFinish")],
    ["Top", data.get("topWood")], ["Kolor topu", colorName(data.get("topColor"))], ["Boki", data.get("sideWood")],
    ["Kolor boków", colorName(data.get("sideColor"))], ["Wykończenie topu, boków i główki", data.get("finish")],
    ["Binding", data.get("binding")], ["Główka", data.get("head")],
    ["Podstrunnica", data.get("fretboard")], ["Markery", data.get("markers")], ["Menzura / progi", `${data.get("scale")} / ${data.get("fretCount")}`],
    ["Materiał progów", data.get("fretMaterial")], ["Rozmiar progów", data.get("fretSize")],
    ["Elektronika", data.get("electronicsLayout")], ["Pickupy", data.get("pickups")], ["Mostek", data.get("bridge")],
    ["Kolor osprzętu", data.get("hardwareColor")], ["Klucze", data.get("tuners")], ["Siodełko", data.get("nut")],
    ["Straplocki", data.get("straplocks")], ["Modyfikacje", data.get("modifications") || "Brak"]
  ];
  document.querySelector("#summaryList").innerHTML = items.map(([label, value]) => `<div class="summary-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
  document.querySelector("#previewFinish").textContent = data.get("finish");
  document.querySelector("#previewTop").textContent = data.get("topWood");
}

function setTab(index) {
  activeTab = Math.max(0, Math.min(tabs.length - 1, index));
  document.querySelectorAll(".tab").forEach((tab, i) => tab.classList.toggle("active", i === activeTab));
  document.querySelectorAll(".tab-panel").forEach((panel, i) => panel.classList.toggle("active", i === activeTab));
  const stepCount = document.querySelector(".step-count");
  if (stepCount) stepCount.textContent = `${String(activeTab + 1).padStart(2,"0")} / 06`;
  document.querySelector("#prevButton").classList.toggle("hidden", activeTab === 0);
  document.querySelector("#nextButton").classList.toggle("hidden", activeTab === tabs.length - 1);
  if (tabs[activeTab] === "summary") updateSummary();
  if (window.innerWidth < 1050) document.querySelector(".controls-panel").scrollIntoView({behavior:"smooth"});
}

function resetForm() {
  form.reset();
  document.querySelector("#topColor").value = defaults.topColor;
  document.querySelector("#sideColor").value = defaults.sideColor;
  renderFinishColors("#topColorChoices", "topColor", defaults.topColor);
  renderFinishColors("#sideColorChoices", "sideColor", defaults.sideColor);
  drawCanvas(); updateSummary(); setTab(0);
}

form.addEventListener("input", () => {
  drawCanvas(); updateSummary();
});
document.addEventListener("click", event => {
  const colorButton = event.target.closest(".finish-color");
  if (!colorButton) return;
  const input = document.querySelector(`#${colorButton.dataset.target}`);
  input.value = colorButton.dataset.color;
  colorButton.parentElement.querySelectorAll(".finish-color").forEach(button => button.classList.toggle("active", button === colorButton));
  drawCanvas(); updateSummary();
});
form.addEventListener("change", () => { drawCanvas(); updateSummary(); });
form.addEventListener("submit", event => {
  event.preventDefault();
  const toast = document.querySelector("#toast");
  toast.textContent = "Konfiguracja jest gotowa do podłączenia pod formularz strony Weirdo.";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
});
document.querySelectorAll(".tab").forEach((tab, index) => tab.addEventListener("click", () => setTab(index)));
document.querySelector("#nextButton").addEventListener("click", () => setTab(activeTab + 1));
document.querySelector("#prevButton").addEventListener("click", () => setTab(activeTab - 1));
document.querySelector("#resetButton").addEventListener("click", resetForm);

loadImages().then(() => {
  loading.hidden = true;
  drawCanvas(); updateSummary();
}).catch(() => { loading.textContent = "Nie udało się wczytać warstw wizualizacji."; });
