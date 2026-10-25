import { describe, expect, it } from 'vitest';
import { computeExerciseTarget } from './targets';

const TODAY = '2026-10-21';
const entry = (id, date, sets, extra = {}) => ({
  id, date, value: extra.value ?? Math.max(...sets), sets: sets.length, reps: Math.max(...sets), setDetails: sets,
  assistanceKg: 0, rpe: 7, calories: 50, note: '', ...extra,
});
const squat = history => ({
  id: 'q_s', name: 'Squat Barre', category: 'Jambes', type: 'strength', unit: 'kg', level: 1, startValue: 60, currentValue: 60,
  goalValue: 120, goalSets: 3, goalReps: 6, setDetails: [6, 6, 6], history,
});
const dips = history => ({
  id: 'q_d', name: 'Dips Assistés', category: 'Pectoraux', type: 'strength', unit: 'reps', level: 1, startValue: 6, currentValue: 10,
  goalValue: 10, goalSets: 3, goalReps: 10, startAssistanceKg: 20, currentAssistanceKg: 15, goalAssistanceKg: 0, setDetails: [10, 10, 10], history,
});

describe('le coach utilise le ressenti de chaque exercice', () => {
  it('charge : un ressenti facile fait monter plus que d’habitude, un ressenti très dur fait consolider', () => {
    const sets = [6, 6, 6];
    const normal = computeExerciseTarget(squat([entry('a', '2026-10-19', sets, { value: 100, rpe: 7 })]), { today: TODAY });
    const facile = computeExerciseTarget(squat([entry('a', '2026-10-19', sets, { value: 100, rpe: 5 })]), { today: TODAY });
    const dur = computeExerciseTarget(squat([entry('a', '2026-10-19', sets, { value: 100, rpe: 10 })]), { today: TODAY });
    expect(normal.change).toBe('up');
    expect(facile.change).toBe('up');
    expect(facile.load).toBeGreaterThan(normal.load);
    expect(facile.reason).toContain('ressenti 5/10');
    expect(dur.change).toBe('hold');
    expect(dur.load).toBe(100);
  });

  it('aide : un ressenti facile réduit l’aide d’un cran de plus', () => {
    const sets = [10, 10, 10];
    const normal = computeExerciseTarget(dips([entry('a', '2026-10-19', sets, { assistanceKg: 15, rpe: 7 })]), { today: TODAY });
    const facile = computeExerciseTarget(dips([entry('a', '2026-10-19', sets, { assistanceKg: 15, rpe: 4 })]), { today: TODAY });
    expect(normal.assist).toBe(12.5);
    expect(facile.assist).toBe(10);
    expect(facile.change).toBe('assist_down');
  });

  it('deux séances sous l’objectif : le coach ne recule que si la dernière était vraiment dure', () => {
    const h = rpe => [entry('a', '2026-10-14', [5, 5, 5], { value: 100, rpe: 8 }), entry('b', '2026-10-19', [5, 5, 5], { value: 100, rpe })];
    const modere = computeExerciseTarget(squat(h(6)), { today: TODAY });
    expect(modere.change).toBe('hold'); // effort modéré : on garde la charge et on cherche une rép de plus
    expect(modere.load).toBe(100);
    const dur = computeExerciseTarget(squat(h(9)), { today: TODAY });
    expect(dur.change).toBe('down');
    expect(dur.load).toBeLessThan(100);
  });
});
