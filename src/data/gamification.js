import { NEUTRAL } from '../edition';
// Rangs du jeu (selon le niveau) et liste des trophées avec leur bonus d'EXP.
const RANKS_FUN = [
  { minLevel: 1, title: 'Toudoudou Novice', badge: '🎵', color: 'from-pink-400 to-rose-600' },
  { minLevel: 4, title: 'Rondoudou Apprenti', badge: '🎤', color: 'from-fuchsia-400 to-purple-600' },
  { minLevel: 8, title: 'Rondoudou Combattant', badge: '🥊', color: 'from-indigo-400 to-violet-600' },
  { minLevel: 14, title: 'Grodoudou d’Élite', badge: '👑', color: 'from-amber-400 to-orange-600' },
  { minLevel: 22, title: 'Rondoudou Légendaire', badge: '🌟', color: 'from-emerald-400 to-teal-600' },
  { minLevel: 35, title: 'Rondoudou Mythique', badge: '🐉', color: 'from-cyan-400 to-blue-600' },
  { minLevel: 50, title: 'Maître des Arènes', badge: '🏆', color: 'from-rose-400 to-red-600' }
];

const ACHIEVEMENTS_FUN = [
  { id: 'first_blood', title: 'Première Berceuse', desc: 'Enregistrer votre toute première séance dans le Pokédex', icon: '🎵', xpBonus: 25 },
  { id: 'sets_master', title: 'Maître des Poké-Séries', desc: 'Valider toutes les séries et répétitions cibles d’un exercice (ex: 3×6)', icon: '🔴', xpBonus: 75 },
  { id: 'elastic_drop', title: 'Lévitation Sans Élastique', desc: 'Réduire l’aide en kg ou réussir une série en Strict (0 kg)', icon: '🦅', xpBonus: 60 },
  { id: 'level_up_exo', title: 'Évolution d’Arène', desc: 'Valider un objectif et faire monter un exercice au Niveau 2 ou plus', icon: '⬆️', xpBonus: 125 },
  { id: 'hybrid_athlete', title: 'Rondoudou Tout-Terrain', desc: 'Combiner Musculation et Course/Marche dans son aventure', icon: '🏃', xpBonus: 60 },
  { id: 'calorie_furnace', title: 'Attaque Lance-Flammes', desc: 'Brûler plus de 1 000 kcal cumulées', icon: '🔥', xpBonus: 75 },
  { id: 'weight_tracker', title: 'Suivi Morphologique', desc: 'Enregistrer une pesée dans l’espace Suivi du Poids', icon: '⚖️', xpBonus: 50 },
  { id: 'boss_slayer', title: 'Tombeur de Boss', desc: 'Atteindre l’objectif final d’un exercice et vaincre son boss', icon: '👑', xpBonus: 100 },
  { id: 'volley_rookie', title: 'Smash du Dresseur', desc: 'Enregistrer une séance de Volley-ball', icon: '🏐', xpBonus: 50 },
  { id: 'triple_combo', title: 'Triple Combo', desc: 'Faire 3 exercices différents le même jour', icon: '🎯', xpBonus: 60 },
  { id: 'streak_3', title: 'Trois Jours de Feu', desc: 'S’entraîner 3 jours consécutifs', icon: '📅', xpBonus: 75 },
  { id: 'polyvalent', title: 'Dresseur Polyvalent', desc: 'Pratiquer 4 groupes musculaires / arènes différents', icon: '🧭', xpBonus: 75 },
  { id: 'veteran_20', title: 'Vétéran des Arènes', desc: 'Enregistrer 20 séances au total', icon: '🏅', xpBonus: 125 },
  { id: 'calorie_inferno', title: 'Éruption Volcanique', desc: 'Brûler plus de 5 000 kcal cumulées', icon: '🌋', xpBonus: 150 },
  { id: 'weight_loss_5', title: 'Cinq Kilos Envolés', desc: 'Perdre 5 kg par rapport à votre poids de départ', icon: '🪽', xpBonus: 150 },
  { id: 'sunday_warrior', title: 'Guerrier du Dimanche', desc: 'S’entraîner un dimanche', icon: '☀️', xpBonus: 60, secret: true },
  { id: 'marathon_km', title: 'Marathonien', desc: 'Cumuler 42,2 km de course à pied', icon: '🏁', xpBonus: 200, secret: true },
  { id: 'all_arenas', title: 'Maître des 7 Arènes', desc: 'Pratiquer les 7 groupes / arènes', icon: '🌈', xpBonus: 250, secret: true }
];

// Édition neutre : mêmes rangs et mêmes trophées (mêmes identifiants, mêmes bonus), noms sobres.
const RANKS_NEUTRAL = [
  { title: 'Débutant', badge: '🔰' }, { title: 'Initié', badge: '💪' }, { title: 'Régulier', badge: '🏋️' }, { title: 'Confirmé', badge: '🔥' },
  { title: 'Avancé', badge: '⭐' }, { title: 'Expert', badge: '🏆' }, { title: 'Élite', badge: '👑' },
];
export const RPG_RANKS = NEUTRAL ? RANKS_FUN.map((r, i) => ({ ...r, ...RANKS_NEUTRAL[i] })) : RANKS_FUN;

const ACH_NEUTRAL = {
  first_blood: ['Première séance', 'Enregistrer ta toute première séance'],
  sets_master: ['Séries validées', 'Valider toutes les séries et répétitions cibles d’un exercice (ex : 3×6)'],
  elastic_drop: ['Moins d’aide', 'Réduire l’aide en kg ou réussir une série en strict (0 kg)'],
  level_up_exo: ['Exercice niveau supérieur', 'Valider un objectif et faire monter un exercice au niveau 2 ou plus'],
  hybrid_athlete: ['Muscu et cardio', 'Combiner musculation et course / marche'],
  calorie_furnace: ['1 000 kcal brûlées', 'Brûler plus de 1 000 kcal cumulées'],
  weight_tracker: ['Suivi du poids', 'Enregistrer une pesée dans l’espace Suivi du poids'],
  boss_slayer: ['Objectif final atteint', 'Atteindre l’objectif final d’un exercice'],
  volley_rookie: ['Sport d’équipe', 'Enregistrer une séance de sport collectif'],
  triple_combo: ['Trois exercices en un jour', 'Faire 3 exercices différents le même jour'],
  streak_3: ['Trois jours de suite', 'S’entraîner 3 jours consécutifs'],
  polyvalent: ['Corps complet', 'Pratiquer 4 groupes musculaires différents'],
  veteran_20: ['20 séances', 'Enregistrer 20 séances au total'],
  calorie_inferno: ['5 000 kcal brûlées', 'Brûler plus de 5 000 kcal cumulées'],
  weight_loss_5: ['Cinq kilos en moins', 'Perdre 5 kg par rapport à ton poids de départ'],
  sunday_warrior: ['Séance du dimanche', 'S’entraîner un dimanche'],
  marathon_km: ['42,2 km cumulés', 'Cumuler 42,2 km de course à pied'],
  all_arenas: ['Les 7 groupes musculaires', 'Pratiquer les 7 groupes musculaires'],
};
export const ACHIEVEMENTS_LIST = NEUTRAL ? ACHIEVEMENTS_FUN.map(a => (ACH_NEUTRAL[a.id] ? { ...a, title: ACH_NEUTRAL[a.id][0], desc: ACH_NEUTRAL[a.id][1] } : a)) : ACHIEVEMENTS_FUN;
