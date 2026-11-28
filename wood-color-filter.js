// Canvas filters are unavailable in some WebKit browsers. Apply the same
// sRGB operations to texture pixels everywhere, once when building a texture.
export function filterWoodPixels(pixels, filter) {
  const operations = [...filter.matchAll(/(contrast|brightness|saturate|grayscale)\(([\d.]+)\)/g)]
    .map(([, name, amount]) => [name, Number(amount)]);
  const clamp = value => Math.max(0, Math.min(255, value));
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    for (const [name, amount] of operations) {
      if (name === 'brightness') {
        r *= amount; g *= amount; b *= amount;
      } else if (name === 'contrast') {
        r = (r - 127.5) * amount + 127.5;
        g = (g - 127.5) * amount + 127.5;
        b = (b - 127.5) * amount + 127.5;
      } else {
        const saturation = name === 'grayscale' ? 1 - Math.min(1, amount) : amount;
        const luminance = .2126 * r + .7152 * g + .0722 * b;
        r = luminance + (r - luminance) * saturation;
        g = luminance + (g - luminance) * saturation;
        b = luminance + (b - luminance) * saturation;
      }
      r = clamp(r); g = clamp(g); b = clamp(b);
    }
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b;
  }
  return pixels;
}
