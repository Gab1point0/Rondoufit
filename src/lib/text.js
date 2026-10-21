// Supprime les accents et normalise pour comparer facilement les mots mal retranscrits
export function stripAccents(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
