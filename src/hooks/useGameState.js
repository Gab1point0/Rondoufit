import { SCRIPT_URL, STORAGE_KEY } from '../config';
import { INITIAL_STATE } from '../data/initialState';
import { useEffect, useRef, useState } from 'react';

export function useGameState() {
  const [gameState, setGameState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.quests)) {
          return {
            ...INITIAL_STATE,
            ...parsed,
            weightHistory: Array.isArray(parsed.weightHistory)
              ? parsed.weightHistory
              : INITIAL_STATE.weightHistory
          };
        }
      }
    } catch (e) {}
    return INITIAL_STATE;
  });

  const [cloudStatus, setCloudStatus] = useState('loading');

  const isLoaded = useRef(false);

  const cloudOk = useRef(false);          // true seulement si on a réussi à lire le cloud

  const skipPush = useRef(false);         // état tout juste reçu du cloud : ne pas le renvoyer

  const hadLocal = useRef((() => { try { return !!localStorage.getItem(STORAGE_KEY); } catch (e) { return false; } })());

  const TS_KEY = 'rondoudou_local_ts';

  const getLocalTs = () => { try { return Number(localStorage.getItem(TS_KEY)) || 0; } catch (e) { return 0; } };

  const setLocalTs = t => { try { localStorage.setItem(TS_KEY, String(t)); } catch (e) {} };

  const stateRef = useRef(gameState);

  stateRef.current = gameState;

  const pushCloud = (state, ts) =>
    fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...state, _savedAt: ts }),
      redirect: "follow"
    });

  // 1. Lecture du cloud (au démarrage, puis à chaque retour sur l'app) — la version la plus récente gagne
  const loadCloud = isStartup => {
    setCloudStatus('loading');
    return fetch(SCRIPT_URL + "?t=" + Date.now(), { redirect: "follow" })
      .then(r => r.json())
      .then(res => {
        cloudOk.current = true;
        if (res && res.data && Array.isArray(res.data.quests)) {
          const { _savedAt, ...cloudData } = res.data;
          const cloudTs = Number(_savedAt) || 0;
          const localTs = getLocalTs();
          // Les modifications locales plus récentes que le cloud (ex. faites hors-ligne) sont conservées
          const localNewer = hadLocal.current && localTs > cloudTs && localTs > 0;
          const applyCloud = isStartup ? !localNewer : cloudTs > localTs;
          if (applyCloud) {
            const merged = {
              ...INITIAL_STATE,
              ...cloudData,
              weightHistory: Array.isArray(cloudData.weightHistory) ? cloudData.weightHistory : INITIAL_STATE.weightHistory
            };
            skipPush.current = true;
            setGameState(merged);
            setLocalTs(cloudTs);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch (e) {}
            setCloudStatus('synced');
          } else if (localNewer) {
            return pushCloud(stateRef.current, localTs).then(() => setCloudStatus('synced'));
          } else setCloudStatus('synced');
        } else if (hadLocal.current) {
          // Cloud vide : on y met la sauvegarde de cet appareil (seulement si elle existe vraiment)
          const ts = getLocalTs() || Date.now();
          setLocalTs(ts);
          return pushCloud(stateRef.current, ts).then(() => setCloudStatus('synced'));
        } else setCloudStatus('synced');
      })
      .catch(() => { setCloudStatus('error'); })
      .finally(() => { isLoaded.current = true; });
  };

  useEffect(() => {
    loadCloud(true);
    const onVis = () => { if (document.visibilityState === 'visible' && isLoaded.current) loadCloud(false); };
    document.addEventListener('visibilitychange', onVis);
    const retry = setInterval(() => { if (!cloudOk.current && isLoaded.current) loadCloud(false); }, 30000);
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(retry); };
  }, []);

  // 2. Sauvegarde automatique à chaque modification (LocalStorage + Google Sheets)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {}

    if (!isLoaded.current) return;
    if (skipPush.current) { skipPush.current = false; return; }
    const ts = Date.now();
    setLocalTs(ts);
    hadLocal.current = true;
    // Sécurité : tant que le cloud n'a pas pu être lu, on ne l'écrase JAMAIS (évite de perdre les données d'un autre appareil)
    if (!cloudOk.current) { setCloudStatus('error'); return; }
    setCloudStatus('saving');
    const timer = setTimeout(() => {
      pushCloud(gameState, ts)
        .then(() => setCloudStatus('synced'))
        .catch(() => setCloudStatus('error'));
    }, 500);

    return () => clearTimeout(timer);
  }, [gameState]);

  return { gameState, setGameState, cloudStatus, isLoaded, loadCloud };
}
