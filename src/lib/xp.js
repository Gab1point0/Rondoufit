import { addDaysISO, getWeekStart } from './dates';
import { getAllEntries } from './quests';

// Règles d'EXP :
//  - 'session' : séance, course, dictée vocale → bonus de régularité, puis plafond du jour ;
//  - 'minor'   : petits gains (ajouter un exercice, une pesée) → plafond du jour seulement ;
//  - 'reward'  : trophées, défis, objectifs de la semaine, objectif d'exercice validé → EXP telle quelle.
// Le plafond du jour évite de gonfler son niveau en saisissant plein de petites séances : au-delà de
// DAILY_FULL_XP EXP gagnées dans la journée, l'EXP de séance ne compte plus qu'à moitié.
export const DAILY_FULL_XP = 600;
export const STREAK_STEP_PCT = 10;   // +10 % par semaine d'affilée…
export const STREAK_MAX_PCT = 50;    // …jusqu'à +50 %
const KEEP_WEEKS = 60;

/**
 * Nombre de semaines (lundi → dimanche) d'affilée avec au moins une séance.
 * `includeCurrent: false` ne compte que les semaines terminées (sert au bonus : la semaine en cours ne le fait pas monter).
 */
export function weekStreak(state, today, { includeCurrent = true } = {}) {
  const weeks = new Set(getAllEntries(state).map(e => getWeekStart(e.date)));
  let w = getWeekStart(today);
  if (!includeCurrent || !weeks.has(w)) w = addDaysISO(w, -7);
  let n = 0;
  while (weeks.has(w)) {
    n++;
    w = addDaysISO(w, -7);
  }
  return n;
}

export const streakBonusPct = (state, today) =>
  Math.min(STREAK_MAX_PCT, STREAK_STEP_PCT * weekStreak(state, today, { includeCurrent: false }));

/**
 * Calcule l'EXP réellement gagnée et les champs d'état à mettre à jour.
 * @returns {{ gained: number, bonusPct: number, reduced: boolean, patch: object }}
 */
export function computeXp(state, base, today, kind = 'session') {
  let amount = Math.max(0, Math.round(base));
  let bonusPct = 0;
  if (kind === 'session') {
    bonusPct = streakBonusPct(state, today);
    amount = Math.round(amount * (1 + bonusPct / 100));
  }
  const dayEarned = state.xpDaily && state.xpDaily.date === today ? state.xpDaily.earned : 0;
  let reduced = false;
  if (kind !== 'reward') {
    const full = Math.max(0, Math.min(amount, DAILY_FULL_XP - dayEarned));
    const rest = amount - full;
    if (rest > 0) {
      reduced = true;
      amount = full + Math.round(rest / 2);
    }
  }
  const ws = getWeekStart(today);
  const weeks = { ...(state.xpWeeks || {}), [ws]: ((state.xpWeeks || {})[ws] || 0) + amount };
  const keys = Object.keys(weeks).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_WEEKS))) delete weeks[k];
  return {
    gained: amount,
    bonusPct,
    reduced,
    patch: {
      xp: (Number(state.xp) || 0) + amount,
      xpWeeks: weeks,
      xpDaily: kind === 'reward' ? state.xpDaily : { date: today, earned: dayEarned + amount },
    },
  };
}

/** Phrase à ajouter au message d'une séance quand un bonus ou le plafond du jour a joué. */
export function xpNote(award) {
  return (award.bonusPct > 0 ? ` • bonus régularité +${award.bonusPct} %` : '') + (award.reduced ? ' • EXP réduite (plafond du jour atteint)' : '');
}
