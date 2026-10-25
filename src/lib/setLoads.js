// Charge (ou aide) différente d'une série à l'autre : « j'ai fait 2 séries à 15 kg, puis 2 à 17,5 kg ».
// Dans une séance guidée : `d.loads` / `d.assists` (une valeur par série, à côté de `d.load` / `d.assist` = valeur courante).
// Dans l'historique : `entry.setLoads` / `entry.setAssists` (séries réalisées) ; `entry.value` = charge la plus lourde,
// `entry.assistanceKg` = aide la plus faible (ce sont les valeurs de record, utilisées par les courbes et les trophées).

const num = x => Number(x) || 0;

/** Une valeur par série, même pour une séance guidée ancienne qui n'avait qu'une charge pour toutes. */
export const loadsOf = d => (Array.isArray(d.loads) && d.loads.length === d.reps.length ? d.loads : d.reps.map(() => num(d.load)));
export const assistsOf = d => (Array.isArray(d.assists) && d.assists.length === d.reps.length ? d.assists : d.reps.map(() => num(d.assist)));

/** Les séries n'ont-elles pas toutes la même valeur ? */
export const isMixed = arr => Array.isArray(arr) && arr.length > 1 && new Set(arr.map(num)).size > 1;

/** Charges d'une entrée d'historique, une par série (la charge unique répétée si elle n'a pas été détaillée). */
export function entryLoads(e) {
  const n = Array.isArray(e.setDetails) && e.setDetails.length ? e.setDetails.length : 1;
  return Array.isArray(e.setLoads) && e.setLoads.length === n ? e.setLoads.map(num) : Array(n).fill(num(e.value));
}
export function entryAssists(e) {
  const n = Array.isArray(e.setDetails) && e.setDetails.length ? e.setDetails.length : 1;
  return Array.isArray(e.setAssists) && e.setAssists.length === n ? e.setAssists.map(num) : Array(n).fill(num(e.assistanceKg));
}

const fmt = x => String(Math.round(num(x) * 100) / 100).replace('.', ',');
/** « 15 kg » ou « 15 → 17,5 kg » */
export const fmtLoads = (arr, suffix = 'kg') => {
  const parts = [];
  arr.forEach(x => { if (!parts.length || parts[parts.length - 1] !== fmt(x)) parts.push(fmt(x)); });
  return `${parts.join(' → ')} ${suffix}`;
};

/** Tonnage d'une entrée : somme (répétitions × charge de la série). */
export const entryTonnage = e => {
  const reps = Array.isArray(e.setDetails) ? e.setDetails : [];
  const loads = entryLoads(e);
  return reps.reduce((s, r, i) => s + num(r) * num(loads[i]), 0);
};

/** Moyenne des valeurs de chaque série, pondérée par les répétitions (pour les calories). */
export function weightedMean(reps, values) {
  const total = reps.reduce((a, r) => a + num(r), 0);
  if (!(total > 0)) return num(values[0]);
  return reps.reduce((a, r, i) => a + num(r) * num(values[i]), 0) / total;
}
