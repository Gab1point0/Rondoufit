// Règles texte → muscle précis (sans dépendance : partagées par data/muscles.js et par le générateur tools/make-fine-groups.mjs).
export const plain = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Règles texte → muscle précis (ordre = priorité). Sert à la génération de la table et aux exercices personnalisés. */
const FINE_RULES = [
  [/oblique/, 'Obliques'],
  [/lombaire|erecteur|bas du dos/, 'Lombaires'],
  [/abdo|grand droit|transverse|gainage|sangle/, 'Abdominaux'],
  [/pectora|pecs|poitrine/, 'Pectoraux'],
  [/biceps|brachial|curl/, 'Biceps'],
  [/triceps/, 'Triceps'],
  [/avant-bras|poignet|prehension|grip/, 'Avant-bras'],
  [/grand dorsal|dorsa|trapez|rhomboi|haut du dos|\bdos\b|traction|tirage|rowing|shrug/, 'Dos'],
  [/epaule|deltoide|coiffe|rotateur|militaire|elevation lat/, 'Épaules'],
  [/adducteur|abducteur/, 'Hanches'],
  [/ischio|souleve de terre roumain|leg curl/, 'Ischio-jambiers'],
  [/fessier|glute|hip thrust|pont/, 'Fessiers'],
  [/quadriceps|leg ext|squat|presse|fente|jambes?\b|cuisse/, 'Quadriceps'],
  [/mollet|soleaire|jumeau/, 'Mollets'],
];

/** Muscle précis d'après un texte (le premier muscle cité compte le plus) ; null si rien de reconnu. */
export function fineFromText(text) {
  for (const part of String(text || '').split(/[,;]/)) {
    const t = plain(part);
    for (const [re, g] of FINE_RULES) if (re.test(t)) return g;
  }
  return null;
}

