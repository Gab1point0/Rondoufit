// Édition de l'interface : « fun » (Rondoudou, pour Gabin) ou « neutral » (simple et sobre, pour les amis).
// Réglage de l'APPAREIL (clé rondoufit:style, jamais synchronisé) : le lien « …/Rondoufit/?amis » passe l'appareil en édition neutre ;
// le choix se change aussi dans ⚙️ → Apparence. Les données et la sauvegarde sont les mêmes dans les deux éditions.
const KEY = 'rondoufit:style';

function readStyle() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has('amis') || q.get('style') === 'neutral') localStorage.setItem(KEY, 'neutral');
    else if (q.get('style') === 'fun') localStorage.setItem(KEY, 'fun');
    return localStorage.getItem(KEY) === 'neutral' ? 'neutral' : 'fun';
  } catch (e) {
    return 'fun';
  }
}

export const NEUTRAL = readStyle() === 'neutral';

/** Choisit le texte selon l'édition. */
export const pick = (fun, neutral) => (NEUTRAL ? neutral : fun);

/** Le sport collectif fixe de l'emploi du temps : « volley » (Gabin) ou « sport » (édition neutre : l'utilisateur choisit lui-même ses jours). */
export const SPORT = NEUTRAL ? 'sport' : 'volley';
export const SPORT_CAP = NEUTRAL ? 'Sport' : 'Volley';
export const SPORT_ICON = NEUTRAL ? '🎽' : '🏐';

/** Change d'édition puis recharge la page (les couleurs, les icônes et le nom installé en dépendent). */
export function setStyle(style) {
  try { localStorage.setItem(KEY, style === 'neutral' ? 'neutral' : 'fun'); } catch (e) { /* rien */ }
  window.location.href = window.location.pathname;
}

/** Au démarrage : couleurs, titre, icône et manifeste (nom de l'appli installée sur l'écran d'accueil). */
export function applyEdition() {
  document.documentElement.dataset.style = NEUTRAL ? 'neutral' : 'fun';
  if (!NEUTRAL) return;
  document.title = 'Ma musculation';
  const set = (sel, attr, value) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, value); };
  set('link[rel="manifest"]', 'href', './neutral/manifest.webmanifest');
  set('link[rel="icon"]', 'href', './neutral/icon-192.png');
  set('link[rel="apple-touch-icon"]', 'href', './neutral/apple-touch-icon.png');
  set('meta[name="theme-color"]', 'content', '#0f172a');
  const apple = document.createElement('meta');
  apple.name = 'apple-mobile-web-app-title';
  apple.content = 'Muscu';
  document.head.appendChild(apple);
}
