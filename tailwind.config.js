import fs from 'node:fs';

// Les couleurs d'accent passent par des variables CSS (src/palette.css, généré par tools/make-palette.mjs) :
// rose Rondoudou pour l'édition normale, bleu / ardoise pour l'édition neutre.
const { names, shades } = JSON.parse(fs.readFileSync(new URL('./palette-colors.json', import.meta.url), 'utf8'));
const accent = {};
for (const n of names) {
  accent[n] = {};
  for (const s of shades) accent[n][s] = `rgb(var(--${n}-${s}) / <alpha-value>)`;
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: accent } },
  plugins: [],
};
