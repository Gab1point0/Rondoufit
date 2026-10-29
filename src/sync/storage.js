import { pick } from '../edition';
// Réglages et marqueurs de synchronisation, gardés dans le navigateur de chaque appareil.
// (Le jeton GitHub ne quitte jamais l'appareil et n'est jamais écrit dans le fichier de sauvegarde.)

const KEYS = {
  config: 'rondoufit:github',
  synced: 'rondoufit:sync',       // { sha, base } : version de GitHub vue en dernier + état commun à ce moment-là
  photoMeta: 'rondoufit:photoSync', // { id: { sha, at } } : état des photos à la dernière synchro
  dirty: 'rondoufit:dirty',       // '1' tant que des modifications de cet appareil n'ont pas été envoyées
  localTs: 'rondoudou_local_ts',  // date (ms) de la dernière modification faite sur cet appareil
  account: 'rondoufit:account',   // compte de l'application : { session, expired? } (jamais le mot de passe)
  lastUser: 'rondoufit:lastUser', // dernier compte connecté sur cet appareil (pour ne jamais mélanger deux personnes)
  carnet: 'carnet-eps:github',    // réglages de l'appli Carnet EPS (même appareil), pour les reprendre en un clic
};

export const EMPTY_CONFIG = {
  owner: pick('Gab1point0', ''),
  repo: pick('rondoufit-donnees', 'muscu-donnees'),
  path: 'rondoufit-data.json',
  branch: 'main',
  token: '',
};

export const isConfigured = c => !!(c && c.owner && c.repo && c.path && c.branch && c.token);

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* stockage plein ou interdit : on continue sans */
  }
}

export function readConfig() {
  try {
    const raw = read(KEYS.config);
    if (raw) return { ...EMPTY_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...EMPTY_CONFIG };
}
export const writeConfig = c => write(KEYS.config, JSON.stringify(c));

/** Réglages saisis dans Carnet EPS sur cet appareil (compte + jeton), s'il y en a. */
export function readCarnetConfig() {
  try {
    const c = JSON.parse(read(KEYS.carnet) || 'null');
    return c && c.owner && c.token ? { owner: c.owner, token: c.token, repo: c.repo || '' } : null;
  } catch {
    return null;
  }
}

export function readSynced() {
  try {
    const s = JSON.parse(read(KEYS.synced) || 'null');
    return s && s.sha ? s : null;
  } catch {
    return null;
  }
}
export const writeSynced = s => write(KEYS.synced, s ? JSON.stringify(s) : null);

export function readPhotoMeta() {
  try {
    return JSON.parse(read(KEYS.photoMeta) || 'null');
  } catch {
    return null;
  }
}
export const writePhotoMeta = m => write(KEYS.photoMeta, m ? JSON.stringify(m) : null);

export const isDirty = () => read(KEYS.dirty) === '1';
export const markDirty = () => write(KEYS.dirty, '1');
export const clearDirty = () => write(KEYS.dirty, null);

export const getLocalTs = () => Number(read(KEYS.localTs)) || 0;
export const setLocalTs = t => write(KEYS.localTs, String(t));

// ---- Compte de l'application (Supabase) ----
export function readAccount() {
  try {
    const a = JSON.parse(read(KEYS.account) || 'null');
    return a && typeof a === 'object' ? a : null;
  } catch {
    return null;
  }
}
export const writeAccount = a => write(KEYS.account, a ? JSON.stringify(a) : null);
export const isAccountConnected = () => { const a = readAccount(); return !!(a && a.session && a.session.user && a.session.user.id); };
export const readLastUser = () => read(KEYS.lastUser);
export const writeLastUser = id => write(KEYS.lastUser, id || null);
