import { describe, expect, it } from 'vitest';
import { EXERCISE_CATALOG } from '../data/catalog';
import { relativeStrength, suggestStart } from './startSuggestion';

const TODAY = '2026-10-21';
const cat = id => EXERCISE_CATALOG.find(c => c.id === id);
const entry = (id, date, sets, value) => ({ id, date, value, sets: sets.length, reps: Math.max(...sets), setDetails: sets, assistanceKg: 0, rpe: 8, calories: 60, note: '' });
const quest = (catalogId, history, extra = {}) => {
  const c = cat(catalogId);
  return { id: 'q_' + catalogId, catalogId, name: c.name, category: c.category, type: 'strength', unit: c.unit, level: 1, startValue: c.defaultStart, currentValue: c.defaultStart, goalValue: c.defaultGoal, goalSets: 3, goalReps: c.defaultGoalReps, history, ...extra };
};
const stateWith = (quests, extra = {}) => ({ quests, userWeightKg: 80, weightHistory: [], ...extra });

describe('niveau relatif de force', () => {
  it('sans maximum connu : niveau 1 (valeurs du catalogue)', () => {
    expect(relativeStrength(stateWith([]), 'Pectoraux', TODAY, EXERCISE_CATALOG)).toEqual({ level: 1, used: [] });
    // un exercice sans aucune vraie séance n'apporte rien
    const sansSeance = stateWith([quest('bench_press', [])]);
    expect(relativeStrength(sansSeance, 'Pectoraux', TODAY, EXERCISE_CATALOG).used).toEqual([]);
  });

  it('un utilisateur deux fois plus fort qu’un débutant a un niveau proche de 2', () => {
    const c = cat('bench_press'); // départ 40 kg
    const fort = quest('bench_press', [entry('a', '2026-10-15', [11, 11, 11], c.defaultStart * 2)]); // 80 kg × 11
    const r = relativeStrength(stateWith([fort]), 'Pectoraux', TODAY, EXERCISE_CATALOG);
    expect(r.level).toBeGreaterThan(1.7);
    expect(r.level).toBeLessThan(2.3);
    expect(r.used).toEqual([c.name]);
  });

  it('le record réel saisi prime sur l’estimation, et le niveau est borné', () => {
    const q = quest('bench_press', [entry('a', '2026-10-15', [8, 8, 8], 40)]);
    const sans = relativeStrength(stateWith([q]), 'Pectoraux', TODAY, EXERCISE_CATALOG).level;
    const avec = relativeStrength(stateWith([q], { maxRecords: { [q.id]: { kg: 150 } } }), 'Pectoraux', TODAY, EXERCISE_CATALOG).level;
    expect(avec).toBeGreaterThan(sans);
    const enorme = relativeStrength(stateWith([q], { maxRecords: { [q.id]: { kg: 900 } } }), 'Pectoraux', TODAY, EXERCISE_CATALOG).level;
    expect(enorme).toBe(2.5);
  });
});

describe('départ d’un nouvel exercice', () => {
  const fort = quest('bench_press', [entry('a', '2026-10-15', [11, 11, 11], 80)]);

  it('automatique : valeur du catalogue × niveau de force (exercice de la même arène)', () => {
    const c = cat('fp_incline_barbell');
    const s = suggestStart(c, stateWith([fort]), TODAY, EXERCISE_CATALOG);
    expect(s.profile).toBeNull();
    expect(s.startValue).toBeGreaterThan(c.defaultStart * 1.6);
    expect(s.goalValue).toBeGreaterThan(s.startValue);
    expect(s.goalSets).toBe(c.defaultGoalSets || 3);
    expect(s.goalReps).toBe(c.defaultGoalReps);
    expect(s.note).toContain('d’après tes maxima');
    expect(s.note).toContain(fort.name);
  });

  it('sans aucun maximum : le catalogue tel quel, avec le dire', () => {
    const c = cat('squat');
    const s = suggestStart(c, stateWith([]), TODAY, EXERCISE_CATALOG);
    expect(s.startValue).toBe(c.defaultStart);
    expect(s.note).toContain('aucun maximum connu');
  });

  it('avec un profil : séries, répétitions visées et charge suivent le profil', () => {
    const c = cat('fp_incline_barbell');
    const base = stateWith([fort]);
    const hyper = suggestStart(c, { ...base, coach: { workProfile: 'hypertrophie' } }, TODAY, EXERCISE_CATALOG);
    const power = suggestStart(c, { ...base, coach: { workProfile: 'puissance' } }, TODAY, EXERCISE_CATALOG);
    const endu = suggestStart(c, { ...base, coach: { workProfile: 'endurance' } }, TODAY, EXERCISE_CATALOG);
    expect(power.goalReps).toBe(5);
    expect(hyper.goalReps).toBe(12);
    expect(endu.goalReps).toBe(20);
    expect(power.startValue).toBeGreaterThan(hyper.startValue); // plus lourd en puissance
    expect(hyper.startValue).toBeGreaterThan(endu.startValue); // plus léger en endurance
    expect(power.note).toContain('Profil Puissance');
    expect(hyper.profile).toBe('hypertrophie');
  });

  it('le profil du cycle en cours est celui qui s’applique', () => {
    const c = cat('fp_incline_barbell');
    const state = { ...stateWith([fort]), coach: { workProfile: 'auto', cycleWeeks: 4, cycleStart: '2026-10-05', cycleProfiles: ['puissance', 'endurance'] } };
    expect(suggestStart(c, state, TODAY, EXERCISE_CATALOG).profile).toBe('puissance');
    expect(suggestStart(c, state, '2026-11-02', EXERCISE_CATALOG).profile).toBe('endurance');
  });

  it('exercice en répétitions : le profil règle séries et répétitions, pas de charge inventée', () => {
    const c = EXERCISE_CATALOG.find(x => x.unit === 'reps' && x.type === 'strength' && !x.timed && x.defaultStartAssistance);
    if (!c) return;
    const s = suggestStart(c, { ...stateWith([fort]), coach: { workProfile: 'puissance' } }, TODAY, EXERCISE_CATALOG);
    expect(s.startValue).toBe(c.defaultStart);
    expect(s.goalReps).toBe(5);
    expect(s.goalValue).toBe(5);
  });

  it('cardio et exercices chronométrés : inchangés', () => {
    const run = EXERCISE_CATALOG.find(x => x.type === 'cardio');
    const s = suggestStart(run, { ...stateWith([fort]), coach: { workProfile: 'puissance' } }, TODAY, EXERCISE_CATALOG);
    expect(s.startValue).toBe(run.defaultStart);
    expect(s.note).toBe('');
  });
});
