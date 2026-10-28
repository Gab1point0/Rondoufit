import { describe, expect, it } from 'vitest';
import { calculateCardioCalories, cardioInputNote, resolveCardioInputs } from './calories';

describe('cardio : vitesse + durée et pente en %', () => {
  it('10 km/h pendant 5 min = 0,83 km', () => {
    const r = resolveCardioInputs({ inputMode: 'speed', speedKmh: 10, durationMin: 5 });
    expect(r.distanceKm).toBe(0.83);
    expect(r.elevationM).toBe(0);
  });

  it('marche 40 min à 4 km/h à 10 % : 2,67 km et 267 m de dénivelé', () => {
    const r = resolveCardioInputs({ inputMode: 'speed', speedKmh: 4, durationMin: 40, slopeMode: 'percent', slopePct: 10 });
    expect(r.distanceKm).toBe(2.67);
    expect(r.elevationM).toBe(267);
  });

  it('saisie classique inchangée ; la pente en % s’applique à la distance saisie', () => {
    expect(resolveCardioInputs({ distanceKm: 5, durationMin: 28, elevationM: 40 })).toEqual({ distanceKm: 5, elevationM: 40 });
    expect(resolveCardioInputs({ distanceKm: 3, durationMin: 30, slopeMode: 'percent', slopePct: 8 })).toEqual({ distanceKm: 3, elevationM: 240 });
  });

  it('les calories de la saisie en vitesse + % égalent celles de la même sortie en distance + mètres', () => {
    const r = resolveCardioInputs({ inputMode: 'speed', speedKmh: 4, durationMin: 40, slopeMode: 'percent', slopePct: 10 });
    const a = calculateCardioCalories({ cardioMode: 'incline_walk', distanceKm: r.distanceKm, durationMin: 40, elevationM: r.elevationM, userWeightKg: 80 });
    const b = calculateCardioCalories({ cardioMode: 'incline_walk', distanceKm: 2.67, durationMin: 40, elevationM: 267, userWeightKg: 80 });
    expect(a).toBe(b);
    const plat = calculateCardioCalories({ cardioMode: 'incline_walk', distanceKm: 2.67, durationMin: 40, elevationM: 0, userWeightKg: 80 });
    expect(a).toBeGreaterThan(plat * 1.5); // 10 % de pente double environ la dépense
  });

  it('la note automatique cite la vitesse et la pente', () => {
    expect(cardioInputNote({ inputMode: 'speed', speedKmh: 4, slopeMode: 'percent', slopePct: 10 })).toBe('à 4 km/h, pente 10 %');
    expect(cardioInputNote({ inputMode: 'distance', slopeMode: 'meters' })).toBe('');
  });
});
