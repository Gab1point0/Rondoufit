import { describe, expect, it } from 'vitest';
import { coachDayAdvice } from '../coach/advice';
import { coachDayInfo } from '../coach/planning';
import { getCoachSettings } from '../coach/settings';
import { EXERCISE_CATALOG } from './catalog';
import { SPORTS, sportInfo } from './sports';

describe('sport régulier adapté', () => {
  it('chaque sport a une fiche complète et des exercices de préparation qui existent au catalogue', () => {
    for (const s of SPORTS) {
      for (const k of ['id', 'label', 'cap', 'de', 'poss', 'icon', 'title', 'intro', 'note']) expect(s[k], `${s.id}.${k}`).toBeTruthy();
      expect(s.exercises.length, s.id).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(s.sources), `${s.id}.sources`).toBe(true);
      if (s.id !== 'autre') expect(s.sources.length, `${s.id}: au moins une étude`).toBeGreaterThanOrEqual(1);
      for (const src of s.sources) { expect(src.text && src.use, s.id).toBeTruthy(); expect(typeof src.ok).toBe('boolean'); if (src.url) expect(src.url).toMatch(/^https:\/\//); }
      for (const id of s.exercises) expect(EXERCISE_CATALOG.some(c => c.id === id), `${s.id} → ${id}`).toBe(true);
    }
  });

  it('version classique (lien public) : aucun sport par défaut ; l’édition privée de Gabin garde le volley ; un sport non précisé donne « sport »', () => {
    expect(sportInfo(undefined).id).toBe('autre'); // (ici : version classique, comme le lien public)
    expect(sportInfo('').label).toBe('sport');
    expect(sportInfo('inconnu').label).toBe('sport');
    expect(getCoachSettings({ coach: {} }).sport).toBe('');
  });

  it('le jour d’un match de football, le coach parle de football (mêmes contraintes que le volley)', () => {
    // jeudi 22/10/2026 : football ce jour-là, jambes interdites la veille
    const state = { coach: { sport: 'football', volleyDays: [4], matchDates: [] } };
    const jeudi = coachDayInfo('2026-10-22', getCoachSettings(state));
    expect(jeudi.isVolley).toBe(true);
    expect(jeudi.legsOk).toBe(false);
    expect(jeudi.legsWhy).toBe('jour de football');
    const mercredi = coachDayInfo('2026-10-21', getCoachSettings(state));
    expect(mercredi.legsWhy).toBe('football demain');
    const conseils = coachDayAdvice(state, '2026-10-22').map(c => c.text).join(' ');
    expect(conseils).toContain('Football ce soir');
    expect(conseils).not.toMatch(/volley/i);
    expect(conseils).not.toContain('échauffement d’épaules'); // propre aux sports qui sollicitent l’épaule
    const tennis = coachDayAdvice({ coach: { sport: 'tennis', volleyDays: [4] } }, '2026-10-22').map(c => c.text).join(' ');
    expect(tennis).toContain('échauffement d’épaules');
  });

  it('élision correcte (« d’escalade »)', () => {
    const j = coachDayInfo('2026-10-22', getCoachSettings({ coach: { sport: 'escalade', volleyDays: [4] } }));
    expect(j.legsWhy).toBe('jour d’escalade');
  });
});
