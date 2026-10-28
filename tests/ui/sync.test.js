// La sauvegarde GitHub vue de l'application : faux navigateur + faux GitHub.
import { afterEach, describe, expect, it } from 'vitest';
import { advance, clickEl, clickText, fakeGithub, findByText, launch, pageText, rootHtml, setInput, sleep } from './harness';

const open = [];
const start = async (srv, storage = {}) => {
  const h = await launch({ storage, fetchImpl: srv.fetch });
  open.push(h);
  return h;
};
afterEach(() => { while (open.length) open.pop().close(); });

const TIMEOUT = 120000;
const CFG = JSON.stringify({ owner: 'Gab1point0', repo: 'rondoufit-donnees', path: 'rondoufit-data.json', branch: 'main', token: 'github_pat_test' });
const SAVE = (extra = {}) => ({ xp: 10, quests: [], weightHistory: [], unlockedAchievements: [], claimedChallenges: [], soundEnabled: true, ...extra });
const pill = h => [...h.doc.querySelectorAll('button')].find(b => b.title === 'Réglages de la sauvegarde GitHub').textContent;
const settle = async (h, ms = 3000) => { for (let i = 0; i < 4; i++) { await advance(h, ms / 4); await sleep(40); } };
const pillButton = h => [...h.doc.querySelectorAll('button')].find(b => b.title === 'Réglages de la sauvegarde GitHub');

describe('sauvegarde GitHub dans l’application', () => {
  it('appareil neuf : reprend les données de GitHub sans rien écrire', async () => {
    const srv = fakeGithub(SAVE({ xp: 777, _savedAt: 5 }));
    const h = await start(srv, { 'rondoufit:github': CFG });
    await settle(h);
    expect(pageText(h)).toContain('777 EXP');
    expect(srv.puts).toHaveLength(0);
    expect(pill(h)).toContain('Sauvegardé sur GitHub');
  }, TIMEOUT);

  it('reprend au bout d’une minute les modifications faites depuis un autre appareil', async () => {
    const srv = fakeGithub(SAVE({ xp: 100, _savedAt: 5 }));
    const h = await start(srv, { 'rondoufit:github': CFG });
    await settle(h);
    expect(pageText(h)).toContain('100 EXP');
    srv.file = { content: JSON.stringify(SAVE({ xp: 300, _savedAt: 9 })), sha: 'sha-autre-appareil' };
    await settle(h, 62000);
    await sleep(400); // le délai court (100 ms) qui suit la vérification est une vraie minuterie
    expect(pageText(h)).toContain('300 EXP');
    expect(srv.puts).toHaveLength(0);
    expect(pill(h)).toContain('Sauvegardé');
  }, TIMEOUT);

  it('non configurée : pastille d’avertissement, aucune requête, réglages utilisables', async () => {
    const srv = fakeGithub(null);
    const h = await start(srv);
    await settle(h);
    expect(pill(h)).toContain('non réglée');
    expect(srv.gets).toBe(0);
    await clickEl(h, pillButton(h));
    expect(pageText(h)).toContain('Mise en place');
    const token = [...h.doc.querySelectorAll('input')].find(i => i.placeholder === 'github_pat_…');
    await setInput(h, token, 'github_pat_abc');
    await clickText(h, 'Enregistrer et synchroniser');
    await settle(h, 2000);
    expect(srv.gets).toBeGreaterThan(0);
    expect(JSON.parse(h.w.localStorage.getItem('rondoufit:github')).token).toBe('github_pat_abc');
    expect(srv.puts).toHaveLength(0); // appareil neuf + dépôt vide : on n'envoie pas l'état de départ
  }, TIMEOUT);

  it('crée le fichier avec les données de l’appareil, puis envoie chaque modification après 2 s', async () => {
    const srv = fakeGithub(null);
    const h = await start(srv, { 'rondoufit:github': CFG, rondoudou_save_v1: JSON.stringify(SAVE()), rondoudou_local_ts: '123' });
    await settle(h);
    expect(srv.puts).toHaveLength(1);
    expect(srv.puts[0].xp).toBe(10);
    const avant = srv.puts.length;
    await clickText(h, 'Sons :');
    expect(srv.puts).toHaveLength(avant); // pas d'envoi immédiat
    await settle(h, 3000);
    expect(srv.puts).toHaveLength(avant + 1);
    expect(srv.puts[srv.puts.length - 1].soundEnabled).toBe(false);
    expect(pill(h)).toContain('Sauvegardé');
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('GitHub injoignable : données gardées, « Réessayer » reprend ensuite', async () => {
    const srv = fakeGithub(SAVE({ xp: 50, _savedAt: 5 }));
    srv.offline = true;
    const h = await start(srv, { 'rondoufit:github': CFG });
    await settle(h);
    expect(pill(h)).toContain('injoignable');
    expect(srv.puts).toHaveLength(0);
    srv.offline = false;
    await clickText(h, 'Réessayer');
    await settle(h, 1000);
    expect(pill(h)).toContain('Sauvegardé');
    expect(pageText(h)).toContain('50 EXP');
  }, TIMEOUT);

  it('fichier GitHub illisible : il n’est jamais écrasé', async () => {
    const srv = fakeGithub(null);
    srv.file = { content: '{ pas du json', sha: 'shaX' };
    const h = await start(srv, { 'rondoufit:github': CFG, rondoudou_save_v1: JSON.stringify(SAVE()), rondoudou_local_ts: '123' });
    await settle(h);
    expect(srv.puts).toHaveLength(0);
    expect(pill(h)).toContain('injoignable');
  }, TIMEOUT);

  it('deux appareils : les modifications des deux sont fusionnées', async () => {
    const quete = (id, hist) => ({ id, catalogId: 'pullups', name: 'Tractions', category: 'Dos', type: 'strength', unit: 'reps', goalMode: 'sets_reps', level: 1, icon: '🦅', startValue: 4, currentValue: 6, goalValue: 8, goalSets: 3, goalReps: 6, setDetails: [6, 6, 6], history: hist });
    const e = (id, date) => ({ id, date, value: 6, sets: 3, reps: 6, setDetails: [6, 6, 6], rpe: 7, note: '' });
    const base = SAVE({ xp: 100, quests: [quete('q1', [e('e1', '2026-10-01')])] });
    // GitHub contient déjà la séance e2 (saisie ailleurs) ; cet appareil a saisi e3 depuis la dernière synchro.
    const srv = fakeGithub({ ...base, xp: 120, quests: [quete('q1', [e('e1', '2026-10-01'), e('e2', '2026-10-02')])], _savedAt: 50 });
    const local = { ...base, xp: 130, quests: [quete('q1', [e('e1', '2026-10-01'), e('e3', '2026-10-03')])] };
    const h = await start(srv, {
      'rondoufit:github': CFG,
      rondoudou_save_v1: JSON.stringify(local),
      rondoudou_local_ts: '100',
      'rondoufit:dirty': '1',
      'rondoufit:sync': JSON.stringify({ sha: 'sha-ancien', base }),
    });
    await settle(h);
    // 1er envoi = la fusion ; un 2e peut suivre (trophées débloqués grâce aux séances réunies)
    expect(srv.puts.length).toBeGreaterThanOrEqual(1);
    const fusion = srv.puts[0];
    expect(fusion.quests[0].history.map(x => x.id)).toEqual(['e1', 'e2', 'e3']);
    expect(fusion.xp).toBe(150);
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('récupère une dernière fois les données de l’ancien Google Sheets', async () => {
    const srv = fakeGithub(null);
    srv.legacy = SAVE({ xp: 4242, _savedAt: 99 });
    const h = await start(srv, { 'rondoufit:github': CFG });
    await settle(h);
    await clickEl(h, pillButton(h));
    await clickText(h, 'Récupérer mes données de Google Sheets');
    await settle(h, 3500);
    expect(pageText(h)).toContain('4242 EXP');
    expect(srv.puts[srv.puts.length - 1].xp).toBe(4242);
  }, TIMEOUT);
});
