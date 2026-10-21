import { getTodayISODate } from '../lib/dates';
import { playGameSound } from '../lib/sound';
import { useState } from 'react';

export function useWeightLog({ gameState, registerUndo, setGameState, triggerToast }) {
  // États pour l'onglet "⚖️ Suivi du Poids"
  const [newWeightInput, setNewWeightInput] = useState(() => gameState.userWeightKg || 82);

  const [newWeightDate, setNewWeightDate] = useState(getTodayISODate());

  const [newWeightNote, setNewWeightNote] = useState('');

  const handleAddWeightEntry = e => {
    e.preventDefault();
    const w = Math.max(30, Math.min(250, Number(newWeightInput) || gameState.userWeightKg));
    const entry = {
      id: `w_${Date.now()}`,
      date: newWeightDate || getTodayISODate(),
      weightKg: w,
      note: newWeightNote.trim() || `Pesée à ${w} kg`
    };

    const newUnlocked = new Set(gameState.unlockedAchievements);
    newUnlocked.add('weight_tracker');

    setGameState(prev => ({
      ...prev,
      userWeightKg: w,
      xp: prev.xp + 25,
      unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...newUnlocked])),
      weightHistory: [...(prev.weightHistory || []), entry].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    }));

    setNewWeightNote('');
    playGameSound('xp', gameState.soundEnabled);
    triggerToast('Pesée enregistrée !', `Poids actuel mis à jour : ${w} kg`, 25, '⚖️');
  };

  const handleDeleteWeightEntry = id => {
    registerUndo('Pesée supprimée');
    setGameState(prev => {
      const filtered = (prev.weightHistory || []).filter(item => item.id !== id);
      const latest = filtered.length > 0 ? filtered[filtered.length - 1].weightKg : prev.userWeightKg;
      return {
        ...prev,
        userWeightKg: latest,
        weightHistory: filtered
      };
    });
  };

  return { newWeightInput, setNewWeightInput, newWeightDate, setNewWeightDate, newWeightNote, setNewWeightNote, handleAddWeightEntry, handleDeleteWeightEntry };
}
