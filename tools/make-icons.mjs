// Génère les icônes de l'application (public/) à partir de assets/icon-source.png (2048 × 2048, 2,8 Mo).
// Usage : node tools/make-icons.mjs
// On recadre le carré arrondi sombre, on remplit les coins blancs avec sa couleur, puis on réduit.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'assets/icon-source.png')));

// Zone utile du dessin source (le carré arrondi) : repérée à la main sur l'image 2048 px.
const CROP = { x: 172, y: 172, size: 1704 };
const CORNER = 420; // rayon approximatif des coins arrondis, en pixels source
const DARK = [52, 61, 76]; // couleur du fond sombre du dessin

function pixel(x, y) {
  const i = (src.width * y + x) << 2;
  return [src.data[i], src.data[i + 1], src.data[i + 2]];
}

/** Carré recadré, coins blancs remplacés par la couleur du fond. */
function squareIcon() {
  const n = CROP.size;
  const out = new PNG({ width: n, height: n });
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let [r, g, b] = pixel(CROP.x + x, CROP.y + y);
      const inCornerX = x < CORNER || x >= n - CORNER;
      const inCornerY = y < CORNER || y >= n - CORNER;
      if (inCornerX && inCornerY && r > 200 && g > 200 && b > 200) [r, g, b] = DARK;
      const o = (n * y + x) << 2;
      out.data[o] = r; out.data[o + 1] = g; out.data[o + 2] = b; out.data[o + 3] = 255;
    }
  }
  return out;
}

/** Réduction par moyenne de surface (bonne qualité, sans dépendance native). */
function resize(img, size) {
  const out = new PNG({ width: size, height: size });
  const k = img.width / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * k), x1 = Math.max(x0 + 1, Math.floor((x + 1) * k));
      const y0 = Math.floor(y * k), y1 = Math.max(y0 + 1, Math.floor((y + 1) * k));
      let r = 0, g = 0, b = 0, c = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        const i = (img.width * yy + xx) << 2;
        r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; c++;
      }
      const o = (size * y + x) << 2;
      out.data[o] = r / c; out.data[o + 1] = g / c; out.data[o + 2] = b / c; out.data[o + 3] = 255;
    }
  }
  return out;
}

/** Même dessin réduit au centre d'un fond uni (zone de sécurité des icônes « maskable »). */
function maskable(img, size) {
  const out = new PNG({ width: size, height: size });
  for (let i = 0; i < out.data.length; i += 4) { out.data[i] = DARK[0]; out.data[i + 1] = DARK[1]; out.data[i + 2] = DARK[2]; out.data[i + 3] = 255; }
  const inner = resize(img, Math.round(size * 0.8));
  const off = Math.round((size - inner.width) / 2);
  PNG.bitblt(inner, out, 0, 0, inner.width, inner.height, off, off);
  return out;
}

const base = squareIcon();
const write = (name, png) => {
  const file = path.join(ROOT, 'public', name);
  fs.writeFileSync(file, PNG.sync.write(png, { colorType: 2 }));
  console.log(name, (fs.statSync(file).size / 1024).toFixed(1), 'Ko');
};
write('icon-192.png', resize(base, 192));
write('icon-512.png', resize(base, 512));
write('apple-touch-icon.png', resize(base, 180));
write('icon-maskable-512.png', maskable(base, 512));
