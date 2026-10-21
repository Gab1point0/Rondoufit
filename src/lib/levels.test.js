import { describe, expect, it } from 'vitest';
import { MAX_LEVEL, levelFromXp, xpForLevel } from './levels';

describe('courbe de niveaux', () => {
  it('commence au niveau 1 et ne recule jamais', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(-50).level).toBe(1);
    let prev = 0;
    for (let L = 1; L <= MAX_LEVEL; L++) {
      expect(xpForLevel(L)).toBeGreaterThanOrEqual(prev);
      prev = xpForLevel(L);
    }
  });

  it('chaque niveau demande plus d’EXP que le précédent', () => {
    for (let L = 2; L < 60; L++) {
      expect(xpForLevel(L + 1) - xpForLevel(L)).toBeGreaterThan(xpForLevel(L) - xpForLevel(L - 1));
    }
  });

  it('change de niveau exactement au seuil', () => {
    const seuil = xpForLevel(7);
    expect(levelFromXp(seuil - 1).level).toBe(6);
    expect(levelFromXp(seuil).level).toBe(7);
    expect(levelFromXp(seuil).currentLevelXp).toBe(0);
  });

  it('donne un rang et l’EXP restante avant le prochain rang', () => {
    const a = levelFromXp(0);
    expect(a.rank.title).toBe('Toudoudou Novice');
    expect(a.nextRank.minLevel).toBeGreaterThan(1);
    expect(a.xpToNextRank).toBe(xpForLevel(a.nextRank.minLevel));
  });

  it('plafonne au niveau maximum', () => {
    const m = levelFromXp(10 ** 9);
    expect(m.level).toBe(MAX_LEVEL);
    expect(m.progressPct).toBe(100);
    expect(m.nextRank).toBeNull();
  });

  it('un joueur à 4 614 EXP n’est plus niveau 19 (ancienne courbe)', () => {
    const l = levelFromXp(4614).level;
    expect(l).toBeLessThan(10);
  });
});
