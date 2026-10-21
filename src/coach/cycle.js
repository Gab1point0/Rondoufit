import { coachDaysBetween } from './settings';
import { addDaysISO } from '../lib/dates';

// ---- Cycles d'entraînement (semaine allégée automatique en fin de cycle) ----
export function coachCycleInfo(coach, weekStart) {
  const len = Number(coach.cycleWeeks) || 0;
  if (!len || !coach.cycleStart) return null;
  const diff = Math.round(coachDaysBetween(coach.cycleStart, weekStart) / 7);
  if (diff < 0) return null;
  const n = (diff % len) + 1;
  return { n, len, deload: n === len, nextDeload: addDaysISO(weekStart, (len - n) * 7) };
}

export const coachIsDeloadWeek = (coach, weekStart) => {
  if ((coach.deloadWeeks || []).includes(weekStart)) return true;
  const c = coachCycleInfo(coach, weekStart);
  return !!(c && c.deload);
};
