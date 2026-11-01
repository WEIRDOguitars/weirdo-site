export const elementFields = {
  top: ['topWood', 'topColor', 'topFinish'],
  sides: ['sideWood', 'sideColor', 'sideFinish'],
  head: ['headMode', 'headFinish'],
  body: ['bodyWood', 'bodyFinish'],
  fretboard: ['fretboard'],
  binding: ['binding', 'bindingShape', 'bindingDots', 'fretMarker'],
  frets: ['fretMaterial', 'fretSize'],
  hardware: ['hardwareColor', 'bridge', 'tuners', 'straplocks', 'electronicsLayout', 'electronicsWiring', 'singlePickupWiring'],
  knobs: ['knobColor'],
  pickupFrame: ['pickupFrameColor', 'pickups'],
  pickupCenter: ['pickupCenterColor', 'pickupDesign', 'pickups'],
  nut: ['nut']
};

export function isElementActive(role, active) {
  const aliases = {
    tunerButtons: 'binding', markers: 'binding', bodyBindingRim: 'binding',
    bodyBindingGlow: 'binding', tuners: 'hardware', metalLogo: 'hardware',
    pickupMagnets: 'pickupCenter', pickup: 'pickupCenter'
  };
  return active.has(aliases[role] || role);
}
