(() => {
  const picker = document.querySelector("#setupPicker");
  const editor = document.querySelector(".app-shell");
  const grid = document.querySelector("#setupGrid");
  const status = document.querySelector("#setupStatus");
  const previewMode = new URLSearchParams(location.search).has("generate-setup-previews");
  let setups = [];
  let viewerPromise;
  let navigation = 0;

  function loadViewer() {
    if (viewerPromise) return viewerPromise;
    viewerPromise = new Promise((resolve, reject) => {
      window.addEventListener("weirdo:viewer3d-ready", resolve, { once: true });
      window.addEventListener("weirdo:viewer3d-failed", () => reject(new Error("Nie udało się uruchomić modelu 3D.")), { once: true });
      const script = document.createElement("script");
      script.type = "module";
      script.src = "viewer3d.bundle.js?v=20261101-maple-red-deeper";
      script.onerror = () => reject(new Error("Nie udało się pobrać podglądu. Odśwież stronę."));
      document.body.append(script);
    });
    return viewerPromise;
  }

  function showPicker() {
    navigation++;
    editor.hidden = true;
    picker.hidden = false;
    document.body.classList.add("setup-picker-open");
    window.scrollTo(0, 0);
  }

  async function enterEditor(id) {
    const setup = setups.find(item => item.id === id);
    if (id !== "blank" && !setup) {
      showPicker();
      status.textContent = "Nie znaleziono tego setupu. Wybierz model poniżej.";
      return;
    }
    const current = ++navigation;
    picker.hidden = true;
    editor.hidden = false;
    document.body.classList.remove("setup-picker-open");
    document.querySelector(".controls-panel").scrollTop = 0;
    window.scrollTo(0, 0);
    try {
      await loadViewer();
      if (current !== navigation) return;
      window.weirdoConfigurator.reset();
      if (setup) window.weirdoConfigurator.applySelections(setup.selections);
      window.dispatchEvent(new Event("resize"));
      requestAnimationFrame(() => {
        if (current !== navigation) return;
        document.querySelector(".controls-panel").scrollTop = 0;
        window.scrollTo(0, 0);
      });
    } catch (error) {
      document.querySelector("#canvasLoading").hidden = false;
      document.querySelector("#canvasLoading").textContent = error.message;
    }
  }

  function showSpecification(setup) {
    const values = setup.selections;
    const dialog = document.createElement("dialog");
    dialog.className = "setup-specification";
    dialog.setAttribute("aria-labelledby", "setupSpecTitle");
    const header = document.createElement("header");
    const title = document.createElement("h2");
    title.id = "setupSpecTitle";
    title.textContent = setup.name + " — specyfikacja";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "ghost-button";
    close.textContent = "Zamknij";
    close.addEventListener("click", () => dialog.close());
    header.append(title, close);
    dialog.append(header);
    const optionLabel = (field, value) => {
      const input = Array.from(document.querySelectorAll('#configForm input[name="' + field + '"]')).find(input => input.value === value);
      return input?.closest("label")?.querySelector("strong")?.textContent || value;
    };
    const wiringInput = Array.from(document.querySelectorAll('#configForm input[name="electronicsWiring"]')).find(input => input.value === values.electronicsWiring);
    const wiringDescription = Array.from(wiringInput?.closest("label")?.querySelectorAll("small") || []).map(item => item.textContent).join(" ");
    const groups = [
      ["Elektronika", [
        ["Układ", optionLabel("electronicsLayout", values.electronicsLayout)],
        ["Wariant", optionLabel("electronicsWiring", values.electronicsWiring)],
        ["Sterowanie", wiringDescription]
      ]],
      ["Osprzęt i pickupy", [
        ["Kolor osprzętu", values.hardwareColor], ["Kolor gałek", values.knobColor],
        ["Pickupy", values.pickups], ["Ramka", values.pickupFrameColor],
        ["Środek", values.pickupCenterColor],
        ["Grafika", values.pickupCenterColor === "Weirdo" ? values.pickupDesign || "Gładki" : null],
        ["Mostek", values.bridge], ["Klucze", values.tuners], ["Straplocki", values.straplocks]
      ]],
      ["Parametry techniczne", [
        ["Menzura", values.scale], ["Liczba progów", values.fretCount],
        ["Materiał progów", values.fretMaterial], ["Rozmiar progów", values.fretSize], ["Siodełko", values.nut]
      ]],
      ["Drewno i wykończenie", [
        ["Top", [values.topWood, selectedColorName(values.topColor, values.topWood), values.topFinish].filter(Boolean).join(" / ")],
        ["Boki", [values.sideWood, selectedColorName(values.sideColor, values.sideWood), values.sideFinish].filter(Boolean).join(" / ")],
        ["Główka", [values.headMode, values.headFinish].filter(Boolean).join(" / ")],
        ["Korpus", [values.bodyWood, values.bodyFinish].filter(Boolean).join(" / ")],
        ["Podstrunnica", values.fretboard], ["Binding", values.bindingShape],
        ["Markery", values.bindingShape === "Binding 2" ? values.bindingDots || "Czysty" : null],
        ["Marker na 12. progu", values.fretMarker === "Domyślny" ? (values.bindingDots === "Okrągłe markery" ? "3 kółka" : "Bez dodatkowego markera") : optionLabel("fretMarker", values.fretMarker)],
        ["Kolor detali", values.binding]
      ]]
    ];
    for (const [name, rows] of groups) {
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      heading.textContent = name;
      const list = document.createElement("dl");
      for (const [label, value] of rows) {
        if (!value) continue;
        const term = document.createElement("dt");
        term.textContent = label;
        const description = document.createElement("dd");
        description.textContent = value;
        list.append(term, description);
      }
      section.append(heading, list);
      dialog.append(section);
    }
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "primary-button";
    edit.textContent = "Edytuj ten setup";
    edit.addEventListener("click", () => {
      dialog.close();
      location.hash = "edit/" + setup.id;
    });
    dialog.append(edit);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();
  }

  function card(setup) {
    const article = document.createElement("article");
    article.className = "setup-card";
    const img = document.createElement("img");
    img.src = setup.thumbnail;
    img.alt = setup.id === "blank" ? "Szara gitara do własnej konfiguracji" : "Gitara " + setup.name;
    img.width = 420;
    img.height = 560;
    img.loading = "lazy";
    img.dataset.setup = setup.id;
    const title = document.createElement("h2");
    title.textContent = setup.name;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button";
    button.textContent = setup.id === "blank" ? "Zacznij od początku" : "Edytuj";
    button.setAttribute("aria-label", setup.id === "blank" ? "Zacznij od początku" : "Edytuj " + setup.name);
    button.addEventListener("click", () => { location.hash = "edit/" + setup.id; });
    const actions = document.createElement("div");
    actions.className = "setup-actions";
    actions.append(button);
    if (setup.selections) {
      const specification = document.createElement("button");
      specification.type = "button";
      specification.className = "ghost-button";
      specification.textContent = "Specyfikacja";
      specification.setAttribute("aria-label", "Specyfikacja " + setup.name);
      specification.addEventListener("click", () => showSpecification(setup));
      actions.append(specification);
    }
    article.append(img, title, actions);
    return article;
  }

  async function generatePreviews() {
    // Development-only thumbnail generation reuses one renderer, never one per card.
    document.body.classList.add("generating-setup-previews");
    editor.hidden = false;
    await loadViewer();
    for (const setup of [...setups, { id: "blank" }]) {
      window.weirdoConfigurator.reset();
      if (setup.selections) window.weirdoConfigurator.applySelections(setup.selections);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const image = new Image();
      image.src = window.weirdoViewer3d.captureImage({ frame: 0, zoom: 0, type: "image/png" });
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 420;
      canvas.height = 560;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(210, 280, 10, 210, 280, 350);
      gradient.addColorStop(0, "#494035");
      gradient.addColorStop(1, "#191816");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 420, 560);
      ctx.drawImage(image, 0, 0, 420, 560);
      const target = grid.querySelector('img[data-setup="' + setup.id + '"]');
      target.src = canvas.toDataURL("image/jpeg", .88);
      target.dataset.generated = "true";
    }
    editor.hidden = true;
    document.body.classList.remove("generating-setup-previews");
    status.textContent = "Miniatury gotowe.";
    grid.dataset.previewsReady = "true";
  }

  function route() {
    const match = location.hash.match(/^#edit\/([a-z0-9-]+)$/);
    if (match) enterEditor(match[1]);
    else showPicker();
  }
  document.querySelector("#backToSetups").addEventListener("click", () => {
    location.hash = "";
  });
  fetch("setups.json?v=20261101").then(response => {
    if (!response.ok) throw new Error("Nie udało się pobrać setupów.");
    return response.json();
  }).then(data => {
    setups = data;
    grid.replaceChildren(...setups.map(card), card({
      id: "blank", name: "Twój własny model", thumbnail: "assets/setups/blank.jpg"
    }));
    status.textContent = "";
    window.addEventListener("hashchange", route);
    if (previewMode) return generatePreviews();
    route();
  }).catch(error => {
    status.textContent = error.message + " Możesz zacząć od początku.";
    grid.replaceChildren(card({ id: "blank", name: "Twój własny model", thumbnail: "assets/setups/blank.jpg" }));
    window.addEventListener("hashchange", route);
    route();
  });
})();
