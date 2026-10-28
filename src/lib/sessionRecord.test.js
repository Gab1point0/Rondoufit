import { describe, expect, it } from 'vitest';
import { applyStrengthSession } from './sessionRecord';

const base = { id: 'q1', name: 'Développé Couché Barre', type: 'strength', unit: 'kg', level: 1, goalSets: 3, goalReps: 6, startValue: 40, currentValue: 40, goalValue: 100, setDetails: [6, 6, 6], history: [] };

describe('enregistrement d’une séance de musculation', () => {
  it('3 séries validées : entrée d’historique, record, EXP et trophée « maître des séries »', () => {
    const r = applyStrengthSession(base, { date: '2026-10-21', setDetails: [6, 6, 6], loads: [45, 45, 45], rpe: 7, calories: 100 });
    expect(r.quest.currentValue).toBe(45);
    expect(r.entry).toMatchObject({ date: '2026-10-21', value: 45, sets: 3, reps: 6, validatedSets: 3, rpe: 7, calories: 100 });
    expect(r.entry.setLoads).toBeUndefined(); // charges identiques : pas de détail par série
    expect(r.unlocked).toContain('sets_master');
    expect(r.xp).toBe(50 + 15 + 150);
    expect(r.banner.title).toBe('Format 3×6 Validé !');
    expect(r.quest.history).toHaveLength(1);
  });

  it('charge différente selon la série : détail gardé, record = la plus lourde, note avec « → »', () => {
    const r = applyStrengthSession(base, { date: '2026-10-21', setDetails: [6, 6, 5], loads: [40, 40, 45], rpe: 8, calories: 80 });
    expect(r.entry.setLoads).toEqual([40, 40, 45]);
    expect(r.entry.value).toBe(45);
    expect(r.entry.note).toContain('40 → 45 kg');
  });

  it('aide élastique réduite : trophée et bonus d’EXP', () => {
    const q = { ...base, unit: 'reps', currentAssistanceKg: 15, startValue: 4, currentValue: 6, goalValue: 8, setDetails: [6, 6, 4] };
    const r = applyStrengthSession(q, { date: '2026-10-21', setDetails: [6, 6, 4], assists: [10, 10, 10], rpe: 7, calories: 60 });
    expect(r.unlocked).toContain('elastic_drop');
    expect(r.entry.assistanceKg).toBe(10);
    expect(r.quest.currentAssistanceKg).toBe(10);
    expect(r.xp).toBeGreaterThanOrEqual(50 + 9 + 100);
  });

  it('séance guidée : note automatique « Séance guidée … »', () => {
    const r = applyStrengthSession(base, { date: '2026-10-21', setDetails: [6, 6], loads: [45, 45], rpe: 7, calories: 50, guidedLabel: 'A' });
    expect(r.entry.note).toContain('Séance guidée A');
    expect(r.entry.note).toContain('6 - 6 reps');
  });

  it('une note écrite par l’utilisateur remplace la note automatique', () => {
    const r = applyStrengthSession(base, { date: '2026-10-21', setDetails: [6], loads: [45], rpe: 7, calories: 30, note: 'Super forme' });
    expect(r.entry.note).toBe('Super forme');
  });
});
