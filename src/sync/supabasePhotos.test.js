import { beforeEach, describe, expect, it } from 'vitest';
import { syncPhotos } from './photoSync';
import * as sb from './supabase';

// Faux serveur minimal pour la table photos (chacun la sienne, version optimiste)
function server() {
  const rows = new Map(); // id -> { data, version }
  const res = (status, body) => ({ ok: status < 300, status, json: async () => body });
  const fetch = async (url, opts = {}) => {
    const u = new URL(String(url));
    const m = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body) : null;
    const id = (u.searchParams.get('id') || '').replace('eq.', '');
    if (m === 'GET') return res(200, [...rows].filter(([k]) => !id || k === id).map(([k, r]) => ({ id: k, data: r.data, version: r.version })));
    if (m === 'POST') { if (rows.has(body.id)) return res(409, { code: '23505' }); rows.set(body.id, { data: body.data, version: 1 }); return res(201, [{ version: 1 }]); }
    if (m === 'PATCH') { const r = rows.get(id); const v = Number(u.searchParams.get('version').replace('eq.', '')); if (!r || r.version !== v) return res(200, []); rows.set(id, { data: body.data, version: body.version }); return res(200, [{ version: body.version }]); }
    if (m === 'DELETE') { rows.delete(id); return res(204, null); }
    return res(404, {});
  };
  return { rows, fetch };
}

let clock = 1000;
function device(meta = null) {
  const photos = new Map();
  let mm = meta;
  return {
    photos,
    get meta() { return mm; },
    add(id) { photos.set(id, { id, date: '2026-10-21', img: 'data:image/jpeg;base64,AAAA', createdAt: 1, updatedAt: ++clock }); },
    remove(id) { photos.delete(id); },
    sync: () => syncPhotos({ kind: 'account', url: 'https://x.supabase.co', anonKey: 'k' }, {
      api: sb.photos,
      local: {
        index: async () => Object.fromEntries([...photos].map(([id, p]) => [id, p.updatedAt])),
        get: async id => photos.get(id) || null,
        put: async p => { photos.set(p.id, p); },
        del: async id => { photos.delete(id); },
      },
      getMeta: () => mm,
      setMeta: x => { mm = JSON.parse(JSON.stringify(x)); },
    }),
  };
}

describe('photos souvenirs dans le compte (Supabase)', () => {
  let srv;
  beforeEach(() => {
    srv = server();
    globalThis.fetch = srv.fetch;
    const store = {};
    globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
    store['rondoufit:account'] = JSON.stringify({ session: { access_token: 'at', refresh_token: 'rt', expires_at: Math.floor(Date.now() / 1000) + 3000, user: { id: 'u1', email: 'a@b.fr' } } });
  });

  it('envoie les photos, les autres appareils les reprennent, les suppressions se propagent', async () => {
    const tel = device();
    const pc = device();
    tel.add('ph_1'); tel.add('ph_2');
    await tel.sync();
    expect([...srv.rows.keys()].sort()).toEqual(['ph_1', 'ph_2']);
    await pc.sync();
    expect([...pc.photos.keys()].sort()).toEqual(['ph_1', 'ph_2']);
    pc.remove('ph_1');
    await pc.sync();
    expect([...srv.rows.keys()]).toEqual(['ph_2']);
    await tel.sync();
    expect([...tel.photos.keys()]).toEqual(['ph_2']);
  });

  it('un appareil neuf ne supprime rien', async () => {
    const tel = device();
    tel.add('ph_1');
    await tel.sync();
    const neuf = device();
    await neuf.sync();
    expect([...srv.rows.keys()]).toEqual(['ph_1']);
    expect([...neuf.photos.keys()]).toEqual(['ph_1']);
  });
});
