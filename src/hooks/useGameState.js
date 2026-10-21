import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEY } from '../config';
import { loadLocalState } from '../data/state';
import * as store from '../sync/storage';
import { useGithubSync } from './useGithubSync';

/**
 * L'état de l'application (progression, quêtes, poids…), enregistré sur l'appareil à chaque modification
 * et synchronisé avec le fichier GitHub (useGithubSync).
 */
export function useGameState() {
  const [gameState, setRawState] = useState(loadLocalState);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const version = useRef(0);        // augmente à chaque modification faite par l'utilisateur
  const fromRemote = useRef(false); // l'état vient d'être reçu de GitHub : ce n'est pas une modification locale
  const mounted = useRef(false);

  const applyRemote = useCallback(state => {
    stateRef.current = state;
    fromRemote.current = true;
    setRawState(state);
  }, []);

  const sync = useGithubSync({ stateRef, version, applyRemote });
  const { scheduleSync } = sync;

  // Toute modification de l'utilisateur est notée « à envoyer » tout de suite, avant même l'affichage suivant.
  const setGameState = useCallback(update => {
    version.current++;
    store.markDirty();
    store.setLocalTs(Date.now());
    setRawState(update);
  }, []);

  // Modification automatique (ex. trophées débloqués au démarrage) : tant que l'appareil n'a jamais été utilisé,
  // elle ne compte pas comme une modification de l'utilisateur, pour qu'un appareil neuf ne puisse pas écraser
  // une sauvegarde existante avec ses données de départ.
  const setGameStateAuto = useCallback(update => {
    if (store.getLocalTs() !== 0) {
      version.current++;
      store.markDirty();
      store.setLocalTs(Date.now());
    }
    setRawState(update);
  }, []);

  // Enregistrement sur l'appareil à chaque changement, puis envoi différé vers GitHub.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {}
    if (fromRemote.current) { fromRemote.current = false; return; }
    if (!mounted.current) { mounted.current = true; return; }
    scheduleSync();
  }, [gameState]);

  return { gameState, setGameState, setGameStateAuto, sync, isLoaded: sync.isLoaded };
}
