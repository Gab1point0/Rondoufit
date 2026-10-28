// Ouvre la fenêtre « Voir le mouvement » (components/MovementPreview.jsx) pour un exercice : { catalogId, name }
export function openMovement(q) {
  try {
    window.dispatchEvent(new CustomEvent('rondoufit-movement', { detail: { catalogId: q && q.catalogId, name: q && q.name } }));
  } catch (e) { /* rien */ }
}
