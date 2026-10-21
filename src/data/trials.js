// Épreuves de rang : pour franchir un nouveau rang, il ne suffit pas d'avoir assez d'EXP, il faut aussi
// réussir une épreuve (séances, régularité, exercices montés de niveau, calories). Tant qu'elle n'est pas réussie,
// le niveau reste bloqué juste avant le rang ; l'EXP gagnée continue de s'accumuler en réserve.
import { getAllEntries } from '../lib/quests';
import { weekStreak } from '../lib/xp';

/** Conditions par rang (clé = niveau du rang). */
export const RANK_TRIALS = {
  4: { days: 3 },
  8: { days: 12, streak: 3 },
  14: { days: 40, streak: 6, leveled: 2 },
  22: { days: 90, streak: 10, leveled: 5, kcal: 25000 },
  35: { days: 180, streak: 20, leveled: 8, kcal: 60000 },
  50: { days: 300, streak: 30, leveled: 12, kcal: 100000 },
};

const LABELS = {
  days: n => `${n} jours d’entraînement`,
  streak: n => `${n} semaines d’affilée avec au moins une séance`,
  leveled: n => `${n} exercices passés au niveau 2 ou plus`,
  kcal: n => `${n.toLocaleString('fr-FR')} kcal brûlées au total`,
};

/** Avancement d'une épreuve : liste de tâches (valeur actuelle / objectif) et réussite globale. */
export function evaluateTrial(minLevel, state, today) {
  const rules = RANK_TRIALS[minLevel] || {};
  const entries = getAllEntries(state);
  const values = {
    days: new Set(entries.map(e => e.date)).size,
    streak: weekStreak(state, today),
    leveled: (state.quests || []).filter(q => (Number(q.level) || 1) >= 2).length,
    kcal: Math.round(entries.reduce((sum, e) => sum + (Number(e.calories) || 0), 0)),
  };
  const tasks = Object.entries(rules).map(([key, target]) => ({
    key,
    label: LABELS[key](target),
    current: Math.min(values[key], target),
    target,
    done: values[key] >= target,
  }));
  return { tasks, done: tasks.every(t => t.done) };
}
