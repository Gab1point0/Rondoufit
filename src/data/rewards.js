import { NEUTRAL } from '../edition';
// Récompenses cosmétiques débloquées avec le niveau : thèmes de couleur, accessoires de Rondoudou, titres.
// (Les noms de classes sont écrits en entier : Tailwind ne génère pas celles qu'on assemble à la volée.)

const THEMES_ALL = [
  { id: 'ardoise', label: 'Ardoise', level: 1, bar: 'from-sky-500 via-blue-500 to-slate-300', ring: 'from-sky-400 via-blue-500 to-slate-600' },
  { id: 'rose', label: 'Rose Rondoudou', level: 1, bar: 'from-pink-500 via-fuchsia-500 to-amber-400', ring: 'from-pink-400 via-rose-500 to-indigo-600' },
  { id: 'ocean', label: 'Océan', level: 5, bar: 'from-sky-400 via-cyan-400 to-emerald-300', ring: 'from-sky-400 via-cyan-500 to-blue-700' },
  { id: 'foret', label: 'Forêt', level: 10, bar: 'from-emerald-400 via-lime-400 to-yellow-300', ring: 'from-emerald-400 via-green-500 to-teal-700' },
  { id: 'or', label: 'Or', level: 20, bar: 'from-amber-300 via-yellow-400 to-orange-500', ring: 'from-amber-300 via-yellow-500 to-orange-600' },
  { id: 'galaxie', label: 'Galaxie', level: 35, bar: 'from-violet-400 via-fuchsia-500 to-indigo-500', ring: 'from-violet-500 via-purple-600 to-slate-900' },
];

const ACCESSORIES_ALL = [
  { id: 'none', label: 'Aucun', level: 1, icon: '∅', pos: '' },
  { id: 'casque', label: 'Casque audio', level: 6, icon: '🎧', pos: '-top-3 left-1/2 -translate-x-1/2 text-2xl' },
  { id: 'lunettes', label: 'Lunettes de soleil', level: 12, icon: '🕶️', pos: 'top-[38%] left-1/2 -translate-x-1/2 text-2xl' },
  { id: 'couronne', label: 'Couronne', level: 25, icon: '👑', pos: '-top-4 left-1/2 -translate-x-1/2 text-3xl' },
  { id: 'aura', label: 'Aura de feu', level: 40, icon: '🔥', pos: '-bottom-2 -right-2 text-3xl animate-pulse' },
];

export const TITLES = [
  { id: '', label: 'Titre de mon rang', level: 1 },
  { id: 'courageux', label: 'Le Courageux', level: 3 },
  { id: 'assidu', label: 'L’Assidu', level: 7 },
  { id: 'costaud', label: 'Le Costaud', level: 12 },
  { id: 'machine', label: 'La Machine', level: 18 },
  { id: 'inarretable', label: 'L’Inarrêtable', level: 30 },
  { id: 'legende', label: 'La Légende', level: 45 },
];

/** Cadre de l'avatar selon le rang (du plus modeste au plus brillant). */
export const RANK_FRAMES = [
  'p-0.5 shadow-lg shadow-pink-500/20',
  'p-0.5 shadow-lg shadow-fuchsia-500/40',
  'p-1 shadow-xl shadow-indigo-500/50',
  'p-1 shadow-xl shadow-amber-400/50',
  'p-1 shadow-2xl shadow-emerald-400/60',
  'p-1.5 shadow-2xl shadow-cyan-400/60',
  'p-1.5 shadow-2xl shadow-red-500/70',
];

const pick = (list, id, level) => {
  const found = list.find(x => x.id === id);
  return found && level >= found.level ? found : list[0];
};

/** Thème, accessoire et titre choisis, ramenés au choix par défaut s'ils ne sont pas (encore) débloqués. */
export function activeCosmetics(cosmetics, level) {
  const c = cosmetics || {};
  return {
    theme: pick(THEMES, c.theme, level),
    accessory: pick(ACCESSORIES, c.accessory, level),
    title: pick(TITLES, c.title, level),
  };
}

// Édition neutre : couleurs sobres, aucun accessoire ; l'édition fun garde sa liste d'origine (le thème « ardoise » n'y apparaît pas).
export const THEMES = NEUTRAL ? THEMES_ALL.filter(t => t.id !== 'rose' && t.id !== 'galaxie') : THEMES_ALL.filter(t => t.id !== 'ardoise');
export const ACCESSORIES = NEUTRAL ? ACCESSORIES_ALL.filter(a => a.id === 'none') : ACCESSORIES_ALL;
