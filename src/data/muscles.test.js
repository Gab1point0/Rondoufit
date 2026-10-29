import { afterEach, describe, expect, it } from 'vitest';
import { FAMILIES, INFO_FAMILY } from '../anim/info';
import { coachBalance } from '../coach/advice';
import { coachDayInfo } from '../coach/planning';
import { coachBuildPlanned } from '../coach/sessions';
import { COACH_ARENAS, getCoachSettings } from '../coach/settings';
import { composeTemplates } from '../coach/targets';
import { applyOnboarding } from '../lib/onboarding';
import { ARENA_GROUPS } from './arenas';
import { EXERCISE_CATALOG } from './catalog';
import { INITIAL_STATE } from './initialState';
import { FINE_BY_CATALOG_ID } from './fineGroups.generated';
import { fineFromText } from './fineRules';
import { FINE_GROUPS, arenaBand, arenaLabel, arenasOf, hasArena, secondGroupOf, arenaOf, arenaTier, fineGroupOf, isLegArena, setMuscleMode, typeArenas } from './muscles';

afterEach(() => setMuscleMode('simple'));

const FINE_IDS = FINE_GROUPS.map(g => g.id);
const OVERRIDES = { chinUp: 'Dos', deadHang: 'Dos', deadlift: 'Fessiers' }; // identiques à tools/make-fine-groups.mjs

describe('mode optimisé : cartographie des muscles', () => {
  it('chaque exercice de musculation du catalogue a un muscle précis valide, et la table générée est à jour avec les fiches de mouvement', () => {
    for (const c of EXERCISE_CATALOG.filter(x => x.type === 'strength')) {
      expect(FINE_IDS, c.id).toContain(fineGroupOf({ ...c, catalogId: c.id }));
      const g = FINE_BY_CATALOG_ID[c.id];
      const fam = INFO_FAMILY[c.id];
      if (!fam) { expect(g).toBeUndefined(); continue; } // pas de fiche (ex. burpees) : on se rabat sur le nom ou le grand groupe
      expect(g, `${c.id} (table à regénérer : npx vite-node tools/make-fine-groups.mjs)`).toBe(OVERRIDES[fam] || fineFromText(FAMILIES[fam].m) || undefined);
    }
  });

  it('exemples : biceps, triceps, avant-bras, ischios, mollets, fessiers, adducteurs', () => {
    const of = id => fineGroupOf({ ...EXERCISE_CATALOG.find(c => c.id === id), catalogId: id });
    expect(of('barbell_curl')).toBe('Biceps');
    expect(of('fp_pushdown')).toBe('Triceps');
    expect(of('fp_wrist_curl')).toBe('Avant-bras');
    expect(of('fp_leg_curl_lying')).toBe('Ischio-jambiers');
    expect(of('fp_calf_standing')).toBe('Mollets');
    expect(of('fp_hip_thrust_bar')).toBe('Fessiers');
    expect(of('fp_adductors')).toBe('Hanches');
    expect(of('squat')).toBe('Quadriceps');
    expect(of('bench_press')).toBe('Pectoraux');
  });

  it('exercice personnalisé : muscle choisi à la main, sinon deviné d’après le nom, sinon grand groupe ; cardio inchangé', () => {
    expect(fineGroupOf({ name: 'Mon exercice', category: 'Épaules & Bras', type: 'strength', muscle: 'Triceps' })).toBe('Triceps');
    expect(fineGroupOf({ name: 'Curl spécial poulie', category: 'Épaules & Bras', type: 'strength' })).toBe('Biceps');
    expect(fineGroupOf({ name: 'Machine inconnue', category: 'Jambes', type: 'strength' })).toBe('Quadriceps');
    expect(fineGroupOf({ name: 'Footing', category: 'Course & Cardio', type: 'cardio' })).toBe('Course & Cardio');
  });

  it('le mode change les listes : 5 grands groupes en simple, 14 muscles en optimisé (le coach et l’interface lisent les mêmes listes)', () => {
    expect(COACH_ARENAS).toHaveLength(5);
    expect(ARENA_GROUPS.map(g => g.id)).toContain('Jambes');
    setMuscleMode('optimized');
    expect(COACH_ARENAS).toHaveLength(14);
    expect(ARENA_GROUPS.map(g => g.id)).toEqual(expect.arrayContaining(['Biceps', 'Triceps', 'Avant-bras', 'Quadriceps', 'Mollets', 'Course & Cardio']));
    expect(ARENA_GROUPS.map(g => g.id)).not.toContain('Jambes');
    const squat = EXERCISE_CATALOG.find(c => c.id === 'squat');
    expect(arenaOf({ ...squat, catalogId: 'squat' })).toBe('Quadriceps');
    setMuscleMode('simple');
    expect(arenaOf({ ...squat, catalogId: 'squat' })).toBe('Jambes');
    expect(COACH_ARENAS).toHaveLength(5);
  });
});

// Un utilisateur qui a un exercice pour chaque muscle
const IDS = ['bench_press', 'barbell_row', 'overhead_press', 'squat', 'fp_leg_curl_lying', 'fp_hip_thrust_bar', 'barbell_curl', 'fp_pushdown', 'crunches_floor',
  'fp_back_extension', 'fp_calf_standing', 'fp_wrist_curl', 'fp_adductors', 'fp_rotary_torso', 'incline_dumbbell', 'lat_pulldown', 'fp_lateral_db'];
const stateWith = () => applyOnboarding(INITIAL_STATE, { name: 'T', weightKg: 70, goal: 'muscle', sessionsPerWeek: 2, sessionMinutes: 75, muscleMode: 'optimized', exercises: IDS.map(catalogId => ({ catalogId })) }, '2026-10-21');

describe('mode optimisé : le coach', () => {
  it('l’assistant enregistre le mode et crée les exercices', () => {
    const s = stateWith();
    expect(s.muscleMode).toBe('optimized');
    expect(s.quests).toHaveLength(IDS.length);
    expect(applyOnboarding(INITIAL_STATE, { weightKg: 70, exercises: [] }, '2026-10-21').muscleMode).toBe('simple');
  });

  it('répartition en séances : les grands muscles dans chaque séance, les petits (mollets, avant-bras, obliques…) en rotation mais tous présents dans la semaine', () => {
    setMuscleMode('optimized');
    const s = stateWith();
    const t = composeTemplates(s.quests, 2);
    const arenasOf = tpl => new Set(tpl.quests.map(arenaOf));
    for (const a of FINE_IDS.filter(x => arenaTier(x) <= 2)) for (const tpl of t) expect(arenasOf(tpl).has(a), `${a} dans la séance ${tpl.id}`).toBe(true);
    const week = new Set([...arenasOf(t[0]), ...arenasOf(t[1])]);
    for (const a of FINE_IDS) expect(week.has(a), `${a} dans la semaine`).toBe(true);
    // les petits muscles ne sont pas tous dans la même séance
    const minorsPerSession = t.map(tpl => FINE_IDS.filter(x => arenaTier(x) === 3 && arenasOf(tpl).has(x)).length);
    expect(Math.min(...minorsPerSession)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...minorsPerSession)).toBeLessThan(FINE_IDS.filter(x => arenaTier(x) === 3).length);
  });

  it('séance construite : pas de jambes les jours interdits (quadriceps, ischios, fessiers, mollets, adducteurs), durée tenue, petits muscles sacrifiés d’abord', () => {
    setMuscleMode('optimized');
    const s = stateWith();
    const coach = getCoachSettings(s);
    const ok = coachBuildPlanned(s, { templateIdx: 0 }, coachDayInfo('2026-10-26', coach), {});
    expect(ok.exercises.some(e => isLegArena(e.arena))).toBe(true);
    const noLegs = coachBuildPlanned(s, { templateIdx: 0 }, { ...coachDayInfo('2026-10-26', coach), legsOk: false, legsWhy: 'volley demain' }, {});
    expect(noLegs.exercises.some(e => isLegArena(e.arena))).toBe(false);
    expect(noLegs.exercises.length).toBeGreaterThan(5);
    // séance courte : on retire d'abord les muscles de rotation
    const short = coachBuildPlanned(s, { templateIdx: 0 }, coachDayInfo('2026-10-26', coach), { minutes: 35 });
    const majors = short.exercises.filter(e => arenaTier(e.arena) === 1).length;
    const minors = short.exercises.filter(e => arenaTier(e.arena) === 3).length;
    expect(majors).toBeGreaterThanOrEqual(minors);
  });

  it('séance « jambes » / « haut du corps » (mode 3 séances) couvre bien chaque muscle de son type', () => {
    setMuscleMode('optimized');
    expect(typeArenas('LEGS')).toEqual(expect.arrayContaining(['Quadriceps', 'Ischio-jambiers', 'Fessiers', 'Mollets']));
    expect(typeArenas('UPPER')).toEqual(expect.arrayContaining(['Biceps', 'Triceps', 'Avant-bras', 'Dos', 'Pectoraux', 'Épaules']));
    expect(typeArenas('FB').every(a => arenaTier(a) < 3)).toBe(true);
    const s = stateWith();
    const coach = getCoachSettings(s);
    const upper = coachBuildPlanned(s, { type: 'UPPER' }, coachDayInfo('2026-10-26', coach), { minutes: 90 });
    const got = new Set(upper.exercises.map(e => e.arena));
    for (const a of ['Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps']) expect(got.has(a), a).toBe(true);
    expect([...got].some(a => isLegArena(a))).toBe(false);
  });

  it('bilan hebdomadaire : une ligne par muscle avec son propre repère de séries', () => {
    setMuscleMode('optimized');
    const s = stateWith();
    const b = coachBalance(s, '2026-10-21');
    expect(b.rows).toHaveLength(14);
    const biceps = b.rows.find(r => r.arena === 'Biceps');
    const quads = b.rows.find(r => r.arena === 'Quadriceps');
    expect(biceps.band.good).toBeLessThan(quads.band.good + 1);
    expect(b.rows.find(r => r.arena === 'Avant-bras').band.min).toBeLessThan(quads.band.min);
    setMuscleMode('simple');
    expect(coachBalance(s, '2026-10-21').rows).toHaveLength(5);
  });
});

describe('exercices à deux muscles', () => {
  const cat = id => ({ ...EXERCISE_CATALOG.find(c => c.id === id), catalogId: id });
  it('hip thrust : fessiers ET ischio-jambiers ; développé couché : un seul muscle', () => {
    setMuscleMode('optimized');
    expect(arenasOf(cat('fp_hip_thrust_bar'))).toEqual(['Fessiers', 'Ischio-jambiers']);
    expect(arenaOf(cat('fp_hip_thrust_bar'))).toBe('Fessiers');
    expect(arenaLabel(cat('fp_hip_thrust_bar'))).toBe('Fessiers + Ischio-jambiers');
    expect(arenasOf(cat('barbell_curl'))).toEqual(['Biceps', 'Avant-bras']);
    expect(arenasOf(cat('bench_press'))).toEqual(['Pectoraux']);
    expect(hasArena(cat('squat'), 'Fessiers')).toBe(true);
  });

  it('jamais deux fois le même muscle, et la table ne contient que des muscles valides', () => {
    for (const c of EXERCISE_CATALOG.filter(x => x.type === 'strength')) {
      const a = fineGroupOf({ ...c, catalogId: c.id }), b = secondGroupOf({ ...c, catalogId: c.id });
      if (b) { expect(FINE_IDS).toContain(b); expect(b).not.toBe(a); }
    }
  });

  it('exercice perso : 2e muscle choisi à la main, ou retiré (none) même si le catalogue en donne un', () => {
    setMuscleMode('optimized');
    expect(arenasOf({ name: 'Mon pont', category: 'Jambes', type: 'strength', muscle: 'Fessiers', muscle2: 'Lombaires' })).toEqual(['Fessiers', 'Lombaires']);
    expect(arenasOf({ ...cat('fp_hip_thrust_bar'), muscle2: 'none' })).toEqual(['Fessiers']);
    expect(arenasOf({ name: 'Mon pont', category: 'Jambes', type: 'strength', muscle: 'Fessiers', muscle2: 'Fessiers' })).toEqual(['Fessiers']);
  });

  it('mode simplifié : toujours un seul groupe', () => {
    expect(arenasOf(cat('fp_hip_thrust_bar'))).toEqual(['Jambes']);
  });

  it('le bilan compte la série pour les deux muscles', () => {
    setMuscleMode('optimized');
    const base = stateWith();
    const q = { ...cat('fp_hip_thrust_bar'), id: 'q_ht', type: 'strength', history: [{ date: '2026-10-20', sets: 4, setDetails: [8, 8, 8, 8], value: 60 }] };
    const rows = coachBalance({ ...base, quests: [q] }, '2026-10-21').rows;
    expect(rows.find(r => r.arena === 'Fessiers').avg).toBe(1);
    expect(rows.find(r => r.arena === 'Ischio-jambiers').avg).toBe(0.5); // 2e muscle = demi-série
    expect(rows.find(r => r.arena === 'Quadriceps').avg).toBe(0);
  });
});

describe('repères de séries sourcés', () => {
  it('chaque muscle a des repères cohérents (min < cible < max), quel que soit l’objectif et le niveau', () => {
    setMuscleMode('optimized');
    for (const g of FINE_GROUPS) for (const profile of [null, 'puissance', 'hypertrophie', 'endurance']) for (const beginner of [false, true]) {
      const b = arenaBand(g.id, { profile, beginner });
      expect(b.min, g.id).toBeGreaterThan(0);
      expect(b.good, g.id).toBeGreaterThan(b.min);
      expect(b.max, g.id).toBeGreaterThan(b.good);
      expect(['forte', 'moyenne', 'estimation']).toContain(b.evidence);
    }
  });

  it('valeurs de référence : biceps 4-8-18, triceps plus haut (Baz-Valle), force et débutant plus bas', () => {
    setMuscleMode('optimized');
    expect(arenaBand('Biceps')).toMatchObject({ min: 4, good: 8, max: 18 });
    expect(arenaBand('Triceps').max).toBeGreaterThan(arenaBand('Biceps').max);
    expect(arenaBand('Pectoraux', { profile: 'puissance' }).max).toBeLessThan(arenaBand('Pectoraux').max);
    expect(arenaBand('Pectoraux', { beginner: true }).good).toBeLessThan(arenaBand('Pectoraux').good);
    expect(arenaBand('Avant-bras').evidence).toBe('estimation');
    setMuscleMode('simple');
    expect(arenaBand('Jambes')).toMatchObject({ min: 6, good: 10 });
  });

  const withHistory = (id, sets, date = '2026-10-10') => {
    const base = stateWith();
    return { ...base, quests: base.quests.map(q => (q.catalogId === id ? { ...q, history: [...(q.history || []), ...[0, 1, 2, 3].map(i => ({ date: '2026-10-1' + i, sets, setDetails: Array(sets).fill(8), value: 60 }))] } : q)) };
  };

  it('trop de séries : statut « high » ; trop peu : « missing » (combien de séries il manque)', () => {
    setMuscleMode('optimized');
    const rows = coachBalance(withHistory('squat', 20), '2026-10-21').rows;
    const q = rows.find(r => r.arena === 'Quadriceps');
    expect(q.status).toBe('high');
    const low = rows.find(r => r.arena === 'Biceps');
    expect(low.status).toBe('low');
    expect(low.missing).toBeGreaterThan(0);
  });

  it('alerte d’équilibre : beaucoup de quadriceps, peu d’ischios', () => {
    setMuscleMode('optimized');
    const st = withHistory('squat', 6);
    const alerts = coachBalance({ ...st, quests: st.quests.filter(q => !['fp_leg_curl_lying', 'fp_hip_thrust_bar'].includes(q.catalogId)) }, '2026-10-21').alerts;
    expect(alerts.map(a => a.id)).toContain('hq');
    setMuscleMode('simple');
    expect(coachBalance(st, '2026-10-21').alerts).toEqual([]);
  });
});

describe('repos par muscle', () => {
  it('un muscle travaillé hier est laissé de côté (mode optimisé), mais pas en mode simplifié', () => {
    const base = stateWith();
    const st = { ...base, quests: base.quests.map(q => (q.catalogId === 'bench_press' ? { ...q, history: [{ date: '2026-10-20', sets: 3, setDetails: [8, 8, 8], value: 40 }] } : q)) };
    const coach = getCoachSettings(st);
    setMuscleMode('optimized');
    const opt = coachBuildPlanned(st, { templateIdx: 0 }, coachDayInfo('2026-10-21', coach), {});
    expect(opt.exercises.some(e => e.arena === 'Pectoraux' && e.questId === st.quests.find(q => q.catalogId === 'bench_press').id)).toBe(false);
    expect(opt.notes.join(' ')).toContain('Repos musculaire');
    setMuscleMode('simple');
    const sim = coachBuildPlanned(st, { templateIdx: 0 }, coachDayInfo('2026-10-21', coach), {});
    expect(sim.notes.join(' ')).not.toContain('Repos musculaire');
  });
});
