import { describe, expect, it } from 'vitest';
import { calculateCardioCalories, cardioHasElevation } from '../lib/calories';
import { ACTIVITIES, ACTIVITY_GROUPS, ACTIVITY_MET } from './activities';
import { EXERCISE_CATALOG } from './catalog';

const by = id => ACTIVITIES.find(a => a.id === id);

describe('activités annexes', () => {
  it('liste riche : sports collectifs, raquette, plein air, eau, cardio', () => {
    const n = g => ACTIVITIES.filter(a => a.group === g).length;
    expect(n('Sports collectifs')).toBeGreaterThanOrEqual(24);
    expect(n('Sports de raquette')).toBeGreaterThanOrEqual(5);
    expect(n('Plein air')).toBeGreaterThanOrEqual(15);
    expect(n('Eau & glisse')).toBeGreaterThanOrEqual(10);
    expect(n('Cardio salle & cours')).toBeGreaterThanOrEqual(8);
    for (const name of ['Football', 'Basket-ball', 'Handball', 'Rugby à XV', 'Beach-volley', 'Hockey sur glace', 'Ultimate (frisbee)', 'Randonnée', 'VTT', 'Natation (piscine)', 'Escalade (bloc / voie)', 'Ski alpin', 'Zumba / Danse fitness', 'Tennis', 'Padel']) {
      expect(ACTIVITIES.some(a => a.name === name), name).toBe(true);
    }
  });

  it('chaque activité est complète et cohérente', () => {
    const ids = ACTIVITIES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACTIVITIES) {
      expect(ACTIVITY_GROUPS, a.id).toContain(a.group);
      expect(['min', 'km'], a.id).toContain(a.unit);
      expect(a.met, a.id).toBeGreaterThanOrEqual(2.5);
      expect(a.met, a.id).toBeLessThanOrEqual(12);
      expect(a.goal, a.id).toBeGreaterThan(a.start);
      expect(EXERCISE_CATALOG.some(c => c.id === a.id && c.type === 'cardio' && c.group === a.group), a.id).toBe(true);
    }
  });

  it('le dénivelé n’existe que pour la course et la marche (extérieur ou tapis)', () => {
    const avec = EXERCISE_CATALOG.filter(c => c.type === 'cardio' && cardioHasElevation(c.cardioMode)).map(c => c.id).sort();
    expect(avec).toEqual(['brisk_walk', 'fp_hiking', 'fp_nordic', 'fp_orienteering', 'fp_trail', 'fp_treadmill', 'incline_walk', 'running_endurance', 'running_interval'].sort());
    for (const id of ['fp_football', 'fp_road_bike', 'fp_swim', 'fp_bike', 'fp_rower', 'volleyball', 'fp_climbing']) {
      const c = EXERCISE_CATALOG.find(x => x.id === id);
      expect(cardioHasElevation(c.cardioMode), id).toBe(false);
    }
  });

  it('calories : MET de l’activité, ajusté par le ressenti, sans dénivelé hors course / marche', () => {
    const foot = by('fp_football');
    const k7 = calculateCardioCalories({ cardioMode: foot.mode, durationMin: 60, rpe: 7, userWeightKg: 80 });
    expect(k7).toBe(Math.round((foot.met + 0.5 - 1) * 80)); // 7,0 MET + 0,5 − repos
    const k9 = calculateCardioCalories({ cardioMode: foot.mode, durationMin: 60, rpe: 9, userWeightKg: 80 });
    expect(k9).toBeGreaterThan(k7);
    const velo0 = calculateCardioCalories({ cardioMode: 'fp_road_bike', distanceKm: 30, durationMin: 60, elevationM: 0, userWeightKg: 80 });
    const velo500 = calculateCardioCalories({ cardioMode: 'fp_road_bike', distanceKm: 30, durationMin: 60, elevationM: 500, userWeightKg: 80 });
    expect(velo500).toBe(velo0);
    const flat = calculateCardioCalories({ cardioMode: 'hike', distanceKm: 6, durationMin: 90, elevationM: 0, userWeightKg: 80 });
    const hill = calculateCardioCalories({ cardioMode: 'hike', distanceKm: 6, durationMin: 90, elevationM: 600, userWeightKg: 80 });
    expect(hill).toBeGreaterThan(flat);
    expect(ACTIVITY_MET.fp_football).toBe(7);
  });
});
