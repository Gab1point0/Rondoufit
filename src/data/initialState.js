// ==========================================
// ÉTAT DE DÉPART : application vide (aucun exercice, aucune pesée). Tout nouveau champ doit avoir sa valeur ici.
// ==========================================
export const INITIAL_STATE = {
  heroName: 'Dresseur Rondoudou',
  startWeightKg: 84,
  userWeightKg: 82,
  targetWeightKg: 75,
  coach: { sessionsPerWeek: 2, sessionMinutes: 60, volleyDays: [4, 5], matchDates: [], deloadWeeks: [], cycleWeeks: 0, cycleStart: null, weeklyClaimed: [], splitMode: 'auto', gymSlots: {}, gymSkips: [] },
  weightHistory: [],
  xp: 0,
  streak: 0,
  soundEnabled: true,
  xpWeeks: {},                                  // EXP gagnée par semaine (clé = lundi AAAA-MM-JJ), pour la courbe du Bilan
  xpDaily: { date: '', earned: 0 },             // EXP gagnée aujourd'hui (plafond du jour)
  rankTrials: [],                               // niveaux des rangs dont l'épreuve est réussie
  cosmetics: { theme: 'rose', accessory: 'none', title: '' },
  maxRecords: {},                               // records réels saisis dans l'onglet « Mes maxima » (clé = id de l'exercice)
  unlockedAchievements: [],
  claimedChallenges: [],
  quests: []
};
