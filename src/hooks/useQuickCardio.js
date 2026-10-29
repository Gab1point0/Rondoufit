import { EXERCISE_CATALOG } from '../data/catalog';
import { DEFAULT_CARDIO_INPUT, calculateCardioCalories, cardioHasElevation, cardioInputNote, resolveCardioInputs } from '../lib/calories';
import { getTodayISODate } from '../lib/dates';
import { playGameSound } from '../lib/sound';
import { useMemo, useState } from 'react';
import { computeXp, xpNote } from '../lib/xp';

export function useQuickCardio({ gameState, setGameState, setSelectedDate, setSelectedJournalDay, triggerToast }) {
  // Modale rapide « + Activité annexe » (course, marche, sports collectifs, plein air, cardio)
  const [quickCardioModalOpen, setQuickCardioModalOpen] = useState(false);

  const [quickCardioCatalogId, setCatalogIdRaw] = useState('running_endurance');

  const [quickCardioDistanceKm, setQuickCardioDistanceKm] = useState(5);

  const [quickCardioDurationMin, setQuickCardioDurationMin] = useState(28);

  const [quickCardioElevationM, setQuickCardioElevationM] = useState(40);

  const [quickCardioRpe, setQuickCardioRpe] = useState(7);

  // saisie « vitesse + durée » et/ou pente en % (voir lib/calories.js resolveCardioInputs)
  const [quickCardioInput, setQuickCardioInputRaw] = useState(DEFAULT_CARDIO_INPUT);
  const setQuickCardioInput = p => setQuickCardioInputRaw(prev => ({ ...prev, ...p }));
  const activity = EXERCISE_CATALOG.find(c => c.id === quickCardioCatalogId) || EXERCISE_CATALOG.find(c => c.id === 'running_endurance');
  const hasElevation = cardioHasElevation(activity.cardioMode);
  const hasDistance = activity.unit === 'km' || hasElevation; // la marche inclinée (en minutes) a besoin d'une distance pour la pente
  const quickResolved = resolveCardioInputs({
    ...quickCardioInput,
    inputMode: hasDistance ? quickCardioInput.inputMode : 'distance',
    slopeMode: hasElevation ? quickCardioInput.slopeMode : 'meters',
    distanceKm: hasDistance ? quickCardioDistanceKm : 0,
    durationMin: quickCardioDurationMin,
    elevationM: hasElevation ? quickCardioElevationM : 0,
    slopePct: hasElevation ? quickCardioInput.slopePct : 0,
  });

  // changer d'activité : durée et distance habituelles de cette activité, saisie classique
  const setQuickCardioCatalogId = id => {
    const c = EXERCISE_CATALOG.find(x => x.id === id);
    setCatalogIdRaw(id);
    if (!c) return;
    setQuickCardioDurationMin(c.defaultDurationMin || 30);
    if (c.unit === 'km') setQuickCardioDistanceKm(c.defaultStart || 5);
    setQuickCardioElevationM(cardioHasElevation(c.cardioMode) ? 40 : 0);
    setQuickCardioInputRaw(DEFAULT_CARDIO_INPUT);
  };

  const [quickCardioDate, setQuickCardioDate] = useState(getTodayISODate());

  const [quickCardioNote, setQuickCardioNote] = useState('');

  const liveQuickCardioCalories = useMemo(() => {
    const cat = activity;
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
    activity.cardioMode,
    quickResolved.distanceKm,
    quickCardioDurationMin,
    quickResolved.elevationM,
    quickCardioRpe,
    gameState.userWeightKg
  ]);

  const handleSaveQuickCardio = e => {
    e.preventDefault();
    const cat = activity;

    const dist = hasDistance ? Math.max(0.1, quickCardioInput.inputMode === 'speed' ? quickResolved.distanceKm : Number(quickResolved.distanceKm) || 5) : 0;
    const dur = Math.max(1, Number(quickCardioDurationMin) || 25);
    const elev = quickResolved.elevationM;
    const how = hasDistance || hasElevation ? cardioInputNote({ ...quickCardioInput, inputMode: hasDistance ? quickCardioInput.inputMode : 'distance', slopeMode: hasElevation ? quickCardioInput.slopeMode : 'meters' }) : '';
    const calories = liveQuickCardioCalories;
    const primaryValue = cat.unit === 'min' ? dur : dist;
    const xpGain = 85 + Math.round(calories * 0.15);

    const newEntry = {
      id: `h_cardio_${Date.now()}`,
      date: quickCardioDate,
      value: primaryValue,
      ...(hasDistance ? { distanceKm: dist } : {}),
      durationMin: dur,
      ...(hasElevation ? { elevationM: elev } : {}),
      rpe: quickCardioRpe,
      calories,
      goalBeaten: false,
      note:
        quickCardioNote.trim() ||
        hasDistance
          ? `${cat.name} : ${dist} km en ${dur} min${hasElevation ? ` (D+ ${elev}m${how ? ', ' + how : ''})` : how ? ` (${how})` : ''}`
          : `${cat.name} : ${dur} min`
    };

    let questFound = false;
    const updatedQuests = gameState.quests.map(q => {
      if (q.catalogId === cat.id) {
        questFound = true;
        return {
          ...q,
          currentValue: Math.max(Number(q.currentValue) || 0, primaryValue),
          durationMin: dur,
          ...(hasElevation ? { elevationM: elev } : {}),
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
        category: cat.category || 'Course & Cardio',
        type: 'cardio',
        cardioMode: cat.cardioMode || 'run',
        unit: cat.unit,
        level: 1,
        icon: cat.icon,
        startValue: primaryValue,
        currentValue: primaryValue,
        goalValue: Math.max(cat.defaultGoal || 10, Math.round(primaryValue * 1.5)),
        durationMin: dur,
        ...(hasElevation ? { elevationM: elev } : {}),
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
      `${hasDistance ? `${dist} km en ` : ''}${dur} min • 🔥 ${calories} kcal brûlées` + xpNote(award),
      award.gained,
      cat.icon
    );
  };

  return { quickCardioModalOpen, setQuickCardioModalOpen, quickCardioCatalogId, setQuickCardioCatalogId, quickCardioDistanceKm, setQuickCardioDistanceKm, quickCardioDurationMin, setQuickCardioDurationMin, quickCardioElevationM, setQuickCardioElevationM, quickCardioInput, setQuickCardioInput, quickResolved, quickActivity: activity, quickCardioRpe, setQuickCardioRpe, quickCardioDate, setQuickCardioDate, quickCardioNote, setQuickCardioNote, liveQuickCardioCalories, handleSaveQuickCardio };
}
