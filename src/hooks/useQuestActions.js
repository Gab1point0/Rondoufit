import { getCoachSettings } from '../coach/settings';
import { normalizeArenaGroup } from '../data/arenas';
import { EXERCISE_CATALOG } from '../data/catalog';
import { getTodayISODate } from '../lib/dates';
import { getSetDetailsArray, isTimedCatalog } from '../lib/quests';
import { playGameSound } from '../lib/sound';

export function useQuestActions({ gameState, registerUndo, setGameState, triggerToast }) {
  const handleClaimWeekly = ws => {
    setGameState(prev => {
      const cs = getCoachSettings(prev);
      if ((cs.weeklyClaimed || []).includes(ws)) return prev;
      return { ...prev, xp: prev.xp + 150, coach: { ...cs, weeklyClaimed: [...(cs.weeklyClaimed || []), ws] } };
    });
    playGameSound('boss', gameState.soundEnabled);
    triggerToast('Objectifs de la semaine accomplis !', 'Muscu, endurance et pesées : bravo.', 150, '🏅');
  };

  const addQuestFromCatalog = catId => {
    const c = EXERCISE_CATALOG.find(x => x.id === catId);
    if (!c) return null;
    const existing = gameState.quests.find(q => q.catalogId === catId);
    if (existing) {
      triggerToast('Déjà dans tes objectifs', c.name, 0, 'ℹ️');
      return existing.id;
    }
    const gSets = c.defaultGoalSets || 3;
    const gReps = c.defaultGoalReps || 6;
    const unit = c.unit;
    const startV = Number(c.defaultStart) || 0;
    const initialSetDetails = Array(gSets).fill(unit === 'reps' ? startV : gReps);
    const assist = unit === 'reps' ? Number(c.defaultStartAssistance) || 0 : 0;
    const cat = normalizeArenaGroup(c.category, c.type);
    const newQuest = {
      id: `q_${Date.now()}`,
      catalogId: c.id,
      name: c.name,
      category: cat,
      type: 'strength',
      unit,
      timed: isTimedCatalog(c) ? true : undefined,
      goalMode: c.defaultGoalMode || 'sets_reps',
      level: 1,
      icon: c.icon,
      startValue: startV,
      currentValue: startV,
      goalValue: unit === 'reps' ? gReps : Math.max(1, Number(c.defaultGoal) || gReps),
      goalSets: gSets,
      goalReps: gReps,
      setDetails: initialSetDetails,
      startAssistanceKg: assist,
      currentAssistanceKg: assist,
      goalAssistanceKg: unit === 'reps' ? Number(c.defaultGoalAssistance) || 0 : 0,
      history: [{
        id: `h_start_${Date.now()}`,
        date: getTodayISODate(),
        value: startV,
        sets: gSets,
        reps: unit === 'reps' ? startV : gReps,
        setDetails: initialSetDetails,
        assistanceKg: assist,
        rpe: 7,
        calories: 0,
        goalBeaten: false,
        note: `Point de départ — Niveau 1 (${c.name}) • ajouté par le Coach`
      }]
    };
    setGameState(prev => ({ ...prev, xp: prev.xp + 40, quests: [newQuest, ...prev.quests] }));
    triggerToast('Exercice ajouté !', `${c.name} : ajuste la charge de départ dans « Quêtes » (✏️).`, 40, c.icon);
    return newQuest.id;
  };

  // ==========================================
  // ACTION : SUPPRIMER UNE SÉANCE (BILAN DU JOUR OU JOURNAL)
  // ==========================================
  const handleDeleteSessionEntry = (questId, entryId) => {
    registerUndo('Séance supprimée');
    playGameSound('click', gameState.soundEnabled);
    let deletedQuestName = 'Séance';

    setGameState(prev => {
      const updatedQuests = prev.quests.map(q => {
        if (q.id !== questId) return q;
        deletedQuestName = q.name;
        const remainingHistory = (q.history || []).filter(h => h.id !== entryId);

        if (remainingHistory.length === 0) {
          const gSets = Math.max(1, Number(q.goalSets) || 3);
          const gReps = Math.max(1, Number(q.goalReps) || Number(q.goalValue) || 6);
          const resetVal = Number(q.startValue) || 0;
          return {
            ...q,
            currentValue: resetVal,
            currentAssistanceKg: q.unit === 'reps' ? Number(q.startAssistanceKg) || 0 : 0,
            setDetails: q.type === 'strength'
              ? Array(gSets).fill(q.unit === 'reps' ? resetVal : gReps)
              : [],
            history: []
          };
        }

        const last = remainingHistory[remainingHistory.length - 1];
        if (q.type === 'cardio') {
          const maxVal = remainingHistory.reduce(
            (max, h) => Math.max(max, Number(h.value) || 0),
            Number(q.startValue) || 0
          );
          return {
            ...q,
            currentValue: maxVal,
            durationMin: last.durationMin || q.durationMin,
            elevationM: last.elevationM !== undefined ? last.elevationM : q.elevationM,
            history: remainingHistory
          };
        }

        const gSets = Math.max(1, Number(q.goalSets) || 3);
        const gReps = Math.max(1, Number(q.goalReps) || Number(q.goalValue) || 6);
        const restoredSets = getSetDetailsArray(last, gSets, gReps);

        return {
          ...q,
          currentValue: Number(last.value) || Number(q.startValue) || 0,
          currentAssistanceKg: q.unit === 'reps' ? Number(last.assistanceKg) || 0 : 0,
          setDetails: restoredSets,
          history: remainingHistory
        };
      });

      return {
        ...prev,
        quests: updatedQuests
      };
    });

    triggerToast(
      'Séance supprimée',
      `${deletedQuestName} a été retirée du bilan et vos statistiques ont été recalculées.`,
      0,
      '🗑️'
    );
  };

  const handleDeleteQuest = questId => {
    registerUndo('Quête retirée');
    setGameState(prev => ({
      ...prev,
      quests: prev.quests.filter(q => q.id !== questId)
    }));
    triggerToast('Quête retirée', 'L’exercice a été retiré du Pokédex.', 0, '🗑️');
  };

  return { handleClaimWeekly, addQuestFromCatalog, handleDeleteSessionEntry, handleDeleteQuest };
}
