import { INITIAL_STATE } from '../data/initialState';
import { readSafetyCopy, saveSafetyCopy } from '../lib/safetyCopy';
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
        saveSafetyCopy(gameState, 'avant un import');
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

  // Remet les données d'avant le dernier import / la dernière réinitialisation
  const handleRestoreSafetyCopy = () => {
    const c = readSafetyCopy();
    if (!c) { triggerToast('Aucune copie de sécurité', 'Rien à restaurer sur cet appareil.', 0, 'ℹ️'); return; }
    if (!window.confirm('Remettre les données d’avant ' + c.reason + ' ? Les données actuelles seront remplacées.')) return;
    saveSafetyCopy(gameState, 'avant la restauration');
    paidAchievementsRef.current = new Set(c.state.unlockedAchievements || []);
    skipPRRef.current = true;
    setGameState({ ...INITIAL_STATE, ...c.state });
    triggerToast('Copie de sécurité restaurée', 'Tes données d’avant sont revenues.', 0, '↩️');
  };

  const handleResetAll = () => {
    saveSafetyCopy(gameState, 'avant la réinitialisation');
    const nextState = {
      ...INITIAL_STATE,
      weightHistory: [
        {
          id: `w_init_${Date.now()}`,
          date: getTodayISODate(),
          weightKg: gameState.userWeightKg || 82,
          note: 'Point de départ (Remise à zéro)'
        }
      ]
    };

    setGameState(nextState);
    setConfirmResetOpen(false);
    triggerToast(
      'Pokédex Réinitialisé',
      'Page vierge prête : ajoute ton premier exercice avec le bouton +.',
      0,
      '🔄'
    );
  };

  return { confirmResetOpen, setConfirmResetOpen, importInputRef, handleExportJSON, handleImportJSON, handleResetAll, handleRestoreSafetyCopy };
}
