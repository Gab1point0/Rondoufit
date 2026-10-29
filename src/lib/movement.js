// Ouvre la fenêtre « Voir le mouvement » (components/MovementPreview.jsx) pour un exercice : { catalogId, name }
export function openMovement(q) {
  try {
    window.dispatchEvent(new CustomEvent('rondoufit-movement', { detail: { catalogId: q && q.catalogId, name: q && q.name } }));
  } catch (e) { /* rien */ }
}

/** Signale qu'une animation est fausse (App.jsx l'enregistre dans gameState.animFlags, synchronisé avec GitHub). */
export function flagAnimation({ animId, view, name }) {
  try {
    window.dispatchEvent(new CustomEvent('rondoufit-animflag', { detail: { animId, view, name } }));
  } catch (e) { /* rien */ }
}
