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
    document.title = 'From Grosdoudou to Rondoudou';
    set('link[rel="manifest"]', 'href', './manifest.webmanifest');
    set('link[rel="icon"]', 'href', './icon-192.png');
    set('link[rel="apple-touch-icon"]', 'href', './apple-touch-icon.png');
    set('meta[name="theme-color"]', 'content', '#020617');
    apple.content = 'RondouFit';
  }
  document.head.appendChild(apple);
}
