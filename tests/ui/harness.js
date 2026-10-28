// Banc de test de l'interface : l'application complète tourne dans un faux navigateur (jsdom),
// avec une horloge et un hasard figés, pour des tests rapides et reproductibles.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder, TextEncoder } from 'node:util';
import { JSDOM } from 'jsdom';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import * as esbuild from 'esbuild';
import { DEMO_STATE } from './demo.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const FIXED_NOW = new Date(2026, 9, 21, 10, 0, 0).getTime();
export const sleep = ms => new Promise(r => setTimeout(r, ms));

let bundle = null;
/** Compile l'application (src/main.jsx) en un seul script, une fois pour tous les tests. */
export async function buildApp() {
  if (!bundle) {
    const r = await esbuild.build({
      entryPoints: [path.join(ROOT, 'src/main.jsx')],
      outfile: path.join(ROOT, 'tests/ui/.sortie.js'),
      bundle: true, format: 'iife', write: false, jsx: 'automatic', logLevel: 'error',
      loader: { '.js': 'jsx', '.css': 'empty' },
      define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.PROD': 'false' },
    });
    bundle = r.outputFiles.find(f => f.path.endsWith('.js')).text;
  }
  return bundle;
}

const PRELUDE = `
(function () {
  const RealDate = Date; const FIXED = ${FIXED_NOW};
  const vt = { now: 0, seq: 0, timers: new Map() };
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(FIXED + vt.now); else super(...a); }
    static now() { return FIXED + vt.now; }
  }
  window.Date = FakeDate;
  const realSet = window.setTimeout.bind(window), realClear = window.clearTimeout.bind(window);
  const realSetI = window.setInterval.bind(window), realClearI = window.clearInterval.bind(window);
  // Minuteries longues (>= 200 ms) : horloge virtuelle, avancée à la main par les tests.
  window.setTimeout = (fn, ms, ...a) => { ms = Number(ms) || 0; if (ms < 200) return realSet(fn, ms, ...a); const id = -(++vt.seq); vt.timers.set(id, { id, fn: () => fn(...a), due: vt.now + ms, every: 0 }); return id; };
  window.setInterval = (fn, ms, ...a) => { ms = Number(ms) || 0; if (ms < 200) return realSetI(fn, ms, ...a); const id = -(++vt.seq); vt.timers.set(id, { id, fn: () => fn(...a), due: vt.now + ms, every: ms }); return id; };
  window.clearTimeout = id => { if (id < 0) vt.timers.delete(id); else realClear(id); };
  window.clearInterval = id => { if (id < 0) vt.timers.delete(id); else realClearI(id); };
  window.__advance = ms => {
    const target = vt.now + ms;
    for (;;) {
      let next = null;
      for (const t of vt.timers.values()) if (t.due <= target && (!next || t.due < next.due || (t.due === next.due && t.id > next.id))) next = t;
      if (!next) break;
      vt.now = next.due;
      if (next.every) next.due += next.every; else vt.timers.delete(next.id);
      try { next.fn(); } catch (e) { console.error(e); }
    }
    vt.now = target;
  };
  let s = 1234567;
  Math.random = function () { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();
`;

/**
 * Démarre l'application. `storage` : contenu initial du localStorage. `fetchImpl` : faux réseau.
 * Les erreurs de la page sont collectées dans `h.errors`.
 */
export async function launch({ storage = {}, fetchImpl, empty = false } = {}) {
  // sans précision, l'application de test démarre avec les données de démonstration (l'application réelle démarre vide)
  if (!empty && !('rondoudou_save_v1' in storage) && !('rondoufit:github' in storage)) storage = { ...storage, rondoudou_save_v1: JSON.stringify(DEMO_STATE) };
  const code = await buildApp();
  const errors = [];
  const dom = new JSDOM('<!doctype html><html lang="fr"><body><div id="root"></div></body></html>', {
    url: 'https://gab1point0.github.io/Rondoufit/', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  Object.defineProperty(w, 'indexedDB', { value: new IDBFactory(), configurable: true });
  w.IDBKeyRange = IDBKeyRange;
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
  w.fetch = fetchImpl || (() => Promise.reject(new TypeError('Failed to fetch')));
  w.scrollTo = () => {};
  w.Element.prototype.scrollIntoView = () => {};
  const ctx2d = new Proxy(function () {}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {}), set: () => true, apply: () => undefined });
  w.HTMLCanvasElement.prototype.getContext = () => ctx2d;
  w.HTMLCanvasElement.prototype.toBlob = function (cb) { cb(new w.Blob(['x'], { type: 'image/png' })); };
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA';
  w.confirm = () => true; w.alert = () => {}; w.prompt = () => null;
  w.URL.createObjectURL = () => 'blob:fake'; w.URL.revokeObjectURL = () => {};
  w.addEventListener('error', e => errors.push('ERREUR PAGE: ' + (e.error?.stack || e.message)));
  w.console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0, 300)); };
  w.console.warn = () => {};
  w.console.log = () => {};
  w.eval(PRELUDE);
  w.eval(code);
  await sleep(120);
  return { dom, w, doc: w.document, errors, close: () => w.close() };
}

export const rootHtml = h => h.doc.getElementById('root').innerHTML;
export const pageText = h => h.doc.body.textContent;

/** Fait avancer l'horloge virtuelle (minuteries longues) et laisse React / les promesses se terminer. */
export async function advance(h, ms = 300) {
  await sleep(25);
  h.w.__advance(ms);
  await sleep(25);
}

/** Plus petits éléments dont le texte contient `text`. */
export function findByText(h, text, selector = 'button, a, [role=button], div, span, label') {
  const hits = [...h.doc.querySelectorAll(selector)].filter(el => (el.textContent || '').replace(/\s+/g, ' ').includes(text));
  return hits.filter(el => !hits.some(o => o !== el && el.contains(o)));
}

export async function clickEl(h, el) {
  el.dispatchEvent(new h.w.MouseEvent('click', { bubbles: true, cancelable: true, view: h.w }));
  await advance(h);
}

/** Déplie les « Pourquoi ? / Ajuster » de la prochaine séance du coach (repliés par défaut). */
export async function expandCoachDetails(h) {
  for (const b of [...h.doc.querySelectorAll('button')].filter(x => x.textContent.includes('Pourquoi ? / Ajuster'))) await clickEl(h, b);
}

export async function clickText(h, text) {
  let [el] = findByText(h, text);
  // actions rangées dans le bouton « + » (course, exercice…) ou dans le menu ⚙️ (exporter, réinitialiser…)
  if (!el) {
    const fab = h.doc.querySelector('button[aria-label="Ajouter"]');
    if (fab) { await clickEl(h, fab); [el] = findByText(h, text); }
  }
  if (!el) {
    const more = h.doc.querySelector('button[aria-label="Réglages et données"]');
    if (more) { await clickEl(h, more); [el] = findByText(h, text); }
  }
  if (!el) throw new Error('Texte introuvable : ' + text);
  await clickEl(h, el.closest('button, a, [role=button]') || el);
}

export async function setInput(h, el, value) {
  const proto = el.tagName === 'SELECT' ? h.w.HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? h.w.HTMLTextAreaElement.prototype : h.w.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new h.w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  if (el.tagName !== 'SELECT') el.dispatchEvent(new h.w.Event('change', { bubbles: true }));
  await advance(h);
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const SKIP = /Exporter|Importer|Réinitialiser|tout effacer|Oui, |☁️|⏳|⚠️|Réessayer/i;

/** « Singe » : N actions au hasard (clics, saisies) pour débusquer les plantages. */
export async function monkey(h, seed, steps) {
  const rand = rng(seed);
  let done = 0;
  for (let i = 0; i < steps; i++) {
    const cands = [...h.doc.querySelectorAll('button:not([disabled]), input[type=checkbox], input[type=range], select, input[type=number], input[type=text], input[type=date], textarea')]
      .filter(el => !(el.tagName === 'BUTTON' && SKIP.test(el.textContent || '')))
      .filter(el => el.type !== 'file');
    if (!cands.length) break;
    const el = cands[Math.floor(rand() * cands.length)];
    if (el.tagName === 'BUTTON' || el.type === 'checkbox') await clickEl(h, el);
    else if (el.tagName === 'SELECT') { const o = el.options[Math.floor(rand() * el.options.length)]; if (o) await setInput(h, el, o.value); }
    else if (el.type === 'range') await setInput(h, el, String(Math.floor(rand() * 10)));
    else if (el.type === 'date') await setInput(h, el, `2026-10-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`);
    else if (el.type === 'number') await setInput(h, el, String(Math.floor(rand() * 120)));
    else await setInput(h, el, ['Test', 'Tractions', '12', 'x'][Math.floor(rand() * 4)]);
    done++;
  }
  return done;
}

// ── Faux GitHub (API « Contents ») : plusieurs fichiers, dossiers, suppression ───────────────────
const MAIN = 'rondoufit-data.json';
export function fakeGithub(initial) {
  const files = new Map(); // chemin -> { content, sha }
  const srv = { files, n: 0, puts: [], gets: 0, photoPuts: [], photoDeletes: [], offline: false };
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
  const put = (path, content) => files.set(path, { content, sha: 'sha' + ++srv.n });
  // le fichier de données principal, accessible directement
  Object.defineProperty(srv, 'file', {
    get: () => files.get(MAIN) || null,
    set: v => (v ? files.set(MAIN, v) : files.delete(MAIN)),
  });
  if (initial) srv.file = { content: JSON.stringify(initial), sha: 'sha0' };
  srv.fetch = async (url, opts = {}) => {
    url = String(url);
    if (srv.offline) throw new TypeError('Failed to fetch');
    const m = url.match(/^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/?]+)(?:\/contents\/([^?]+))?/);
    if (!m) return res(404, { message: 'Not Found' });
    if (!m[3]) return res(200, { name: m[2] });
    const path = decodeURIComponent(m[3]);
    const method = opts.method || 'GET';
    if (method === 'GET') {
      if (path === MAIN) srv.gets++;
      if (files.has(path)) {
        const f = files.get(path);
        return res(200, { type: 'file', content: Buffer.from(f.content, 'utf8').toString('base64'), encoding: 'base64', sha: f.sha });
      }
      const dir = [...files.entries()].filter(([p]) => p.startsWith(path + '/'));
      if (dir.length) return res(200, dir.map(([p, f]) => ({ type: 'file', name: p.slice(path.length + 1), sha: f.sha })));
      return res(404, { message: 'Not Found' });
    }
    const body = JSON.parse(opts.body);
    const current = files.get(path);
    if ((current ? current.sha : null) !== (body.sha || null)) return res(409, { message: 'sha does not match' });
    if (method === 'DELETE') {
      files.delete(path);
      srv.photoDeletes.push(path);
      return res(200, {});
    }
    const content = Buffer.from(body.content, 'base64').toString('utf8');
    put(path, content);
    if (path === MAIN) srv.puts.push(JSON.parse(content));
    else srv.photoPuts.push(path);
    return res(200, { content: { sha: files.get(path).sha } });
  };
  return srv;
}
