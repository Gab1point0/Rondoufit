// Marqueurs de synchronisation et session du compte, gardés dans le navigateur de chaque appareil.
// (Le mot de passe n'est jamais enregistré ; la session est un jeton temporaire.)

const KEYS = {
  synced: 'rondoufit:sync',       // { sha, base } : version de la sauvegarde en ligne vue en dernier + état commun à ce moment-là
  dirty: 'rondoufit:dirty',       // '1' tant que des modifications de cet appareil n'ont pas été envoyées
  localTs: 'rondoudou_local_ts',  // date (ms) de la dernière modification faite sur cet appareil
  photoMetaAcc: 'rondoufit:photoSyncAccount', // état des photos à la dernière synchro avec le compte
  account: 'rondoufit:account',   // compte de l'application : { session, expired? } (jamais le mot de passe)
  lastUser: 'rondoufit:lastUser', // dernier compte connecté sur cet appareil (pour ne jamais mélanger deux personnes)
};
const LEGACY_GITHUB = ['rondoufit:github', 'rondoufit:photoSync']; // ancienne sauvegarde GitHub (abandonnée)

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

export function readSynced() {
  try {
    const s = JSON.parse(read(KEYS.synced) || 'null');
    return s && s.sha ? s : null;
  } catch {
    return null;
  }
}
export const writeSynced = s => write(KEYS.synced, s ? JSON.stringify(s) : null);

export function readPhotoMetaAccount() {
  try {
    return JSON.parse(read(KEYS.photoMetaAcc) || 'null');
  } catch {
    return null;
  }
}
export const writePhotoMetaAccount = m => write(KEYS.photoMetaAcc, m ? JSON.stringify(m) : null);

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

/** Efface la clé GitHub (et la mémoire des photos GitHub) qui traînent encore sur cet appareil : plus aucun usage. */
export function purgeLegacyGithub() {
  for (const k of LEGACY_GITHUB) write(k, null);
}
