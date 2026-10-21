// Montée de niveau : message à chaque niveau, grande fenêtre quand on change de rang.
import { afterEach, describe, expect, it } from 'vitest';
import { xpForLevel } from '../../src/lib/levels';
import { advance, clickText, findByText, launch, pageText } from './harness';

const open = [];
afterEach(() => { while (open.length) open.pop().close(); });
const TIMEOUT = 120000;
const SAVE = xp => ({ xp, quests: [], weightHistory: [], unlockedAchievements: [], claimedChallenges: [], soundEnabled: false });

async function ajouterCourse(h) {
  await clickText(h, '+ Course / Marche');
  await clickText(h, 'Ajouter au Bilan du Jour');
}

describe('niveaux', () => {
  it('affiche le niveau et l’EXP restante sans célébration au démarrage', async () => {
    const h = await launch({ storage: { rondoudou_save_v1: JSON.stringify(SAVE(xpForLevel(5) + 100)), rondoudou_local_ts: '1' } });
    open.push(h);
    expect(pageText(h)).toContain('Niv. 5');
    expect(pageText(h)).toContain('Prochain rang');
    expect(pageText(h)).not.toContain('Nouveau rang débloqué');
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('grande célébration quand on franchit un rang', async () => {
    const h = await launch({ storage: { rondoudou_save_v1: JSON.stringify(SAVE(xpForLevel(4) - 20)), rondoudou_local_ts: '1' } });
    open.push(h);
    expect(pageText(h)).toContain('Niv. 3');
    await ajouterCourse(h);
    expect(pageText(h)).toContain('Nouveau rang débloqué');
    expect(pageText(h)).toContain('Rondoudou Apprenti');
    await clickText(h, 'Continuer l’aventure');
    expect(pageText(h)).not.toContain('Nouveau rang débloqué');
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('simple message quand on monte de niveau sans changer de rang', async () => {
    const h = await launch({ storage: { rondoudou_save_v1: JSON.stringify(SAVE(xpForLevel(5) - 20)), rondoudou_local_ts: '1' } });
    open.push(h);
    await ajouterCourse(h);
    // les messages s'affichent l'un après l'autre (course, trophées, niveau) : on les laisse défiler
    let vu = pageText(h);
    for (let i = 0; i < 5; i++) { await advance(h, 4600); vu += pageText(h); }
    expect(vu).toContain('Niveau 5 atteint');
    expect(pageText(h)).not.toContain('Nouveau rang débloqué');
    expect(findByText(h, 'Continuer l’aventure')).toHaveLength(0);
    expect(h.errors).toEqual([]);
  }, TIMEOUT);
});
