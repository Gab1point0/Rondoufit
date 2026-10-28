// Copie de sécurité automatique avant une action qui remplace toutes les données (import, réinitialisation).
// Une seule copie, gardée sur cet appareil ; elle se restaure depuis « Plus ».
const KEY = 'rondoufit:safetyCopy';

export function saveSafetyCopy(state, reason) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), reason, state }));
    return true;
  } catch (e) { return false; }
}

/** { savedAt, reason, state } ou null */
export function readSafetyCopy() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    return c && c.state && Array.isArray(c.state.quests) ? c : null;
  } catch (e) { return null; }
}
