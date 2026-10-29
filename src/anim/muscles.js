// Texte « Muscles travaillés » → zones du bonhomme à colorer. Le premier muscle cité est le principal (couleur forte), les autres sont secondaires.
const RULES = [
  [/pectora|pecs|poitrine/, 'chest'],
  [/epaule|deltoide|delto|rotateur|epineux|petit rond/, 'shoulder'],
  [/tout le corps/, 'body'],
  [/biceps|brachial/, 'biceps'],
  [/triceps/, 'triceps'],
  [/avant-bras|prehension|poignet/, 'forearm'],
  [/dorsa|trapez|rhomboi|lombaire|bas du dos|haut du dos|\bdos\b|erecteur|dentele/, 'back'],
  [/abdo|oblique|transverse|gainage|tronc|sangle|core|psoas|flechisseur/, 'core'],
  [/fessier|glute/, 'glutes'],
  [/quadriceps|quadri|cuisse/, 'quads'],
  [/ischio|arriere de cuisse|arriere des cuisses/, 'hams'],
  [/adducteur|abducteur/, 'quads'],
  [/mollet|soleaire|jumeau|tibial/, 'calves'],
];

const plain = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** → [{ z: 'chest', lvl: 1 | 0.55 }] (sans doublon, ordre d'importance) */
export function musclesOf(text) {
  const out = [];
  const seen = new Set();
  (text || '').split(/[,;]| et /).forEach((part, i) => {
    const t = plain(part);
    for (const [re, z] of RULES) {
      if (re.test(t) && !seen.has(z)) {
        seen.add(z);
        const lvl = i === 0 ? 1 : 0.55;
        if (z === 'body') ['chest', 'core', 'quads', 'shoulder'].forEach(b => { if (!seen.has(b)) { seen.add(b); out.push({ z: b, lvl: 0.55 }); } });
        else out.push({ z, lvl });
      }
    }
  });
  return out;
}
