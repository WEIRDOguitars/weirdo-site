import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Compare every literal model/texture URL used by the renderer with its deployed copy.
const base = process.argv[2];
if (!base) throw new Error('Usage: node scripts/check-configurator-assets.mjs https://host/configurator/');
const source = await readFile(new URL('../viewer3d.js', import.meta.url), 'utf8');
const assets = [...new Set([...source.matchAll(/\$\{assetBase\}\/([^`]+)`/g)].map(match => match[1]))];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const setups = JSON.parse(await readFile(new URL('../public/configurator/setups.json', import.meta.url), 'utf8'));
assets.push('setup-gallery.js', 'setups.json', 'assets/setups/blank.jpg', ...setups.map(setup => setup.thumbnail));
let failures = 0;
for (const asset of ['index.html', 'app.js', 'styles.css', 'viewer3d.bundle.js', ...assets]) {
  try {
    const local = await readFile(new URL(`../public/configurator/${asset}`, import.meta.url));
    const response = await fetch(new URL(asset, base.endsWith('/') ? base : `${base}/`));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remote = Buffer.from(await response.arrayBuffer());
    if (hash(local) !== hash(remote)) throw new Error('Content differs from local deployment files');
    console.log(`OK ${asset}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${asset}: ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
