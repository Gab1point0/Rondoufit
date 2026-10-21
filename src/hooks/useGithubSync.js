import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeState } from '../data/state';
import { fetchLegacySave } from '../legacy/googleSheets';
import { syncOnce } from '../sync/engine';
import * as github from '../sync/github';
import { mergeStates } from '../sync/merge';
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
  const configured = store.isConfigured(config);
  const [status, setStatus] = useState(configured ? 'loading' : 'off');
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const cfgRef = useRef(config);
  cfgRef.current = config;
  const isLoaded = useRef(!configured);   // false tant que la première lecture de GitHub n'est pas terminée
  const running = useRef(null);
  const timer = useRef(null);
  const lastSyncRef = useRef(0);

  const ports = useMemo(
    () => ({
      api: github,
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
  const syncNow = useCallback(opts => {
    const cfg = cfgRef.current;
    if (!store.isConfigured(cfg)) return Promise.resolve(false);
    if (running.current) return running.current;
    const quiet = !!(opts && opts.quiet);
    setStatus(s => (quiet && s === 'synced' ? s : s === 'off' || s === 'loading' ? 'loading' : 'saving'));
    const p = (async () => {
      try {
        await syncOnce(cfg, ports);
        lastSyncRef.current = Date.now();
        setLastSync(lastSyncRef.current);
        setError(null);
        setStatus(store.isDirty() ? 'saving' : 'synced');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
        return false;
      } finally {
        isLoaded.current = true;
        running.current = null;
      }
    })();
    running.current = p;
    return p;
  }, [ports]);

  const scheduleSync = useCallback(
    (delay = DEBOUNCE_MS, quiet = false) => {
      if (!store.isConfigured(cfgRef.current)) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (navigator.onLine !== false) void syncNow({ quiet });
      }, delay);
    },
    [syncNow]
  );

  const setConfig = useCallback(
    next => {
      const prev = cfgRef.current;
      const sameFile = ['owner', 'repo', 'path', 'branch'].every(k => prev[k] === next[k]);
      if (!sameFile) store.writeSynced(null); // l'ancienne référence ne vaut que pour l'ancien fichier
      store.writeConfig(next);
      cfgRef.current = next;
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

  // Démarrage, retour sur l'app, retour du réseau, vérification régulière.
  useEffect(() => {
    if (store.isConfigured(cfgRef.current)) scheduleSync(300);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSyncRef.current > FOCUS_MIN_MS) scheduleSync(200);
    };
    const onOnline = () => scheduleSync(500);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible' && store.isConfigured(cfgRef.current)) scheduleSync(100, true);
    }, POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      clearInterval(poll);
      clearTimeout(timer.current);
    };
  }, [scheduleSync]);

  /** Reprend UNE FOIS les données de l'ancien Google Sheets (fusionnées avec celles de cet appareil). */
  const importLegacy = useCallback(async () => {
    const { data, savedAt } = await fetchLegacySave();
    const remote = normalizeState(data);
    const local = stateRef.current;
    const merged = store.getLocalTs() === 0
      ? remote // cet appareil n'a que les données de départ : on prend celles du Sheets telles quelles
      : mergeStates(null, local, remote, { preferLocal: store.getLocalTs() >= savedAt });
    applyRemote(merged);
    version.current++;
    store.markDirty();
    store.setLocalTs(Math.max(Date.now(), savedAt));
    scheduleSync(200);
    return { quests: merged.quests.length };
  }, [stateRef, version, applyRemote, scheduleSync]);

  return { config, configured, status, error, lastSync, setConfig, syncNow, scheduleSync, importLegacy, isLoaded };
}
