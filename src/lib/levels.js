import { RPG_RANKS } from '../data/gamification';

// Courbe de niveaux : l'EXP cumulée nécessaire pour atteindre le niveau L est XP_BASE × (L − 1) ^ XP_EXPONENT.
// Les premiers niveaux vont vite, puis chaque niveau demande de plus en plus d'EXP (avec ~3 séances par semaine :
// niveau 5 en quelques semaines, niveau 10 en 2-3 mois, niveau 20 en plus d'un an).
// Pour rendre la progression plus lente ou plus rapide, ne modifier que ces deux nombres.
const XP_BASE = 300;
const XP_EXPONENT = 1.6;
export const MAX_LEVEL = 100;

/** EXP cumulée à avoir pour atteindre le niveau L (niveau 1 = 0). */
export const xpForLevel = L => (L <= 1 ? 0 : Math.round(XP_BASE * Math.pow(L - 1, XP_EXPONENT)));

export const rankForLevel = level => [...RPG_RANKS].reverse().find(r => level >= r.minLevel) || RPG_RANKS[0];

/** Niveau, avancement dans le niveau, rang actuel et prochain rang pour une quantité d'EXP. */
export function levelFromXp(xp) {
  const total = Math.max(0, Number(xp) || 0);
  let level = 1;
  while (level < MAX_LEVEL && total >= xpForLevel(level + 1)) level++;
  const floor = xpForLevel(level);
  const next = level >= MAX_LEVEL ? floor : xpForLevel(level + 1);
  const span = Math.max(1, next - floor);
  const currentLevelXp = total - floor;
  const rank = rankForLevel(level);
  const nextRank = RPG_RANKS.find(r => r.minLevel > level) || null;
  return {
    level,
    currentLevelXp,
    nextLevelXp: span,
    progressPct: level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((currentLevelXp / span) * 100)),
    rank,
    nextRank,
    xpToNextRank: nextRank ? xpForLevel(nextRank.minLevel) - total : 0,
  };
}
