import { describe, expect, it } from 'vitest';
import { calculateCardioCalories as cardio, calculateStrengthCalories as strength, rpeFactor } from './calories';

// Valeurs de référence : calories NETTES (repos retiré). Repères : ACSM (course / marche), Compendium 2011 (MET).
describe('calories de course et de marche (équations ACSM)', () => {
  it('courir 10 km en 1 h à 70 kg ≈ 0,67 kcal par kg et par km', () => {
    expect(cardio({ cardioMode: 'run', distanceKm: 10, durationMin: 60, userWeightKg: 70 })).toBeGreaterThan(680);
    expect(cardio({ cardioMode: 'run', distanceKm: 10, durationMin: 60, userWeightKg: 70 })).toBeLessThan(720);
  });
  it('marcher 5 km en 1 h à 70 kg ≈ 175 kcal nettes (3,5 MET brut − repos)', () => {
    expect(cardio({ cardioMode: 'walk', distanceKm: 5, durationMin: 60, userWeightKg: 70 })).toBe(175);
  });
  it('la pente augmente la dépense : 4 km/h pendant 40 min à 10 % ≈ 3 fois la marche à plat', () => {
    const plat = cardio({ cardioMode: 'incline_walk', distanceKm: 2.67, durationMin: 40, elevationM: 0, userWeightKg: 80 });
    const pente = cardio({ cardioMode: 'incline_walk', distanceKm: 2.67, durationMin: 40, elevationM: 267, userWeightKg: 80 });
    expect(pente).toBeGreaterThan(plat * 2.5);
    expect(pente).toBeLessThan(plat * 4);
  });
  it('la marche rapide passe en douceur à la course (pas de saut à 7,2 km/h)', () => {
    const k = v => cardio({ cardioMode: 'walk', distanceKm: v, durationMin: 60, userWeightKg: 70 });
    expect(k(7.2) - k(7.0)).toBeLessThan(40);
    expect(k(8.0)).toBeGreaterThan(k(7.0));
    expect(k(6.0)).toBeLessThan(k(7.0));
  });
  it('la marche nordique dépense environ 20 % de plus que la marche', () => {
    const marche = cardio({ cardioMode: 'walk', distanceKm: 5, durationMin: 60, userWeightKg: 70 });
    const nordique = cardio({ cardioMode: 'nordic', distanceKm: 5, durationMin: 60, userWeightKg: 70 });
    expect(nordique / marche).toBeCloseTo(1.2, 1);
  });
});

describe('calories des activités annexes', () => {
  it('vélo : la dépense dépend de la vitesse (20 km/h ≈ 540 kcal/h, 30 km/h ≈ 990 kcal/h à 80 kg)', () => {
    const v = d => cardio({ cardioMode: 'fp_road_bike', distanceKm: d, durationMin: 60, userWeightKg: 80 });
    expect(v(20)).toBeGreaterThan(500);
    expect(v(20)).toBeLessThan(580);
    expect(v(30)).toBeGreaterThan(900);
    expect(v(30)).toBeLessThan(1080);
    expect(v(12)).toBeLessThan(v(20));
    // à vitesse égale, le VTT demande plus et le vélo électrique moins
    const base = v(20);
    expect(cardio({ cardioMode: 'fp_mtb', distanceKm: 20, durationMin: 60, userWeightKg: 80 })).toBeGreaterThan(base);
    expect(cardio({ cardioMode: 'fp_ebike', distanceKm: 20, durationMin: 60, userWeightKg: 80 })).toBeLessThan(base);
  });
  it('la montée à vélo ajoute l’énergie potentielle : 500 m à 80 kg ≈ 400 kcal', () => {
    const plat = cardio({ cardioMode: 'fp_road_bike', distanceKm: 30, durationMin: 90, elevationM: 0, userWeightKg: 80 });
    const montee = cardio({ cardioMode: 'fp_road_bike', distanceKm: 30, durationMin: 90, elevationM: 500, userWeightKg: 80 });
    expect(montee - plat).toBeGreaterThan(380);
    expect(montee - plat).toBeLessThan(440);
  });
  it('natation : plus on nage vite, plus on dépense', () => {
    const n = d => cardio({ cardioMode: 'fp_swim', distanceKm: d, durationMin: 60, userWeightKg: 75 });
    expect(n(2.0)).toBeLessThan(n(3.0));
    expect(n(3.0)).toBeLessThan(n(3.8));
  });
  it('rameur : 2 000 m en 8 min (2:00 / 500 m) à 80 kg ≈ 90 kcal nettes, et plus vite = bien plus', () => {
    const r = min => cardio({ cardioMode: 'rower', distanceKm: 2, durationMin: min, userWeightKg: 80 });
    expect(r(8)).toBeGreaterThan(80);
    expect(r(8)).toBeLessThan(100);
    expect(r(7)).toBeGreaterThan(r(8)); // même distance plus vite : puissance en v³ → plus de kcal
    expect(r(12)).toBeLessThan(r(8));
  });
  it('sport collectif : MET × intensité du ressenti (football 1 h 30 à 80 kg, RPE 7 ≈ 780 kcal)', () => {
    const k = cardio({ cardioMode: 'fp_football', durationMin: 90, rpe: 7, userWeightKg: 80 });
    expect(k).toBe(Math.round((7.0 * rpeFactor(7) - 1) * 80 * 1.5));
    expect(k).toBeGreaterThan(740);
    expect(k).toBeLessThan(820);
  });
  it('une activité douce à faible ressenti ne tombe jamais à zéro ni ne devient négative (pétanque 1 h, RPE 1)', () => {
    const k = cardio({ cardioMode: 'fp_petanque', durationMin: 60, rpe: 1, userWeightKg: 80 });
    expect(k).toBeGreaterThan(40);
    expect(k).toBeLessThan(120);
  });
  it('une courte activité n’est plus gonflée par un plancher de 20 kcal', () => {
    expect(cardio({ cardioMode: 'fp_petanque', durationMin: 5, rpe: 3, userWeightKg: 60 })).toBeLessThan(20);
  });
  it('facteur d’intensité : neutre à 6/10, borné', () => {
    expect(rpeFactor(6)).toBe(1);
    expect(rpeFactor(10)).toBeCloseTo(1.28, 2);
    expect(rpeFactor(1)).toBeCloseTo(0.65, 5);
    expect(rpeFactor(100)).toBe(1.35);
  });
  it('assault bike dépense plus qu’un vélo d’appartement tranquille', () => {
    const a = cardio({ cardioMode: 'assault_bike', durationMin: 30, userWeightKg: 80 });
    const b = cardio({ cardioMode: 'bike', durationMin: 30, userWeightKg: 80 });
    expect(a).toBeGreaterThan(b);
  });
});

describe('calories de musculation', () => {
  it('3 × 10 au développé couché à 60 kg pour 80 kg : de l’ordre de 30 à 60 kcal', () => {
    const k = strength({ unit: 'kg', weightKg: 60, setDetails: [10, 10, 10], rpe: 7, userWeightKg: 80 });
    expect(k).toBeGreaterThan(30);
    expect(k).toBeLessThan(60);
  });
  it('plus de séries ou une charge plus lourde dépensent plus', () => {
    const base = strength({ unit: 'kg', weightKg: 60, setDetails: [10, 10, 10], rpe: 7, userWeightKg: 80 });
    expect(strength({ unit: 'kg', weightKg: 60, setDetails: [10, 10, 10, 10, 10], rpe: 7, userWeightKg: 80 })).toBeGreaterThan(base);
    expect(strength({ unit: 'kg', weightKg: 100, setDetails: [10, 10, 10], rpe: 7, userWeightKg: 80 })).toBeGreaterThan(base);
  });
});
