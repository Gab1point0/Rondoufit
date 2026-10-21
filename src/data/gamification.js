// Rangs du jeu (selon le niveau) et liste des trophées avec leur bonus d'EXP.
export const RPG_RANKS = [
  { minLevel: 1, title: 'Toudoudou Novice', badge: '🎵', color: 'from-pink-400 to-rose-600' },
  { minLevel: 4, title: 'Rondoudou Apprenti', badge: '🎤', color: 'from-fuchsia-400 to-purple-600' },
  { minLevel: 8, title: 'Rondoudou Combattant', badge: '🥊', color: 'from-indigo-400 to-violet-600' },
  { minLevel: 14, title: 'Grodoudou d’Élite', badge: '👑', color: 'from-amber-400 to-orange-600' },
  { minLevel: 22, title: 'Rondoudou Légendaire', badge: '🌟', color: 'from-emerald-400 to-teal-600' },
  { minLevel: 35, title: 'Rondoudou Mythique', badge: '🐉', color: 'from-cyan-400 to-blue-600' },
  { minLevel: 50, title: 'Maître des Arènes', badge: '🏆', color: 'from-rose-400 to-red-600' }
];

export const ACHIEVEMENTS_LIST = [
  { id: 'first_blood', title: 'Première Berceuse', desc: 'Enregistrer votre toute première séance dans le Pokédex', icon: '🎵', xpBonus: 50 },
  { id: 'sets_master', title: 'Maître des Poké-Séries', desc: 'Valider toutes les séries et répétitions cibles d’un exercice (ex: 3×6)', icon: '🔴', xpBonus: 150 },
  { id: 'elastic_drop', title: 'Lévitation Sans Élastique', desc: 'Réduire l’aide en kg ou réussir une série en Strict (0 kg)', icon: '🦅', xpBonus: 120 },
  { id: 'level_up_exo', title: 'Évolution d’Arène', desc: 'Valider un objectif et faire monter un exercice au Niveau 2 ou plus', icon: '⬆️', xpBonus: 250 },
  { id: 'hybrid_athlete', title: 'Rondoudou Tout-Terrain', desc: 'Combiner Musculation et Course/Marche dans son aventure', icon: '🏃', xpBonus: 120 },
  { id: 'calorie_furnace', title: 'Attaque Lance-Flammes', desc: 'Brûler plus de 1 000 kcal cumulées', icon: '🔥', xpBonus: 150 },
  { id: 'weight_tracker', title: 'Suivi Morphologique', desc: 'Enregistrer une pesée dans l’espace Suivi du Poids', icon: '⚖️', xpBonus: 100 },
  { id: 'boss_slayer', title: 'Tombeur de Boss', desc: 'Atteindre l’objectif final d’un exercice et vaincre son boss', icon: '👑', xpBonus: 200 },
  { id: 'volley_rookie', title: 'Smash du Dresseur', desc: 'Enregistrer une séance de Volley-ball', icon: '🏐', xpBonus: 100 },
  { id: 'triple_combo', title: 'Triple Combo', desc: 'Faire 3 exercices différents le même jour', icon: '🎯', xpBonus: 120 },
  { id: 'streak_3', title: 'Trois Jours de Feu', desc: 'S’entraîner 3 jours consécutifs', icon: '📅', xpBonus: 150 },
  { id: 'polyvalent', title: 'Dresseur Polyvalent', desc: 'Pratiquer 4 groupes musculaires / arènes différents', icon: '🧭', xpBonus: 150 },
  { id: 'veteran_20', title: 'Vétéran des Arènes', desc: 'Enregistrer 20 séances au total', icon: '🏅', xpBonus: 250 },
  { id: 'calorie_inferno', title: 'Éruption Volcanique', desc: 'Brûler plus de 5 000 kcal cumulées', icon: '🌋', xpBonus: 300 },
  { id: 'weight_loss_5', title: 'Cinq Kilos Envolés', desc: 'Perdre 5 kg par rapport à votre poids de départ', icon: '🪽', xpBonus: 300 },
  { id: 'sunday_warrior', title: 'Guerrier du Dimanche', desc: 'S’entraîner un dimanche', icon: '☀️', xpBonus: 120, secret: true },
  { id: 'marathon_km', title: 'Marathonien', desc: 'Cumuler 42,2 km de course à pied', icon: '🏁', xpBonus: 400, secret: true },
  { id: 'all_arenas', title: 'Maître des 7 Arènes', desc: 'Pratiquer les 7 groupes / arènes', icon: '🌈', xpBonus: 500, secret: true }
];
