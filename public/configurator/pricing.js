/* Shared by the static configurator and the submission backend. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./materials.inventory.json"));
  else root.WeirdoPricing = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function (inventory) {
  "use strict";
  inventory = inventory || {};
  const tuningGauges = {
    E: ["9-42", "9-46", "10-46", "10-52"],
    "Drop D": ["9-46", "10-46", "10-52"],
    D: ["10-46", "10-52", "11-46"],
    "Drop C": ["10-52", "11-56", "12-60"]
  };
  const tuningBase = { E: "E", Eb: "E", D: "D", Db: "D", C: "C", B: "B", Bb: "B", A: "A", "Drop D": "Drop D", "Drop Db": "Drop D", "Drop C": "Drop C", "Drop B": "Drop B", "Drop Bb": "Drop B", "Drop A": "Drop A" };
  const catalog = {
    version: "2026-11-27.1",
    currency: "PLN",
    basePrice: 12500,
    fields: {
      electronicsLayout: { label: "Układ elektroniki", default: "Układ 1: 4 gałki + 2 switche", values: { "Układ 1: 4 gałki + 2 switche": 0, "Układ 2: 1 pickup + 1 volume": 0 } },
      electronicsWiring: { label: "Elektronika", default: "Standard Weirdo", values: { "Standard Weirdo": 0, "Opcja 2": 0 } },
      singlePickupWiring: { label: "Elektronika", default: "Lauder", values: { Killer: -400, Lauder: -600 } },
      topWood: { label: "Top", default: "Klon falisty", values: { "Klon falisty": 0, "Topola czeczot": 0, "Orzech włoski": -150, "Orzech amerykański": -150, "Mahoń": -200, "Jednolity kolor": -250 } },
      sideWood: { label: "Boki", default: "Jednolity kolor", values: { "Klon falisty": 0, "Topola czeczot": 0, "Orzech włoski": -100, "Orzech amerykański": -100, "Mahoń": -150, "Jednolity kolor": -200 } },
      headMode: { label: "Główka", default: "Czarna", values: { "Jak top": 0, "Jak boki": 0, Czarna: -150 } },
      bodyWood: { label: "Korpus", default: "Mahoń sapeli", values: { "Mahoń sapeli": 0, Jesion: 0 } },
      bodyFinish: { label: "Wykończenie korpusu", default: "Olejowosk", values: { "Czarny metalik": 0, "Czarny mat": -100, "Lakier bezbarwny mat": -100, Olejowosk: -300 } },
      fretboard: { label: "Podstrunnica", default: "Heban", values: { Heban: 0, Palisander: -100, Amarant: -100 } },
      bindingShape: { label: "Binding", default: "Binding 1", values: { "Binding 1": 0, "Binding 2": 0 } },
      bindingDots: { label: "Markery Bindingu 2", default: "Czysty", values: { Czysty: -100, "Okrągłe markery": 0 } },
      fretMarker: { label: "Marker na 12. progu", default: "Marker 2", values: { "Marker 2": 0, "Triple dots": 0, "Marker 1": 0, "Marker 3": 0, "Domyślny": -100 } },
      hardwareColor: { label: "Komplet osprzętu", default: "Chrom", values: { "Złoty": 0, Czarny: -100, Chrom: -250, Nikiel: -250 } },
      pickups: { label: "Pickupy", default: "Otwarta ramka", values: { "Otwarta ramka": 0, "W złotych puszkach": 0, "W chromowanych puszkach": -50, "W niklowych puszkach": -50, "Czarne bez puszek": -100 } },
      tuners: { label: "Klucze", default: "Gotoh SG381 MG", values: { "Gotoh SG381 MG": 0, "Gotoh SG381 MG-T": 0, "Gotoh SG 381": -150 } },
      fretMaterial: { label: "Progi", default: "Stalowe", values: { Stalowe: 0, Niklowane: -250 } }
    },
    // These selections do not change the reference price, including custom colors.
    neutralFields: { topColor: 0, topFinish: 0, sideColor: 0, sideFinish: 0, headFinish: 0, binding: 0, markers: 0, knobColor: 0, pickupFrameColor: 0, pickupCenterColor: 0, pickupDesign: 0, pickupMagnetColor: 0, bridge: 0, straplocks: 0, fretSize: 0, nut: 0, scale: 0, fretCount: 0 },
    rules: {
      singleLayout: "Układ 2: 1 pickup + 1 volume",
      plainBinding: "Binding 2",
      roundDots: "Okrągłe markery",
      defaultMarker: "Domyślny",
      tripleMarker: "Triple dots"
    }
  };
  const disclaimer = "Cena orientacyjna instrumentu w przedstawionej konfiguracji. Ostateczną cenę i warunki realizacji potwierdzimy indywidualnie.";
  const individualQuote = "Dodatkowe modyfikacje wymagają indywidualnej wyceny i nie są uwzględnione w cenie konfiguracji.";

  function normalize(input) {
    const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const selections = { ...source };
    const warnings = [];
    selections.bridge = "Tune-o-matic Gotoh";
    selections.handedness = source.handedness === "Leworęczna" ? "Leworęczna" : "Praworęczna";
    selections.tuning = Object.hasOwn(tuningBase, source.tuning) ? source.tuning : "E";
    selections.stringBrand = "D’Addario XS";
    const gauges = tuningGauges[tuningBase[selections.tuning]] || ["Do ustalenia"];
    selections.stringGauge = gauges.includes(source.stringGauge) ? source.stringGauge : gauges[0];
    for (const [field, definition] of Object.entries(catalog.fields)) {
      const value = source[field];
      selections[field] = typeof value === "string" && Object.hasOwn(definition.values, value) ? value : definition.default;
      if (value != null && value !== selections[field]) warnings.push(`Nieznana opcja: ${field}. Użyto opcji domyślnej.`);
    }
    for (const [field, group] of [["topWood", "top"], ["sideWood", "sides"]]) {
      const availability = inventory.woods?.[group] || {};
      if (availability[selections[field]]?.available === false) {
        selections[field] = Object.keys(catalog.fields[field].values).find(value => availability[value]?.available !== false) || catalog.fields[field].default;
        warnings.push(`Niedostępny materiał: ${field}. Użyto dostępnego materiału.`);
      }
    }
    const r = catalog.rules;
    if ((selections.bindingShape !== r.plainBinding && selections.fretMarker === r.defaultMarker)
      || (selections.bindingShape === r.plainBinding && selections.fretMarker === r.tripleMarker)) {
      selections.fretMarker = catalog.fields.fretMarker.default;
    }
    return { selections, warnings };
  }

  function modifier(field, value, selections) {
    const r = catalog.rules;
    const single = selections.electronicsLayout === r.singleLayout;
    if (field === "electronicsWiring" && single) return 0;
    if (field === "singlePickupWiring" && !single) return 0;
    if (field === "bindingDots" && selections.bindingShape !== r.plainBinding) return 0;
    if (field === "fretMarker" && value === r.defaultMarker
      && (selections.bindingShape !== r.plainBinding || selections.bindingDots === r.roundDots)) return 0;
    const values = catalog.fields[field]?.values;
    const amount = values && Object.hasOwn(values, value) ? values[value] : 0;
    return amount * (field === "pickups" ? (single ? 1 : 2) : 1);
  }

  function optionModifier(field, value, input) {
    return modifier(field, value, normalize(input).selections);
  }

  function calculate(input) {
    const { selections, warnings } = normalize(input);
    const adjustments = [];
    for (const [field, definition] of Object.entries(catalog.fields)) {
      const value = selections[field];
      const amount = modifier(field, value, selections);
      if (!amount) continue;
      const quantity = field === "pickups" ? (selections.electronicsLayout === catalog.rules.singleLayout ? 1 : 2) : 1;
      adjustments.push({ field, option: value, label: definition.label + " / " + (field === "fretMarker" ? "Bez dodatkowego markera" : value), quantity, unitAmount: amount / quantity, amount });
    }
    const totalAdjustments = adjustments.reduce((sum, item) => sum + item.amount, 0);
    return {
      pricingVersion: catalog.version, currency: catalog.currency, basePrice: catalog.basePrice,
      adjustments, totalAdjustments, totalPrice: catalog.basePrice + totalAdjustments,
      requiresIndividualQuote: typeof selections.modifications === "string" && selections.modifications.trim().length > 0,
      warnings
    };
  }

  function format(amount) {
    return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(amount) + " " + catalog.currency;
  }

  function summaryRows(price) {
    return [
      { label: "Cena referencyjna", value: format(price.basePrice) },
      ...price.adjustments.map(item => ({ label: item.label + (item.quantity > 1 ? ` (${item.quantity} szt.)` : ""), value: format(item.amount) })),
      { label: "Suma modyfikatorów", value: format(price.totalAdjustments) },
      { label: "Cena konfiguracji", value: format(price.totalPrice) },
      { label: "Wersja cennika", value: price.pricingVersion },
      { label: "Informacja o cenie", value: disclaimer },
      ...(price.requiresIndividualQuote ? [{ label: "Indywidualna wycena", value: individualQuote }] : [])
    ];
  }
  return { catalog, calculate, normalize, optionModifier, format, summaryRows, disclaimer, individualQuote, tuningGauges, tuningBase,
    setInventory(value) { inventory = value || {}; } };
});
