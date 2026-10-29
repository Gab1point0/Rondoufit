// Édition de l'interface : « neutral » (classique, sobre : Road2Fit) par DÉFAUT, ou « fun » (Rondoudou, réservée à Gabin).
// L'édition Rondoudou n'existe QUE sur le lien privé « …/Road2Fit/?rondoudou » : aucun réglage, aucun menu ni aucune mémoire
// ne permet d'y arriver autrement (le lien ouvert sans ce paramètre est toujours en version classique). Les données et la sauvegarde
// sont les mêmes dans les deux éditions.
function readFun() {
  try {
    return new URLSearchParams(window.location.search).has('rondoudou');
  } catch (err) {
    return false;
  }
}

export const NEUTRAL = !readFun();

/** Choisit le texte selon l'édition. */
export const pick = (fun, neutral) => (NEUTRAL ? neutral : fun);

/**
 * Texte écrit par l'utilisateur (notes de pesée, de séance…) : en version classique, on masque l'ancien vocabulaire Rondoudou
 * (notes d'avant la version classique, ex. « Pesée initiale (Mode Grosdoudou) »). Affichage seulement : les données ne sont pas modifiées,
 * car la même sauvegarde sert aussi à l'édition privée.
 */
export function cleanText(text) {
  if (!NEUTRAL || typeof text !== 'string') return text;
  return text
    .replace(/\s*\((?:mode\s+)?[a-zé]*doudou[^)]*\)/gi, '')
    .replace(/,?\s*en route vers (?:le\s+)?[a-zé]*doudou(?:\s+fit)?\s*!?/gi, ', continue comme ça !')
    .replace(/\s*(?:\b(?:de|du|des|par|pour|à)\s+)?\b[a-zé]*doudou\b(?:\s+fit)?/gi, '')
    .replace(/\bdresseur\b/gi, '')
    .replace(/\bpok[eé](?:dex|mon|ball)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

/** Au démarrage : couleurs, titre, icône et manifeste (nom de l'appli installée sur l'écran d'accueil). Le HTML de base est en version classique. */
export function applyEdition() {
  document.documentElement.dataset.style = NEUTRAL ? 'neutral' : 'fun';
  const set = (sel, attr, value) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, value); };
  const apple = document.createElement('meta');
  apple.name = 'apple-mobile-web-app-title';
  if (NEUTRAL) {
    document.title = 'Road2Fit';
    apple.content = 'Road2Fit';
  } else {
    // Onglet, favoris et icône de favori restent NEUTRES (Road2Fit + haltère) même sur le lien privé ; seule l'icône installée sur l'écran d'accueil est Rondoudou.
    document.title = 'Road2Fit';
    set('link[rel="manifest"]', 'href', './manifest.webmanifest');
    set('meta[name="theme-color"]', 'content', '#020617');
    apple.content = 'RondouFit';
  }
  document.head.appendChild(apple);
}
