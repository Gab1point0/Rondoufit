import { EXERCISE_CATALOG } from '../data/catalog';
import { DEFAULT_CARDIO_INPUT, calculateCardioCalories, cardioInputNote, resolveCardioInputs } from '../lib/calories';
import { getTodayISODate } from '../lib/dates';
import { playGameSound } from '../lib/sound';
import { useMemo, useState } from 'react';
import { computeXp, xpNote } from '../lib/xp';

export function useQuickCardio({ gameState, setGameState, setSelectedDate, setSelectedJournalDay, triggerToast }) {
  // Modale rapide "+ Course / Marche du jour"
  const [quickCardioModalOpen, setQuickCardioModalOpen] = useState(false);

  const [quickCardioCatalogId, setQuickCardioCatalogId] = useState('running_endurance');

  const [quickCardioDistanceKm, setQuickCardioDistanceKm] = useState(5);

  const [quickCardioDurationMin, setQuickCardioDurationMin] = useState(28);

  const [quickCardioElevationM, setQuickCardioElevationM] = useState(40);

  const [quickCardioRpe, setQuickCardioRpe] = useState(7);

  // saisie « vitesse + durée » et/ou pente en % (voir lib/calories.js resolveCardioInputs)
  const [quickCardioInput, setQuickCardioInputRaw] = useState(DEFAULT_CARDIO_INPUT);
  const setQuickCardioInput = p => setQuickCardioInputRaw(prev => ({ ...prev, ...p }));
  const quickResolved = resolveCardioInputs({
    ...quickCardioInput, distanceKm: quickCardioDistanceKm, durationMin: quickCardioDurationMin, elevationM: quickCardioElevationM,
    slopePct: quickCardioInput.slopePct,
  });

  const [quickCardioDate, setQuickCardioDate] = useState(getTodayISODate());

  const [quickCardioNote, setQuickCardioNote] = useState('');

  const liveQuickCardioCalories = useMemo(() => {
    const cat =
      EXERCISE_CATALOG.find(c => c.id === quickCardioCatalogId) ||
      EXERCISE_CATALOG.find(c => c.id === 'running_endurance');
    return calculateCardioCalories({
      cardioMode: cat?.cardioMode || 'run',
      distanceKm: quickResolved.distanceKm,
      durationMin: quickCardioDurationMin,
      elevationM: quickResolved.elevationM,
      rpe: quickCardioRpe,
      userWeightKg: gameState.userWeightKg
    });
  }, [
    quickCardioCatalogId,
    quickResolved.distanceKm,
    quickCardioDurationMin,
    quickResolved.elevationM,
    quickCardioRpe,
    gameState.userWeightKg
  ]);

  const handleSaveQuickCardio = e => {
    e.preventDefault();
    const cat =
      EXERCISE_CATALOG.find(c => c.id === quickCardioCatalogId) ||
      EXERCISE_CATALOG.find(c => c.id === 'running_endurance');

    const dist = Math.max(0.1, quickCardioInput.inputMode === 'speed' ? quickResolved.distanceKm : Number(quickResolved.distanceKm) || 5);
    const dur = Math.max(1, Number(quickCardioDurationMin) || 25);
    const elev = quickResolved.elevationM;
    const how = cardioInputNote(quickCardioInput);
    const calories = liveQuickCardioCalories;
    const primaryValue = cat.unit === 'min' ? dur : dist;
    const xpGain = 85 + Math.round(calories * 0.15);

    const newEntry = {
      id: `h_cardio_${Date.now()}`,
      date: quickCardioDate,
      value: primaryValue,
      distanceKm: dist,
      durationMin: dur,
      elevationM: elev,
      rpe: quickCardioRpe,
      calories,
      goalBeaten: false,
      note:
        quickCardioNote.trim() ||
        `${cat.name} : ${dist} km en ${dur} min (D+ ${elev}m${how ? ', ' + how : ''})`
    };

    let questFound = false;
    const updatedQuests = gameState.quests.map(q => {
      if (q.catalogId === cat.id) {
        questFound = true;
        return {
          ...q,
          currentValue: Math.max(Number(q.currentValue) || 0, primaryValue),
          durationMin: dur,
          elevationM: elev,
          history: [...(q.history || []), newEntry]
        };
      }
      return q;
    });

    if (!questFound) {
      updatedQuests.push({
        id: `q_${cat.id}_${Date.now()}`,
        catalogId: cat.id,
        name: cat.name,
        category: 'Course & Cardio',
        type: 'cardio',
        cardioMode: cat.cardioMode || 'run',
        unit: cat.unit,
        level: 1,
        icon: cat.icon,
        startValue: primaryValue,
        currentValue: primaryValue,
        goalValue: Math.max(cat.defaultGoal || 10, Math.round(primaryValue * 1.5)),
        durationMin: dur,
        elevationM: elev,
        history: [newEntry]
      });
    }

    const newUnlocked = new Set(gameState.unlockedAchievements);
    newUnlocked.add('first_blood');
    newUnlocked.add('hybrid_athlete');

    const award = computeXp(gameState, xpGain, getTodayISODate(), 'session');
    setGameState(prev => ({
      ...prev,
      ...computeXp(prev, xpGain, getTodayISODate(), 'session').patch,
      unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...newUnlocked])),
      quests: updatedQuests
    }));

    setSelectedDate(quickCardioDate);
    setSelectedJournalDay(quickCardioDate);
    setQuickCardioModalOpen(false);
    playGameSound('xp', gameState.soundEnabled);
    triggerToast(
      `${cat.name} ajoutée !`,
      `${dist} km en ${dur} min • 🔥 ${calories} kcal brûlées` + xpNote(award),
      award.gained,
      cat.icon
    );
  };

  return { quickCardioModalOpen, setQuickCardioModalOpen, quickCardioCatalogId, setQuickCardioCatalogId, quickCardioDistanceKm, setQuickCardioDistanceKm, quickCardioDurationMin, setQuickCardioDurationMin, quickCardioElevationM, setQuickCardioElevationM, quickCardioInput, setQuickCardioInput, quickResolved, quickCardioRpe, setQuickCardioRpe, quickCardioDate, setQuickCardioDate, quickCardioNote, setQuickCardioNote, liveQuickCardioCalories, handleSaveQuickCardio };
}
