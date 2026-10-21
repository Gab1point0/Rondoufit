import { INITIAL_STATE } from '../data/initialState';
import { getTodayISODate } from '../lib/dates';
import { useRef, useState } from 'react';

export function useDataTransfer({ gameState, paidAchievementsRef, setGameState, skipPRRef, triggerToast }) {
  // Modale d'avertissement de réinitialisation (Professeur Chen)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const importInputRef = useRef(null);

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(gameState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rondoufit-sauvegarde-${getTodayISODate()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    triggerToast('Sauvegarde exportée', 'Fichier JSON téléchargé sur votre appareil.', 0, '💾');
  };

  const handleImportJSON = e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.quests)) throw new Error('format');
        if (!window.confirm('Remplacer toute votre progression actuelle par cette sauvegarde ?')) return;
        paidAchievementsRef.current = new Set(parsed.unlockedAchievements || []);
        skipPRRef.current = true;
        setGameState({
          ...INITIAL_STATE,
          ...parsed,
          weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : INITIAL_STATE.weightHistory
        });
        triggerToast('Sauvegarde restaurée', 'Votre progression a été rechargée.', 0, '📥');
      } catch (err) {
        triggerToast('Import impossible', 'Ce fichier n’est pas une sauvegarde Rondoufit valide.', 0, '⚠️');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAll = (blankMode = false) => {
    const nextState = blankMode
      ? {
          ...INITIAL_STATE,
          xp: 0,
          streak: 1,
          unlockedAchievements: [],
          quests: [],
          weightHistory: [
            {
              id: `w_init_${Date.now()}`,
              date: getTodayISODate(),
              weightKg: gameState.userWeightKg || 82,
              note: 'Point de départ (Remise à zéro)'
            }
          ]
        }
      : INITIAL_STATE;

    setGameState(nextState);
    setConfirmResetOpen(false);
    triggerToast(
      'Pokédex Réinitialisé',
      blankMode ? 'Page vierge (0 exercice) prête !' : 'Retour au Jour 1 !',
      0,
      '🔄'
    );
  };

  return { confirmResetOpen, setConfirmResetOpen, importInputRef, handleExportJSON, handleImportJSON, handleResetAll };
}
