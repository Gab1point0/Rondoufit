import { describe, expect, it } from 'vitest';
import { PERCENT_TABLE, bodyweightFactor, estimateOneRm, estimateQuestMax, formatDuration, repsInReserve, riegel, workingLoads } from './maxima';

const TODAY = '2026-10-21';
const entry = (id, date, sets, value, extra = {}) => ({ id, date, value, sets: sets.length, reps: Math.max(...sets), setDetails: sets, rpe: 8, note: '', ...extra });
const bench = history => ({ id: 'q_b', name: 'Développé Couché Barre', type: 'strength', unit: 'kg', startValue: 40, currentValue: 70, history });

describe('estimation du 1RM à partir d’une série', () => {
  it('1 répétition = la charge elle-même', () => {
    expect(estimateOneRm(100, 1)).toMatchObject({ mean: 100, min: 100, max: 100, confidence: 'bonne' });
  });

  it('5 reps à 100 kg : valeurs connues des équations (Epley 116,7 ; Brzycki 112,5)', () => {
    const e = estimateOneRm(100, 5);
    expect(e.min).toBeGreaterThan(110);
    expect(e.max).toBeLessThan(120);
    expect(e.mean).toBeGreaterThan(112);
    expect(e.mean).toBeLessThan(118);
    expect(e.confidence).toBe('bonne');
  });

  it('plus la série est longue, moins l’estimation est fiable ; au-delà de 15 reps, pas d’estimation', () => {
    expect(estimateOneRm(60, 8).confidence).toBe('moyenne');
    expect(estimateOneRm(60, 12).confidence).toBe('faible');
    expect(estimateOneRm(60, 16)).toBeNull();
    expect(estimateOneRm(0, 5)).toBeNull();
  });

  it('l’effort ressenti ajoute des répétitions en réserve (3 au maximum)', () => {
    expect(repsInReserve(10)).toBe(0);
    expect(repsInReserve(8)).toBe(2);
    expect(repsInReserve(5)).toBe(3);
  });

  it('tableau de charges : 80 % ≈ 8 répétitions, arrondi au pas de la machine', () => {
    expect(PERCENT_TABLE.find(([p]) => p === 80)[1]).toBe(8);
    expect(workingLoads(100, 2.5).find(l => l.pct === 80)).toMatchObject({ reps: 8, kg: 80 });
    expect(workingLoads(93, 2.5).find(l => l.pct === 80).kg).toBe(75); // 74,4 → 75
  });
});

describe('maximum d’un exercice', () => {
  it('prend la meilleure série récente', () => {
    const q = bench([entry('a', '2026-10-01', [8, 8, 8], 60), entry('b', '2026-10-15', [5, 5, 4], 75)]);
    const r = estimateQuestMax(q, { weightHistory: [] }, { today: TODAY });
    expect(r.kind).toBe('load');
    expect(r.basis).toMatchObject({ reps: 5, load: 75, date: '2026-10-15' });
    expect(r.estimate).toBeGreaterThan(84);
    expect(r.estimate).toBeLessThan(90);
    expect(r.fromRecent).toBe(true);
    expect(r.confidence).toBe('bonne');
  });

  it('sans séance récente, utilise l’ancienne meilleure et le signale', () => {
    const q = bench([entry('a', '2026-03-01', [5, 5, 5], 70)]);
    const r = estimateQuestMax(q, {}, { today: TODAY });
    expect(r.fromRecent).toBe(false);
    expect(r.estimate).toBeGreaterThan(75);
  });

  it('avec l’effort ressenti, l’estimation monte (séance à RPE 8 = 2 répétitions en réserve)', () => {
    const q = bench([entry('a', '2026-10-15', [5, 5, 5], 70, { rpe: 8 })]);
    const sans = estimateQuestMax(q, {}, { today: TODAY }).estimate;
    const avec = estimateQuestMax(q, {}, { today: TODAY, useRpe: true }).estimate;
    expect(avec).toBeGreaterThan(sans);
  });

  it('exercice assisté : charge réelle = poids du corps − aide, et aide estimée pour 1 répétition', () => {
    const q = {
      id: 'q_d', name: 'Dips Assistés', type: 'strength', unit: 'reps', startAssistanceKg: 20, currentAssistanceKg: 10,
      history: [entry('a', '2026-10-15', [8, 8, 8], 8, { assistanceKg: 20 })],
    };
    const r = estimateQuestMax(q, { weightHistory: [{ date: '2026-10-01', weightKg: 80 }] }, { today: TODAY });
    expect(r.kind).toBe('assisted');
    expect(r.basis.load).toBe(60); // 80 − 20
    expect(r.bodyweight).toBe(80);
    expect(r.estimate).toBeGreaterThan(70);
    expect(r.assistFor1).toBeCloseTo(80 - r.estimate, 5);
    expect(r.assistFor1).toBeLessThan(10);
  });

  it('au poids du corps : pompes = 64 % du poids du corps, lest estimé pour 1 répétition', () => {
    expect(bodyweightFactor('Pompes')).toBe(0.64);
    expect(bodyweightFactor('Pompes sur les genoux')).toBe(0.49);
    expect(bodyweightFactor('Tractions')).toBe(1);
    const q = { id: 'q_t', name: 'Tractions Pronation', type: 'strength', unit: 'reps', history: [entry('a', '2026-10-15', [10, 8, 6], 10)] };
    const r = estimateQuestMax(q, { userWeightKg: 80 }, { today: TODAY });
    expect(r.kind).toBe('bodyweight');
    expect(r.extraFor1).toBeGreaterThan(15); // 10 tractions ≈ +20 kg possible sur 1 répétition
  });

  it('exercice chronométré : meilleure tenue observée', () => {
    const q = { id: 'q_p', name: 'Gainage Planche (en secondes)', type: 'strength', unit: 'reps', timed: true, history: [entry('a', '2026-10-10', [60, 75, 70], 75), entry('b', '2026-10-17', [80, 70, 65], 80)] };
    const r = estimateQuestMax(q, {}, { today: TODAY });
    expect(r.kind).toBe('timed');
    expect(r.best).toEqual({ seconds: 80, date: '2026-10-17' });
  });
});

describe('cardio : formule de Riegel', () => {
  it('25 min sur 5 km → environ 52 min 07 s sur 10 km', () => {
    expect(riegel(25, 5, 10)).toBeCloseTo(52.12, 1);
    expect(formatDuration(riegel(25, 5, 10))).toBe('52 min 07 s');
  });

  it('prédit d’après la meilleure sortie et n’affiche le marathon que pour une base d’au moins 10 km', () => {
    const q = { id: 'q_c', name: 'Course', type: 'cardio', unit: 'km', history: [{ id: 'a', date: '2026-10-10', value: 5, durationMin: 28 }, { id: 'b', date: '2026-10-17', value: 5, durationMin: 26 }] };
    const r = estimateQuestMax(q, {}, { today: TODAY });
    expect(r.base).toMatchObject({ km: 5, min: 26 });
    expect(r.predictions.map(p => p.km)).toEqual([5, 10, 21.1]);
    const long = { ...q, history: [{ id: 'a', date: '2026-10-10', value: 12, durationMin: 70 }] };
    expect(estimateQuestMax(long, {}, { today: TODAY }).predictions.map(p => p.km)).toEqual([5, 10, 21.1, 42.2]);
  });

  it('un record réel saisi à la main peut servir de base', () => {
    const q = { id: 'q_c', name: 'Course', type: 'cardio', unit: 'km', history: [{ id: 'a', date: '2026-10-10', value: 5, durationMin: 30 }] };
    const r = estimateQuestMax(q, { maxRecords: { q_c: { distanceKm: 5, minutes: 24, date: '2026-10-20' } } }, { today: TODAY });
    expect(r.base).toMatchObject({ min: 24, source: 'record' });
  });
});
