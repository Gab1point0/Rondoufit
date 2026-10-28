// Préférences d'affichage propres à cet appareil (jamais synchronisées) : taille du texte.
const KEY = 'rondoufit:ui';

export function readUiPrefs() {
  try { return { bigText: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return { bigText: false }; }
}

/** « Texte plus grand » : tout le texte est en rem, il suit la taille de base de la page. */
export function applyUiPrefs(prefs) {
  try { document.documentElement.style.fontSize = prefs.bigText ? '18px' : ''; } catch (e) { /* rien */ }
}

export function saveUiPrefs(prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* rien */ }
  applyUiPrefs(prefs);
}
