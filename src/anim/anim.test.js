import { describe, expect, it } from 'vitest';
import { EXERCISE_CATALOG } from '../data/catalog';
import { ALL_SCENES } from './registry';
import { SEG, ik, poseAt, solveFront, solvePose } from './skeleton';

const strength = EXERCISE_CATALOG.filter(c => c.type === 'strength');

describe('cinématique du bonhomme', () => {
  it('le coude / genou reste à la bonne distance des deux extrémités', () => {
    const r = ik([0, 0], [30, 30], SEG.uarm, SEG.farm, 1);
    expect(Math.hypot(r.mid[0], r.mid[1])).toBeCloseTo(SEG.uarm, 3);
    expect(Math.hypot(r.end[0] - r.mid[0], r.end[1] - r.mid[1])).toBeCloseTo(SEG.farm, 3);
  });
  it('une cible trop loin est ramenée à la portée maximale', () => {
    const r = ik([0, 0], [200, 0], 28, 26, 1);
    expect(r.end[0]).toBeLessThanOrEqual(54);
  });
  it('les deux côtés de pliage donnent des coudes symétriques', () => {
    const a = ik([0, 0], [40, 0], 28, 26, 1).mid;
    const b = ik([0, 0], [40, 0], 28, 26, -1).mid;
    expect(a[0]).toBeCloseTo(b[0], 3);
    expect(a[1]).toBeCloseTo(-b[1], 3);
  });
});

describe('animations des exercices', () => {
  it('chaque exercice de musculation du catalogue a son animation', () => {
    const have = new Set(ALL_SCENES.map(s => s.id));
    expect(strength.filter(c => !have.has(c.id)).map(c => c.id)).toEqual([]);
  });

  it('aucune animation n’utilise un identifiant inconnu ou en double', () => {
    const ids = ALL_SCENES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const known = new Set(EXERCISE_CATALOG.map(c => c.id));
    expect(ids.filter(i => !known.has(i))).toEqual([]);
  });

  it('toutes les poses sont calculables (aucun nombre invalide) du début à la fin', () => {
    for (const s of ALL_SCENES) {
      expect(s.scene.keys.length, s.id).toBeGreaterThanOrEqual(2);
      for (let i = 0; i <= 20; i++) {
        const pose = poseAt(s.scene.keys, i / 20);
        const pts = s.scene.view === 'front'
          ? (() => { const f = solveFront(pose); return [f.R.elbow, f.R.wrist, f.R.knee, f.R.ankle, f.L.wrist, f.headC]; })()
          : Object.values(solvePose(pose)).filter(Array.isArray);
        for (const p of pts) {
          expect(Number.isFinite(p[0]) && Number.isFinite(p[1]), `${s.id} u=${i / 20}`).toBe(true);
        }
      }
    }
  });

  it('les vues de face / de dos sont aussi calculables et nombreuses', () => {
    let n = 0;
    for (const s of ALL_SCENES) {
      for (const a of s.alts) {
        n++;
        expect(a.scene.view, s.id + ' ' + a.key).toBe('front');
        for (let i = 0; i <= 20; i++) {
          const f = solveFront(poseAt(a.scene.keys, i / 20));
          for (const p of [f.R.elbow, f.R.wrist, f.L.wrist, f.L.elbow, f.R.ankle, f.headC]) expect(Number.isFinite(p[0]) && Number.isFinite(p[1]), s.id + ' ' + a.key).toBe(true);
        }
      }
    }
    expect(n).toBeGreaterThan(40);
  });

  it('les pieds / mains qui doivent toucher le sol ne le traversent pas (tolérance 6 px)', () => {
    for (const s of ALL_SCENES) {
      if (s.scene.view === 'front') continue;
      for (let i = 0; i <= 10; i++) {
        const j = solvePose(poseAt(s.scene.keys, i / 10));
        for (const k of ['ankle', 'toe', 'knee', 'hip']) expect(j[k][1], `${s.id} ${k}`).toBeLessThan(206);
      }
    }
  });
});

describe('conseils écrits', () => {
  it('chaque exercice de musculation a ses explications complètes', async () => {
    const { FAMILIES, INFO_FAMILY } = await import('./info');
    for (const c of strength) {
      const f = FAMILIES[INFO_FAMILY[c.id]];
      expect(f, c.id).toBeTruthy();
      expect(f.m && f.s.length && f.g.length && f.e.length && f.p.length === 2, c.id).toBeTruthy();
    }
  });

  it('les exercices personnalisés sont reconnus par leur nom', async () => {
    const { animationIdFor } = await import('./resolve');
    expect(animationIdFor({ name: 'Développé Couché Barre' })).toBe('bench_press');
    expect(animationIdFor({ name: 'Squat gobelet' })).toBe('fp_goblet');
    expect(animationIdFor({ name: 'Tractions lestées' })).toBe('pullups');
    expect(animationIdFor({ name: 'Planche' })).toBe('fp_plank');
    expect(animationIdFor({ name: 'Danse du robot' })).toBeNull();
    expect(animationIdFor({ catalogId: 'fp_rdl', name: 'autre' })).toBe('fp_rdl');
  });
});

describe('précision des animations (validateur automatique)', () => {
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  it('les mains et les pieds posés sur une cible (barre, poignée, plateau, sol) l’atteignent réellement (6 px)', () => {
    const bad = [];
    for (const s of ALL_SCENES) {
      const views = [{ name: s.id, scene: s.scene }, ...s.alts.map(a => ({ name: `${s.id}#${a.key}`, scene: a.scene }))];
      for (const v of views) {
        let mh = 0;
        let mf = 0;
        for (let i = 0; i <= 10; i++) {
          const pose = poseAt(v.scene.keys, i / 10);
          const j = v.scene.view === 'front' ? solveFront(pose).R : solvePose(pose);
          if (pose.hand) mh = Math.max(mh, d(j.wrist, pose.hand));
          if (pose.foot) mf = Math.max(mf, d(j.ankle, pose.foot));
        }
        if (mh > 6 || mf > 6) bad.push(`${v.name} main=${mh.toFixed(0)} pied=${mf.toFixed(0)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
