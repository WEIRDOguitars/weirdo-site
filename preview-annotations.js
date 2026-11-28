(() => {
  const stage = document.querySelector(".stage-wrap");
  const controls = document.querySelector(".viewer-controls");
  const overlay = document.createElement("div");
  overlay.className = "preview-annotations";
  overlay.hidden = true;
  overlay.setAttribute("aria-label", "Detale gitary");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  overlay.append(svg);
  stage.append(overlay);
  const labels = { head: "Główka", nut: "Siodełko", fretboard: "Podstrunnica", top: "Top", sides: "Boki", electronics: "Elektronika", body: "Korpus", tuners: "Osprzęt", jack: "Osprzęt", pickups: "Pickupy", "binding-color": "Kolor bindingu", "binding-type": "Rodzaj bindingu" };
  const mobile = matchMedia("(max-width: 720px)");
  const toggle = document.querySelector("#showPreviewDescriptions");
  toggle.checked = !mobile.matches;
  const visibilityButton = document.createElement("button");
  visibilityButton.type = "button";
  visibilityButton.className = "annotation-visibility-toggle";
  stage.append(visibilityButton);
  const technicalButton = document.createElement("button");
  technicalButton.type = "button";
  technicalButton.className = "annotation-visibility-toggle annotation-technical-button";
  technicalButton.textContent = "Parametry techniczne";
  technicalButton.addEventListener("pointerdown", event => event.stopPropagation());
  technicalButton.addEventListener("click", event => {
    event.stopPropagation();
    jumpToSection("technical");
  });
  stage.append(technicalButton);
  function updateToggle() {
    visibilityButton.textContent = toggle.checked ? "Ukryj odnośniki" : "Pokaż odnośniki";
    visibilityButton.setAttribute("aria-pressed", String(toggle.checked));
  }
  updateToggle();
  visibilityButton.addEventListener("pointerdown", event => event.stopPropagation());
  visibilityButton.addEventListener("click", event => {
    event.stopPropagation();
    toggle.checked = !toggle.checked;
    updateToggle();
    moving();
  });
  const pointers = new Set();
  let ready = false;
  let deadline = 0;
  let timer;

  function jumpToSection(id) {
    if (id === "tuners" || id === "jack") id = "hardware";
    const section = document.getElementById("section-" + id);
    const heading = section?.querySelector("h2, legend");
    if (!heading) return;
    let scroller = section.parentElement;
    while (scroller && scroller !== document.body) {
      if (/(auto|scroll)/.test(getComputedStyle(scroller).overflowY) && scroller.scrollHeight > scroller.clientHeight) break;
      scroller = scroller.parentElement;
    }
    const topbar = document.querySelector(".form-topline");
    const barHeight = topbar.getBoundingClientRect().height;
    const offset = mobile.matches ? controls.getBoundingClientRect().bottom + barHeight + 12
      : innerWidth <= 899 ? document.querySelector(".preview-panel").getBoundingClientRect().height + barHeight + 12
      : barHeight + 12;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    if (scroller && scroller !== document.body) {
      scroller.scrollTo({ top: scroller.scrollTop + heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top - barHeight - 12, behavior });
    } else {
      window.scrollTo({ top: Math.max(0, scrollY + heading.getBoundingClientRect().top - offset), behavior });
    }
  }

  document.querySelectorAll("[data-section-target]").forEach(button => {
    button.addEventListener("click", () => jumpToSection(button.dataset.sectionTarget));
  });
  const buttons = {};
  for (const [id, label] of Object.entries(labels)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "annotation-label";
    button.textContent = label;
    button.setAttribute("aria-label", "Zmień: " + label);
    button.dataset.sectionTarget = id;
    button.addEventListener("pointerdown", event => event.stopPropagation());
    button.addEventListener("click", event => { event.stopPropagation(); jumpToSection(id); });
    overlay.append(button);
    buttons[id] = button;
  }

  function segmentsIntersect(a, b, c, d) {
    const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    if (Math.max(a.x, b.x) < Math.min(c.x, d.x) - .01 || Math.max(c.x, d.x) < Math.min(a.x, b.x) - .01
      || Math.max(a.y, b.y) < Math.min(c.y, d.y) - .01 || Math.max(c.y, d.y) < Math.min(a.y, b.y) - .01) return false;
    return cross(a, b, c) * cross(a, b, d) <= .01 && cross(c, d, a) * cross(c, d, b) <= .01;
  }
  function pathsIntersect(first, second) {
    return first.slice(1).some((end, i) => second.slice(1).some((otherEnd, j) => segmentsIntersect(first[i], end, second[j], otherEnd)));
  }
  function pathHitsBox(path, box) {
    const corners = [
      { x: box.left - 3, y: box.top - 3 }, { x: box.right + 3, y: box.top - 3 },
      { x: box.right + 3, y: box.bottom + 3 }, { x: box.left - 3, y: box.bottom + 3 }
    ];
    return path.some(p => p.x >= corners[0].x && p.x <= corners[1].x && p.y >= corners[0].y && p.y <= corners[2].y)
      || pathsIntersect(path, [...corners, corners[0]]);
  }
  function hide() { overlay.hidden = true; }
  function moving() {
    hide();
    deadline = performance.now() + 500;
    clearTimeout(timer);
    timer = setTimeout(show, 510);
  }
  function show() {
    clearTimeout(timer);
    if (performance.now() < deadline) { timer = setTimeout(show, deadline - performance.now() + 10); return; }
    overlay.dataset.waitReason = !ready ? "loading" : pointers.size ? "pointer" : !toggle.checked ? "disabled" : "layout";
    if (!ready || pointers.size || !toggle.checked
      || document.querySelector(".app-shell").hidden || stage.clientWidth < 280) { hide(); return; }
    const data = window.weirdoViewer3d?.annotationAnchors?.();
    if (!data) { overlay.dataset.waitReason = "frame"; hide(); timer = setTimeout(show, 100); return; }
    overlay.dataset.waitReason = "none";
    overlay.dataset.anchors = data.map(anchor => anchor.id).join(" ");
    svg.replaceChildren();
    Object.values(buttons).forEach(button => { button.hidden = true; });
    overlay.hidden = false;
    const width = stage.clientWidth, height = stage.clientHeight;
    const occupied = [];
    const protectedAreas = (data.protectedAreas || []).map(box => ({ left: box.left * width - 6, right: box.right * width + 6, top: box.top * height - 6, bottom: box.bottom * height + 6 }));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const ordered = [...data].sort((a, b) => a.y - b.y);
    for (const anchor of ordered) {
      const button = buttons[anchor.id];
      button.hidden = false;
      const w = button.offsetWidth, h = button.offsetHeight;
      const px = anchor.x * width, py = anchor.y * height;
      const side = anchor.side === "left" && px > w + 36 ? "left"
        : anchor.side === "right" && px < width - w - 36 ? "right"
        : px > width / 2 ? "left" : "right";
      const x = side === "left" ? 8 : width - w - 8;
      const edge = side === "left" ? x + w : x;
      const elbow = side === "left" ? edge + 10 : edge - 10;
      const paths = new Map();
      const pathAt = y => {
        if (!paths.has(y)) {
          const point = anchor.nearest?.(edge, y + h / 2, width, height) || { x: px, y: py };
          paths.set(y, [point, { x: elbow, y: y + h / 2 }, { x: edge, y: y + h / 2 }]);
        }
        return paths.get(y);
      };
      if (Math.abs(edge - px) < 18 || px < 8 || px > width - 8 || py < 8 || py > height - 8) { button.hidden = true; continue; }
      const preferredY = Math.max(8, Math.min(height - h - 8, py - h / 2));
      const y = [0, 1, -1, 2, -2].map(step => preferredY + step * (h + 8)).find(candidate =>
        candidate >= 44 && candidate + h <= height - 8 && Math.abs(candidate + h / 2 - py) <= 75
        && !protectedAreas.some(box => x < box.right && x + w > box.left && candidate < box.bottom && candidate + h > box.top)
        && !occupied.some(box => x < box.right + 8 && x + w + 8 > box.left && candidate < box.bottom + 8 && candidate + h + 8 > box.top)
        && !occupied.some(box =>
          (box.side === side && candidate + h / 2 <= (box.top + box.bottom) / 2)
          || pathsIntersect(pathAt(candidate), box.path)
          || pathHitsBox(pathAt(candidate), box)
          || pathHitsBox(box.path, { left: x, right: x + w, top: candidate, bottom: candidate + h })));
      if (y === undefined) { button.hidden = true; continue; }
      occupied.push({ left: x, right: x + w, top: y, bottom: y + h, side, path: pathAt(y) });
      button.style.left = x + "px";
      button.style.top = y + "px";
      const line = document.createElementNS(svg.namespaceURI, "polyline");
      const path = pathAt(y);
      line.setAttribute("points", path.map(point => `${point.x},${point.y}`).join(" "));
      const dot = document.createElementNS(svg.namespaceURI, "circle");
      dot.setAttribute("cx", path[0].x); dot.setAttribute("cy", path[0].y); dot.setAttribute("r", "2.5");
      svg.append(line, dot);
    }
  }
  stage.addEventListener("pointerdown", event => {
    if (event.target.closest("button, input, select, label")) return;
    pointers.add(event.pointerId); moving();
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) window.addEventListener(name, event => {
    if (pointers.delete(event.pointerId)) moving();
  }, true);
  window.addEventListener("pointermove", event => {
    if (event.pointerType !== "touch" && event.buttons === 0 && pointers.delete(event.pointerId)) moving();
  }, true);
  window.addEventListener("blur", () => { pointers.clear(); moving(); });
  stage.addEventListener("wheel", moving, { passive: true, capture: true });
  for (const slider of document.querySelectorAll("#frameSlider, #zoomSlider")) {
    slider.addEventListener("pointerdown", moving);
    slider.addEventListener("input", moving);
  }
  window.addEventListener("weirdo:preview-moving", moving);
  window.addEventListener("weirdo:preview-rendered", () => {
    clearTimeout(timer);
    timer = setTimeout(show, Math.max(0, deadline - performance.now()) + 10);
  });
  window.addEventListener("weirdo:viewer3d-ready", () => { ready = true; moving(); });
  window.addEventListener("weirdo:viewer3d-failed", () => { ready = false; hide(); });
  document.querySelector("#configForm").addEventListener("change", moving);
  toggle.addEventListener("change", () => { updateToggle(); moving(); });
  mobile.addEventListener("change", moving);
  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--preview-controls-height", controls.getBoundingClientRect().height + "px");
    moving();
  }).observe(controls);
  new ResizeObserver(moving).observe(stage);
  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--pinned-preview-height", document.querySelector(".preview-panel").getBoundingClientRect().height + "px");
  }).observe(document.querySelector(".preview-panel"));
})();
