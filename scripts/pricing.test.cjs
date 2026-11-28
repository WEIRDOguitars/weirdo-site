const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const pricing = require('../pricing.js');
const setups = require('../setups.json');
const premium = {
  electronicsLayout: 'Układ 1: 4 gałki + 2 switche', electronicsWiring: 'Standard Weirdo',
  topWood: 'Klon falisty', sideWood: 'Topola czeczot', headMode: 'Jak top',
  bodyFinish: 'Czarny metalik', fretboard: 'Heban', bindingShape: 'Binding 1',
  fretMarker: 'Marker 2', hardwareColor: 'Złoty', pickups: 'Otwarta ramka',
  tuners: 'Gotoh SG381 MG', fretMaterial: 'Stalowe'
};
const total = changes => pricing.calculate({ ...premium, ...changes }).totalPrice;
test('reference and all four electronics variants; inactive values ignored', () => {
  assert.equal(total({}), 12500);
  assert.equal(total({ electronicsWiring: 'Opcja 2' }), 12500);
  assert.equal(total({ singlePickupWiring: 'Killer' }), 12500);
  const electronicsLayout = pricing.catalog.rules.singleLayout;
  assert.equal(total({ electronicsLayout, singlePickupWiring: 'Lauder' }), 11900);
  assert.equal(total({ electronicsLayout, singlePickupWiring: 'Killer' }), 12100);
});
test('shared pickup modifier counts only active pickups, including labels', () => {
  assert.equal(total({ pickups: 'Czarne bez puszek' }), 12300);
  const s = { ...premium, electronicsLayout: pricing.catalog.rules.singleLayout, pickups: 'Czarne bez puszek' };
  assert.equal(pricing.calculate(s).adjustments.find(a => a.field === 'pickups').amount, -100);
  assert.equal(pricing.optionModifier('pickups', 'W chromowanych puszkach', premium), -100);
  assert.equal(pricing.optionModifier('pickups', 'W chromowanych puszkach', s), -50);
});
test('hardware is charged once; frets and standard tuners', () => {
  assert.equal(total({ hardwareColor: 'Chrom' }), 12250);
  assert.equal(total({ fretMaterial: 'Niklowane' }), 12250);
  assert.equal(total({ tuners: 'Gotoh SG 381' }), 12350);
});
test('all neutral fields and matched head do not duplicate material charges', () => {
  for (const field of Object.keys(pricing.catalog.neutralFields)) assert.equal(total({ [field]: 'another value' }), 12500);
  assert.equal(total({ topWood: 'Mahoń', headMode: 'Jak top' }), 12300);
  assert.equal(total({ sideWood: 'Mahoń', headMode: 'Jak boki' }), 12350);
});
test('binding and context-dependent default marker', () => {
  assert.equal(total({ bindingDots: 'Czysty', fretMarker: 'Domyślny' }), 12500);
  assert.equal(total({ bindingShape: 'Binding 2', bindingDots: 'Czysty', fretMarker: 'Domyślny' }), 12300);
  assert.equal(total({ bindingShape: 'Binding 2', bindingDots: 'Okrągłe markery', fretMarker: 'Domyślny' }), 12500);
  assert.equal(total({ bindingShape: 'Binding 2', bindingDots: 'Czysty', fretMarker: 'Marker 2' }), 12400);
  assert.equal(total({ bindingShape: 'Binding 2', bindingDots: 'Czysty', fretMarker: 'Triple dots' }), 12400);
});
test('reset defaults match HTML checked options; missing/unknown values stay finite', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const selections = {};
  for (const tag of html.match(/<input\b[^>]*>/g)) {
    if (!/\bchecked\b/.test(tag)) continue;
    const name = tag.match(/name="([^"]+)"/)?.[1];
    const value = tag.match(/value="([^"]+)"/)?.[1];
    if (name) selections[name] = value;
  }
  assert.equal(pricing.calculate(selections).totalPrice, pricing.calculate({}).totalPrice);
  assert.equal(pricing.calculate({}).totalPrice, 11600);
  for (const input of [null, [], {}, { topWood: '__proto__', hardwareColor: 12, fretMaterial: null }]) {
    assert.ok(Number.isFinite(pricing.calculate(input).totalPrice));
  }
  assert.equal(total({ topWood: 'Orzech amerykański' }), 12500);
});
test('old JSON, tampered price, repeated switching and all saved setups', () => {
  const expected = [11600, 11550, 11800, 11800, 11300, 11800, 11100];
  setups.forEach((setup, i) => {
    const value = pricing.calculate(setup.selections).totalPrice;
    console.log(setup.name + ': ' + value + ' PLN');
    assert.equal(value, expected[i]);
    assert.equal(pricing.calculate({ ...setup.selections, totalPrice: 1, pricing: { totalPrice: 1 } }).totalPrice, value);
  });
  for (let i = 0; i < 100; i++) {
    assert.equal(total({ hardwareColor: 'Chrom' }), 12250);
    assert.equal(total({}), 12500);
  }
});
test('individual requirements are disclosed, never automatically charged', () => {
  assert.equal(total({ modifications: 'Custom neck' }), 12500);
  assert.equal(pricing.calculate({ modifications: 'Custom neck' }).requiresIndividualQuote, true);
  assert.equal(pricing.calculate({ modifications: '  ' }).requiresIndividualQuote, false);
});
test('all catalog modifiers nonpositive and browser/server use identical rules', () => {
  for (const definition of Object.values(pricing.catalog.fields)) {
    for (const amount of Object.values(definition.values)) assert.ok(Number.isFinite(amount) && amount <= 0);
  }
  const context = vm.createContext({ Intl });
  vm.runInContext(fs.readFileSync('pricing.js', 'utf8'), context);
  context.WeirdoPricing.setInventory(require('../materials.inventory.json'));
  for (const s of [premium, {}, ...setups.map(s => s.selections)]) {
    assert.equal(JSON.stringify(context.WeirdoPricing.calculate(s)), JSON.stringify(pricing.calculate(s)));
  }
});
test('valid minimum and maximum across dependent electronics/binding/pickup options', () => {
  let min = Infinity, max = -Infinity;
  const independent = ['topWood', 'sideWood', 'headMode', 'bodyFinish', 'fretboard', 'hardwareColor', 'tuners', 'fretMaterial'];
  for (const direction of ['min', 'max']) {
    const base = { ...premium };
    for (const field of independent) {
      const candidates = Object.keys(pricing.catalog.fields[field].values).filter(value => pricing.normalize({ [field]: value }).selections[field] === value);
      base[field] = candidates.reduce((best, v) => (direction === 'min' ? pricing.catalog.fields[field].values[v] < pricing.catalog.fields[field].values[best] : pricing.catalog.fields[field].values[v] > pricing.catalog.fields[field].values[best]) ? v : best);
    }
    for (const electronicsLayout of Object.keys(pricing.catalog.fields.electronicsLayout.values))
      for (const singlePickupWiring of ['Killer', 'Lauder'])
        for (const pickups of Object.keys(pricing.catalog.fields.pickups.values))
          for (const bindingShape of ['Binding 1', 'Binding 2'])
            for (const bindingDots of ['Czysty', 'Okrągłe markery'])
              for (const fretMarker of Object.keys(pricing.catalog.fields.fretMarker.values)) {
                const price = pricing.calculate({ ...base, electronicsLayout, singlePickupWiring, pickups, bindingShape, bindingDots, fretMarker }).totalPrice;
                min = Math.min(min, price); max = Math.max(max, price);
              }
  }
  assert.equal(min, 9950); assert.equal(max, 12500);
});
test('backend recalculates mail, JSON attachment and archive (mocked services)', async () => {
  const esbuild = require('esbuild');
  const bundle = await esbuild.build({ entryPoints: ['app/api/send-configuration/route.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['next/server', '@vercel/blob'] });
  let mail;
  const saved = [];
  const context = vm.createContext({
    module: { exports: {} }, exports: {}, Buffer, console,
    process: { env: { RESEND_API_KEY: 'test-only', VERCEL: '1', BLOB_READ_WRITE_TOKEN: 'test-only' } },
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } };
      if (name === '@vercel/blob') return { list: async () => ({ blobs: [] }), put: async (name, value) => { saved.push({ name, value }); return { pathname: name }; } };
      return require(name);
    },
    fetch: async (url, request) => { assert.equal(url, 'https://api.resend.com/emails'); mail = JSON.parse(request.body); return { ok: true }; }
  });
  vm.runInContext(bundle.outputFiles[0].text, context);
  const response = await context.module.exports.POST({ json: async () => ({
    customerName: 'Test', customerEmail: 'test@example.com', modelName: 'Test',
    selections: { ...premium, modifications: 'Custom neck' }, pricing: { totalPrice: 1 },
    summary: [{ label: 'Cena konfiguracji', value: '1 PLN' }], image: 'data:image/jpeg;base64,dGVzdA=='
  }) });
  assert.equal(response.status, 200);
  const record = JSON.parse(Buffer.from(mail.attachments[1].content, 'base64').toString());
  assert.equal(record.pricing.totalPrice, 12500);
  assert.equal(record.pricing.requiresIndividualQuote, true);
  assert.ok(mail.html.includes(pricing.format(12500)));
  assert.ok(mail.html.includes('nie jest zamówieniem'));
  assert.equal(record.summary.filter(r => r.label === 'Cena konfiguracji').length, 1);
  assert.equal(JSON.parse(saved.find(item => item.name.endsWith('.json')).value).pricing.totalPrice, 12500);
});
