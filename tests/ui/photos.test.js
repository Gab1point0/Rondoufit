// Les photos souvenirs suivent la sauvegarde GitHub : envoi, reprise sur un autre appareil.
import { afterEach, describe, expect, it } from 'vitest';
import { advance, fakeGithub, launch, sleep } from './harness';

const open = [];
afterEach(() => { while (open.length) open.pop().close(); });
const TIMEOUT = 120000;
const CFG = JSON.stringify({ owner: 'Gab1point0', repo: 'rondoufit-donnees', path: 'rondoufit-data.json', branch: 'main', token: 'github_pat_test' });
const SAVE = { xp: 10, quests: [], weightHistory: [], unlockedAchievements: [], claimedChallenges: [], soundEnabled: false };
const PHOTO = (id, extra = {}) => ({ id, date: '2026-10-21', label: '', note: '', img: 'data:image/jpeg;base64,/9j/AAAA', createdAt: 5, updatedAt: 5, ...extra });

const start = async (srv, storage) => {
  const h = await launch({ storage: { 'rondoufit:github': CFG, ...storage }, fetchImpl: srv.fetch });
  open.push(h);
  return h;
};
const settle = async (h, ms = 3000) => { for (let i = 0; i < 4; i++) { await advance(h, ms / 4); await sleep(60); } await sleep(300); };

// Accès direct à la base des photos (comme le ferait un autre onglet)
const idb = h => new Promise((res, rej) => {
  const r = h.w.indexedDB.open('rondoufit_photos', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const idbPut = async (h, photo) => {
  const db = await idb(h);
  await new Promise(res => { const t = db.transaction('photos', 'readwrite'); t.objectStore('photos').put(photo); t.oncomplete = res; });
  db.close();
};
const idbAll = async h => {
  const db = await idb(h);
  const all = await new Promise(res => { const q = db.transaction('photos').objectStore('photos').getAll(); q.onsuccess = () => res(q.result); });
  db.close();
  return all;
};

describe('photos et sauvegarde GitHub', () => {
  it('envoie sur GitHub une photo prise sur cet appareil', async () => {
    const srv = fakeGithub(null);
    const h = await start(srv, { rondoudou_save_v1: JSON.stringify(SAVE), rondoudou_local_ts: '123' });
    await idbPut(h, PHOTO('ph_tel'));
    await settle(h);
    expect(srv.photoPuts).toEqual(['photos/ph_tel.json']);
    const stocke = JSON.parse(srv.files.get('photos/ph_tel.json').content);
    expect(stocke.img).toBe('data:image/jpeg;base64,/9j/AAAA');
    expect(stocke.date).toBe('2026-10-21');
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('reprend sur cet appareil les photos prises sur un autre', async () => {
    const srv = fakeGithub({ ...SAVE, _savedAt: 5 });
    srv.files.set('photos/ph_autre.json', { content: JSON.stringify(PHOTO('ph_autre', { note: 'Séance jambes' })), sha: 'shaP' });
    const h = await start(srv, {});
    await settle(h);
    const photos = await idbAll(h);
    expect(photos.map(p => p.id)).toEqual(['ph_autre']);
    expect(photos[0].note).toBe('Séance jambes');
    expect(srv.photoPuts).toEqual([]); // rien n'est renvoyé
    expect(h.errors).toEqual([]);
  }, TIMEOUT);

  it('une photo supprimée ailleurs disparaît aussi de cet appareil', async () => {
    const srv = fakeGithub({ ...SAVE, _savedAt: 5 });
    srv.files.set('photos/ph_a.json', { content: JSON.stringify(PHOTO('ph_a')), sha: 'shaA' });
    const h = await start(srv, {});
    await settle(h);
    expect((await idbAll(h)).map(p => p.id)).toEqual(['ph_a']);
    srv.files.delete('photos/ph_a.json'); // supprimée depuis un autre appareil
    await settle(h, 62000);
    expect(await idbAll(h)).toEqual([]);
  }, TIMEOUT);
});
