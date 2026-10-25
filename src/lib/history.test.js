import { describe, expect, it } from 'vitest';
import { computeExerciseTarget } from '../coach/targets';
import { defaultEntryNote, questAfterHistoryChange, rebuildEntry } from './history';

const TODAY = '2026-10-21';
const entry = (id, date, sets, assistanceKg, extra = {}) => ({
  id, date, value: Math.max(...sets), sets: sets.length, reps: Math.max(...sets), setDetails: sets,
  validatedSets: sets.filter(r => r >= 10).length, goalSets: 3, goalReps: 10, assistanceKg, rpe: 8, calories: 50, note: '', ...extra,
});
// Dips assistés : objectif 3 × 10, 10 kg d'aide
const dips = history => ({
  id: 'q_dips', name: 'Dips Assistés', category: 'Pectoraux', type: 'strength', unit: 'reps', level: 1,
  startValue: 6, currentValue: 10, goalValue: 10, goalSets: 3, goalReps: 10, startAssistanceKg: 15,
  currentAssistanceKg: 10, goalAssistanceKg: 0, setDetails: [10, 10, 10], history,
});
const withNote = (q, e) => ({ ...e, note: defaultEntryNote(q, e) });

describe('correction d’une séance', () => {
  it('recalcule la meilleure série, les séries validées, les calories et la note automatique', () => {
    const q = dips([]);
    const faux = withNote(q, entry('h2', '2026-10-19', [10, 10, 9], 10));
    expect(faux.note).toContain('10 - 10 - 9');
    expect(faux.validatedSets).toBe(2);
    const bon = rebuildEntry(q, faux, { setDetails: ['10', '10', '10'] }, 82);
    expect(bon.setDetails).toEqual([10, 10, 10]);
    expect(bon.validatedSets).toBe(3);
    expect(bon.reps).toBe(10);
    expect(bon.calories).toBeGreaterThan(0);
    expect(bon.note).toContain('10 - 10 - 10');
    expect(bon.id).toBe('h2'); // même séance, simplement corrigée
  });

  it('garde une note écrite à la main', () => {
    const q = dips([]);
    const e = { ...entry('h1', '2026-10-19', [8, 8, 8], 10), note: 'Super séance !' };
    expect(rebuildEntry(q, e, { setDetails: [9, 9, 9] }, 82).note).toBe('Super séance !');
  });

  it('remet l’exercice à jour d’après la dernière séance (aide, séries) et garde l’ordre des dates', () => {
    const q = dips([entry('h1', '2026-10-12', [10, 10, 10], 15), entry('h2', '2026-10-19', [10, 10, 9], 10)]);
    const corrige = q.history.map(h => (h.id === 'h1' ? rebuildEntry(q, h, { date: '2026-10-21', assistanceKg: 12.5 }, 82) : h));
    const apres = questAfterHistoryChange(q, corrige);
    expect(apres.history.map(h => h.id)).toEqual(['h2', 'h1']); // h1 est maintenant la plus récente
    expect(apres.currentAssistanceKg).toBe(12.5);
    expect(apres.setDetails).toEqual([10, 10, 10]);
  });

  it('cas réel : un 9 saisi à la place d’un 10 faisait reculer le coach, la correction le fait avancer', () => {
    const base = [entry('h1', '2026-10-14', [10, 9, 9], 10)];
    const q = dips([...base, withNote(dips([]), entry('h2', '2026-10-19', [10, 10, 9], 10))]);
    const avant = computeExerciseTarget(q, { today: TODAY });
    expect(avant.change).toBe('down'); // 2 séances de suite sous l'objectif à la même aide → l'aide remonte
    expect(avant.assist).toBe(12.5);
    const corrige = questAfterHistoryChange(q, q.history.map(h => (h.id === 'h2' ? rebuildEntry(q, h, { setDetails: [10, 10, 10] }, 82) : h)));
    const apres = computeExerciseTarget(corrige, { today: TODAY });
    expect(apres.change).toBe('assist_down'); // 3 × 10 réussis → on réduit l'aide
    expect(apres.assist).toBe(7.5);
  });
});

describe('aller à l’encontre du coach', () => {
  const q0 = () => dips([entry('h1', '2026-10-14', [10, 9, 9], 10), entry('h2', '2026-10-19', [10, 10, 9], 10)]);

  it('applique le choix de l’utilisateur et garde la proposition du coach', () => {
    const q = { ...q0(), coachOverride: { entries: 2, assist: 7.5 } }; // « je veux moins d'aide » malgré le recul proposé
    const t = computeExerciseTarget(q, { today: TODAY });
    expect(t.manual).toBe(true);
    expect(t.change).toBe('manual');
    expect(t.assist).toBe(7.5);
    expect(t.suggested.assist).toBe(12.5);
    expect(t.suggested.change).toBe('down');
    expect(t.reason).toContain('Ta décision');
  });

  it('le choix ne vaut que jusqu’à la prochaine séance de l’exercice', () => {
    const q = { ...q0(), coachOverride: { entries: 2, assist: 7.5 } };
    q.history = [...q.history, entry('h3', '2026-10-21', [10, 10, 10], 7.5)];
    const t = computeExerciseTarget(q, { today: TODAY });
    expect(t.manual).toBe(false);
    expect(t.change).not.toBe('manual');
  });

  it('charge et répétitions : le choix agit aussi', () => {
    const squat = {
      id: 'q_s', name: 'Squat Barre', category: 'Jambes', type: 'strength', unit: 'kg', level: 1, startValue: 60, currentValue: 60,
      goalValue: 100, goalSets: 3, goalReps: 6, setDetails: [6, 6, 6],
      history: [{ id: 's1', date: '2026-10-19', value: 60, sets: 3, reps: 6, setDetails: [6, 6, 6], rpe: 7, note: '' }],
    };
    const coach = computeExerciseTarget(squat, { today: TODAY });
    expect(coach.change).toBe('up');
    const choisi = computeExerciseTarget({ ...squat, coachOverride: { entries: 1, load: 60 } }, { today: TODAY });
    expect(choisi.load).toBe(60); // « non, je garde la même charge »
    expect(choisi.suggested.load).toBe(coach.load);
    const poids = { ...squat, unit: 'reps', startAssistanceKg: 0, currentAssistanceKg: 0 };
    const base = computeExerciseTarget(poids, { today: TODAY }).targetReps[0];
    const plusDur = computeExerciseTarget({ ...poids, coachOverride: { entries: 1, repsDelta: 2 } }, { today: TODAY });
    expect(plusDur.targetReps[0]).toBe(base + 2);
  });
});
