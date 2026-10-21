import { STORAGE_KEY } from '../config';
import { INITIAL_STATE } from './initialState';

/** Complète une sauvegarde (locale, GitHub, fichier importé…) avec les valeurs par défaut des nouveaux champs. */
export function normalizeState(parsed) {
  return {
    ...INITIAL_STATE,
    ...parsed,
    weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : INITIAL_STATE.weightHistory,
  };
}

/** État enregistré dans ce navigateur, ou l'état de départ la toute première fois. */
export function loadLocalState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.quests)) return normalizeState(parsed);
    }
  } catch (e) {}
  return INITIAL_STATE;
}
