// Génère src/palette.css : les couleurs « d'accent » (rose, fuchsia, violet…) passent par des variables CSS.
// Édition normale : palette Tailwind d'origine (l'appli reste rose / Rondoudou). Édition neutre (data-style="neutral") : tons bleu / ardoise.
// Usage : node tools/make-palette.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import colors from 'tailwindcss/colors.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const NEUTRAL_OF = { pink: 'sky', fuchsia: 'blue', purple: 'blue', violet: 'blue', indigo: 'slate' };

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(' ');
let base = ':root {\n';
let neutral = ':root[data-style="neutral"] {\n';
for (const [name, to] of Object.entries(NEUTRAL_OF)) {
  for (const s of SHADES) {
    base += `  --${name}-${s}: ${rgb(colors[name][s])};\n`;
    neutral += `  --${name}-${s}: ${rgb(colors[to][s])};\n`;
  }
}
fs.writeFileSync(path.join(ROOT, 'src/palette.css'), `/* Fichier généré par tools/make-palette.mjs : ne pas modifier à la main. */\n${base}}\n${neutral}}\n`);
fs.writeFileSync(path.join(ROOT, 'palette-colors.json'), JSON.stringify({ names: Object.keys(NEUTRAL_OF), shades: SHADES }));
console.log('palette ok');
