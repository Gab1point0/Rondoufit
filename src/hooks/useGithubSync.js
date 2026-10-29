import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SUPABASE, supabaseReady } from '../config';
import { INITIAL_STATE } from '../data/initialState';
import { normalizeState } from '../data/state';
import { saveSafetyCopy } from '../lib/safetyCopy';
import { PhotoDB } from '../lib/photos';
import { syncOnce } from '../sync/engine';
import * as github from '../sync/github';
import * as supabase from '../sync/supabase';
import { syncPhotos } from '../sync/photoSync';
import * as store from '../sync/storage';

const DEBOUNCE_MS = 2000;      // attente après une modification avant d'envoyer
const POLL_MS = 60000;         // vérification régulière (reprise des modifications d'un autre appareil, nouvel essai après erreur)
const FOCUS_MIN_MS = 30000;    // au retour sur l'app, on resynchronise si la dernière synchro date de plus de 30 s

/**
 * Synchronisation avec le fichier GitHub (voir sync/engine.js).
 * Statuts : 'off' (non configurée) · 'loading' (première lecture) · 'saving' · 'synced' · 'error'.
 */
export function useGithubSync({ stateRef, version, applyRemote }) {
  const [config, setConfigState] = useState(store.readConfig);
  const [account, setAccountState] = useState(store.readAccount);
  // Deux façons de sauvegarder : un compte de l'application (amis) ou un dépôt GitHub (avancé, Gabin). Le compte passe en premier.
  const accountOn = supabaseReady(SUPABASE) && !!(account && account.session && account.session.user && account.session.user.id);
  const engineCfg = accountOn ? { kind: 'account', ...SUPABASE, userId: account.session.user.id } : store.isConfigured(config) ? config : null;
  const configured = !!engineCfg;
  const [status, setStatus] = useState(configured ? 'loading' : 'off');
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const cfgRef = useRef(engineCfg);
  cfgRef.current = engineCfg;
  const isLoaded = useRef(!configured);   // false tant que la première lecture de GitHub n'est pas terminée
  const running = useRef(null);
  const timer = useRef(null);
  const lastSyncRef = useRef(0);

  const ports = useMemo(
    () => ({
      api: {
        getFile: c => (c.kind === 'account' ? supabase : github).getFile(c),
        putFile: (c, ...rest) => (c.kind === 'account' ? supabase : github).putFile(c, ...rest),
      },
      getLocal: () => stateRef.current,
      isPristine: () => store.getLocalTs() === 0, // jamais modifié sur cet appareil = données de départ
      normalize: normalizeState,
      getLocalTs: store.getLocalTs,
      isDirty: store.isDirty,
      version: () => version.current,
      markDirty: () => { version.current++; store.markDirty(); },
      clearDirty: v => { if (version.current === v) store.clearDirty(); },
      getSynced: store.readSynced,
      setSynced: store.writeSynced,
      applyRemote: (state, ts) => {
        applyRemote(state);
        store.setLocalTs(Math.max(store.getLocalTs(), ts || 0));
      },
      now: () => Date.now(),
    }),
    [stateRef, version, applyRemote]
  );

  // `quiet` : vérification régulière en arrière-plan, la pastille ne clignote pas si rien n'est à envoyer.
  // Photos souvenirs : une par fichier dans le dépôt (voir sync/photoSync.js).
  const photoPorts = useMemo(
    () => ({
      api: github,
      local: {
        index: () => PhotoDB.index(),
        get: id => PhotoDB.get(id),
        put: p => PhotoDB.put(p, { remote: true }),
        del: id => PhotoDB.del(id, { remote: true }),
      },
      getMeta: store.readPhotoMeta,
      setMeta: store.writePhotoMeta,
    }),
    []
  );

  const syncNow = useCallback(opts => {
    const cfg = cfgRef.current;
    if (!cfg) return Promise.resolve(false);
    if (running.current) return running.current;
    const quiet = !!(opts && opts.quiet);
    setStatus(s => (quiet && s === 'synced' ? s : s === 'off' || s === 'loading' ? 'loading' : 'saving'));
    const p = (async () => {
      try {
        await syncOnce(cfg, ports);
        if (cfg.kind !== 'account') await syncPhotos(cfg, photoPorts); // photos : GitHub seulement pour l'instant
        lastSyncRef.current = Date.now();
        setLastSync(lastSyncRef.current);
        setError(null);
        setStatus(store.isDirty() ? 'saving' : 'synced');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
        if (store.readAccount() && store.readAccount().expired) setAccountState(store.readAccount()); // session refusée : il faut se reconnecter
        return false;
      } finally {
        isLoaded.current = true;
        running.current = null;
      }
    })();
    running.current = p;
    return p;
  }, [ports, photoPorts]);

  const scheduleSync = useCallback(
    (delay = DEBOUNCE_MS, quiet = false) => {
      if (!cfgRef.current) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (navigator.onLine !== false) void syncNow({ quiet });
      }, delay);
    },
    [syncNow]
  );

  const setConfig = useCallback(
    next => {
      const prev = store.readConfig();
      const sameFile = ['owner', 'repo', 'path', 'branch'].every(k => prev[k] === next[k]);
      if (!sameFile) {
        store.writeSynced(null); // l'ancienne référence ne vaut que pour l'ancien fichier
        store.writePhotoMeta(null);
      }
      store.writeConfig(next);
      if (!(cfgRef.current && cfgRef.current.kind === 'account')) cfgRef.current = store.isConfigured(next) ? next : null;
      setConfigState(next);
      setError(null);
      if (store.isConfigured(next)) {
        setStatus('loading');
        scheduleSync(50);
      } else {
        setStatus('off');
        isLoaded.current = true;
      }
    },
    [scheduleSync]
  );

  // ---- Compte de l'application ----
  const adoptSession = useCallback(session => {
    const uid = session.user.id;
    const last = store.readLastUser();
    if (last && last !== uid) {
      // Cet appareil contenait les données d'une AUTRE personne : jamais envoyées vers ce compte. Copie de sécurité, puis départ à neuf.
      saveSafetyCopy(stateRef.current, 'avant la connexion à un autre compte');
      store.clearDirty();
      store.setLocalTs(0);
      applyRemote(normalizeState(INITIAL_STATE));
    }
    if (last !== uid) {
      store.writeSynced(null);
      store.writePhotoMeta(null);
    }
    store.writeLastUser(uid);
    const next = { session };
    store.writeAccount(next);
    cfgRef.current = { kind: 'account', ...SUPABASE, userId: uid };
    setAccountState(next);
    setError(null);
    setStatus('loading');
    isLoaded.current = false;
    scheduleSync(50);
  }, [applyRemote, scheduleSync, stateRef]);

  const signUp = useCallback(async (email, password, invite) => {
    const r = await supabase.signUp(SUPABASE, email.trim(), password, invite);
    if (r.session) adoptSession(r.session);
    return r;
  }, [adoptSession]);

  const signIn = useCallback(async (email, password) => {
    const session = await supabase.signIn(SUPABASE, email.trim(), password);
    adoptSession(session);
    return session;
  }, [adoptSession]);

  const signOut = useCallback(async () => {
    const acc = store.readAccount();
    await supabase.signOut(SUPABASE, acc && acc.session);
    store.writeAccount(null); // les données restent sur cet appareil ; `lastUser` empêche de les mélanger avec un autre compte
    cfgRef.current = store.isConfigured(config) ? config : null;
    setAccountState(null);
    setStatus(cfgRef.current ? 'loading' : 'off');
    isLoaded.current = true;
    if (cfgRef.current) scheduleSync(50);
  }, [config, scheduleSync]);

  // Démarrage, retour sur l'app, retour du réseau, vérification régulière.
  useEffect(() => {
    if (cfgRef.current) scheduleSync(300);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSyncRef.current > FOCUS_MIN_MS) scheduleSync(200);
    };
    const onOnline = () => scheduleSync(500);
    const onPhotoChange = () => scheduleSync(3000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('rondoufit-photos-local', onPhotoChange);
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible' && cfgRef.current) scheduleSync(100, true);
    }, POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('rondoufit-photos-local', onPhotoChange);
      clearInterval(poll);
      clearTimeout(timer.current);
    };
  }, [scheduleSync]);

  const user = accountOn ? account.session.user : null;
  const needsLogin = !!(account && account.expired && !accountOn);
  return { config, configured, status, error, lastSync, setConfig, syncNow, scheduleSync, isLoaded, accountEnabled: supabaseReady(SUPABASE), user, needsLogin, signUp, signIn, signOut };
}
