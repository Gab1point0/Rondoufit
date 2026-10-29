// Génère les icônes de l'édition neutre (public/neutral/) : un haltère bleu sur fond ardoise. Usage : node tools/make-neutral-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/neutral');
fs.mkdirSync(OUT, { recursive: true });

const BG = [15, 23, 42];
const FG = [56, 189, 248];
const FG2 = [186, 230, 253];

function inRound(x, y, x0, y0, w, h, r) {
  if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) return false;
  const cx = Math.min(Math.max(x, x0 + r), x0 + w - r);
  const cy = Math.min(Math.max(y, y0 + r), y0 + h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** size : côté en pixels ; pad : marge relative (maskable = plus grande) ; round : coins arrondis du fond. */
function icon(size, pad = 0.18, round = true) {
  const png = new PNG({ width: size, height: size });
  const u = size * (1 - 2 * pad) / 10; // le dessin tient dans 10 × 10 unités
  const o = size * pad;
  const parts = [
    [0, 3, 1.2, 4, 0.4, FG2], [1.2, 2, 1.3, 6, 0.5, FG], [2.5, 4.4, 5, 1.2, 0.3, FG2], [7.5, 2, 1.3, 6, 0.5, FG], [8.8, 3, 1.2, 4, 0.4, FG2],
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      let c = BG;
      let a = 255;
      if (round && !inRound(x, y, 0, 0, size - 1, size - 1, size * 0.22)) { a = 0; c = BG; }
      for (const [px, py, w, h, r, col] of parts) if (inRound(x, y, o + px * u, o + py * u, w * u, h * u, r * u)) c = col;
      png.data[idx] = c[0]; png.data[idx + 1] = c[1]; png.data[idx + 2] = c[2]; png.data[idx + 3] = a;
    }
  }
  return PNG.sync.write(png);
}

fs.writeFileSync(path.join(OUT, 'favicon-32.png'), icon(32, 0.1));
fs.writeFileSync(path.join(OUT, 'favicon-48.png'), icon(48, 0.1));
fs.writeFileSync(path.join(OUT, 'icon-192.png'), icon(192));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), icon(512));
fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), icon(512, 0.28, false));
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), icon(180, 0.18, false));
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: 'Road2Fit', short_name: 'Road2Fit', description: 'Suivi de musculation : coach, journal de séances et progression.', lang: 'fr',
  start_url: '../', scope: '../', display: 'standalone', orientation: 'any', background_color: '#0f172a', theme_color: '#0f172a',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));
console.log('icônes neutres ok');
