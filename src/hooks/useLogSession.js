import { calculateCardioCalories, calculateStrengthCalories } from '../lib/calories';
import { getTodayISODate } from '../lib/dates';
import { evaluateQuestProgress } from '../lib/progress';
import { countValidatedSets, formatSetsBreakdown, getSetDetailsArray, isTimedQuest, repUnit } from '../lib/quests';
import { playGameSound } from '../lib/sound';
import { useMemo, useState } from 'react';
import { computeXp, xpNote } from '../lib/xp';

export function useLogSession({
  gameState, openLevelUpModal, selectedDate, setGameState, setSelectedDate, setSelectedJournalDay,
  triggerToast,
}) {
  // Modale "Noter Séance"
  const [logModalQuest, setLogModalQuest] = useState(null);

  const [logDate, setLogDate] = useState(getTodayISODate());

  const [logValue, setLogValue] = useState(0);

  const [logUseAssistance, setLogUseAssistance] = useState(false);

  const [logAssistanceKg, setLogAssistanceKg] = useState(0);

  const [logEntryMode, setLogEntryMode] = useState('per_set');

  const [logUniformSets, setLogUniformSets] = useState(3);

  const [logUniformReps, setLogUniformReps] = useState(6);

  const [logSetDetails, setLogSetDetails] = useState([6, 6, 6]);

  const [logDurationMin, setLogDurationMin] = useState(25);

  const [logElevationM, setLogElevationM] = useState(30);

  const [logRpe, setLogRpe] = useState(7);

  const [logNote, setLogNote] = useState('');

  const liveModalCalories = useMemo(() => {
    if (!logModalQuest) return 0;
    if (logModalQuest.type === 'cardio') {
      const distanceKm =
        logModalQuest.unit === 'km'
          ? Number(logValue) || 0
          : ((Number(logValue) || 20) / 60) * 5.2;
      const durationMin =
        logModalQuest.unit === 'min'
          ? Number(logValue) || 20
          : Number(logDurationMin) || 25;
      return calculateCardioCalories({
        cardioMode: logModalQuest.cardioMode || 'run',
        distanceKm,
        durationMin,
        elevationM: logElevationM,
        rpe: logRpe,
        userWeightKg: gameState.userWeightKg
      });
    } else {
      const activeSets =
        logEntryMode === 'per_set'
          ? logSetDetails
          : Array(Math.max(1, Number(logUniformSets) || 1)).fill(
              Math.max(0, Number(logUniformReps) || 0)
            );
      return calculateStrengthCalories({
        unit: logModalQuest.unit,
        timed: isTimedQuest(logModalQuest),
        weightKg: logModalQuest.unit === 'kg' ? logValue : 0,
        assistanceKg:
          logModalQuest.unit === 'reps' && logUseAssistance ? logAssistanceKg : 0,
        setDetails: activeSets,
        rpe: logRpe,
        userWeightKg: gameState.userWeightKg
      });
    }
  }, [
    logModalQuest,
    logValue,
    logUseAssistance,
    logAssistanceKg,
    logEntryMode,
    logUniformSets,
    logUniformReps,
    logSetDetails,
    logDurationMin,
    logElevationM,
    logRpe,
    gameState.userWeightKg
  ]);

  // ==========================================
  // ACTIONS
  // ==========================================
  const openLogModal = quest => {
    playGameSound('click', gameState.soundEnabled);
    setLogModalQuest(quest);
    setLogDate(selectedDate || getTodayISODate());
    setLogRpe(7);
    setLogNote('');

    if (quest.type === 'cardio') {
      setLogValue(Number(quest.currentValue) || Number(quest.startValue) || 5);
      setLogDurationMin(Number(quest.durationMin) || 28);
      setLogElevationM(Number(quest.elevationM) || 30);
    } else {
      const targetSets = Math.max(1, Number(quest.goalSets) || 3);
      const targetReps = Math.max(1, Number(quest.goalReps) || Number(quest.goalValue) || 6);
      const existingSets = getSetDetailsArray(quest, targetSets, targetReps);
      const initialSets =
        existingSets.length > 0 ? [...existingSets] : Array(targetSets).fill(targetReps);

      setLogSetDetails(initialSets);
      setLogUniformSets(initialSets.length);
      setLogUniformReps(initialSets[0] || targetReps);
      setLogEntryMode('per_set');

      if (quest.unit === 'kg') {
        setLogValue(Number(quest.currentValue) || Number(quest.startValue) || 40);
        setLogUseAssistance(false);
        setLogAssistanceKg(0);
      } else {
        setLogValue(Math.max(...initialSets, targetReps));
        const currAssist = Number(quest.currentAssistanceKg) || 0;
        setLogUseAssistance(currAssist > 0);
        setLogAssistanceKg(currAssist);
      }
    }
  };

  const handleUpdateSingleSetRep = (index, deltaOrValue, isAbsolute = false) => {
    setLogSetDetails(prev => {
      const next = [...prev];
      const current = Number(next[index]) || 0;
      next[index] = isAbsolute
        ? Math.max(0, Number(deltaOrValue) || 0)
        : Math.max(0, current + deltaOrValue);
      return next;
    });
  };

  const handleAddSetSlot = () => {
    const defaultRep =
      logSetDetails[logSetDetails.length - 1] ||
      Number(logModalQuest?.goalReps) ||
      6;
    setLogSetDetails(prev => [...prev, defaultRep]);
  };

  const handleRemoveSetSlot = () => {
    if (logSetDetails.length <= 1) return;
    setLogSetDetails(prev => prev.slice(0, -1));
  };

  const handleApplyUniformToSets = (setsCount, repsCount) => {
    const s = Math.max(1, Math.min(12, Number(setsCount) || 1));
    const r = Math.max(0, Number(repsCount) || 0);
    setLogUniformSets(s);
    setLogUniformReps(r);
    setLogSetDetails(Array(s).fill(r));
  };

  const handleSaveSession = e => {
    e.preventDefault();
    if (!logModalQuest) return;

    const quest = logModalQuest;
    const calories = liveModalCalories;
    let xpEarned = 50 + Math.round(calories * 0.15);
    let bannerTitle = 'Séance Validée !';
    let bannerSubtitle = `+${calories} kcal brûlées`;
    let bannerBadge = '🎵';
    let questForAutoLevelUp = null;

    const newUnlocked = new Set(gameState.unlockedAchievements);
    newUnlocked.add('first_blood');

    const updatedQuests = gameState.quests.map(q => {
      if (q.id !== quest.id) return q;

      if (q.type === 'cardio') {
        const val = Math.max(0.1, Number(logValue) || 0);
        const dur = Math.max(1, Number(logDurationMin) || 20);
        const elev = Math.max(0, Number(logElevationM) || 0);
        const isPR = val > (Number(q.currentValue) || 0);
        const isBoss = val >= (Number(q.goalValue) || 10);

        if (isPR) {
          xpEarned += 120;
          bannerTitle = 'Nouveau Record Cardio !';
          bannerBadge = '🏃';
        }
        if (isBoss) {
          xpEarned += 400;
          bannerTitle = 'Objectif Cardio Vaincu !';
          bannerBadge = '👑';
          newUnlocked.add('boss_slayer');
        }

        const newEntry = {
          id: `h_${Date.now()}`,
          date: logDate,
          value: val,
          durationMin: dur,
          elevationM: elev,
          rpe: logRpe,
          calories,
          goalBeaten: isBoss,
          note:
            logNote.trim() ||
            `Sortie ${q.name} : ${val} ${q.unit} en ${dur} min (${calories} kcal)`
        };

        const updatedCardioQuest = {
          ...q,
          currentValue: Math.max(Number(q.currentValue) || 0, val),
          durationMin: dur,
          elevationM: elev,
          history: [...(q.history || []), newEntry]
        };

        if (isBoss) questForAutoLevelUp = updatedCardioQuest;
        return updatedCardioQuest;
      }

      const finalSetDetails =
        logEntryMode === 'per_set'
          ? logSetDetails.map(r => Math.max(0, Number(r) || 0))
          : Array(Math.max(1, Number(logUniformSets) || 1)).fill(
              Math.max(0, Number(logUniformReps) || 0)
            );

      const goalSets = Math.max(1, Number(q.goalSets) || 3);
      const goalReps = Math.max(1, Number(q.goalReps) || Number(q.goalValue) || 6);
      const validatedSetsNow = countValidatedSets(finalSetDetails, goalReps);
      const allSetsRepsValidated = validatedSetsNow >= goalSets;

      const prevSetDetails = getSetDetailsArray(q, goalSets, goalReps);
      const prevValidatedSets = countValidatedSets(prevSetDetails, goalReps);

      const assistanceUsed =
        q.unit === 'reps' && logUseAssistance
          ? Math.max(0, Number(logAssistanceKg) || 0)
          : 0;

      const bestRepInSession = Math.max(...finalSetDetails, 0);
      const effectiveValue =
        q.unit === 'kg' ? Math.max(0, Number(logValue) || 0) : bestRepInSession;

      const reducedAssistance =
        q.unit === 'reps' &&
        assistanceUsed < (Number.isFinite(Number(q.currentAssistanceKg)) ? Number(q.currentAssistanceKg) : 0);
      const moreSetsValidated = validatedSetsNow > prevValidatedSets;
      const increasedLoad =
        q.unit === 'kg' && effectiveValue > (Number(q.currentValue) || 0);

      if (reducedAssistance) {
        newUnlocked.add('elastic_drop');
        xpEarned += 100;
      }

      if (allSetsRepsValidated) {
        newUnlocked.add('sets_master');
        xpEarned += 150;
        bannerTitle = `Format ${goalSets}×${goalReps} Validé !`;
        bannerSubtitle = `${validatedSetsNow}/${goalSets} séries de ${goalReps}+ ${repUnit(q)} réussies (${formatSetsBreakdown(finalSetDetails)})`;
        bannerBadge = '🔴';
      } else if (moreSetsValidated || increasedLoad || reducedAssistance) {
        xpEarned += 120;
        bannerTitle = 'Progression sur l’Objectif !';
        bannerSubtitle = `${validatedSetsNow}/${goalSets} séries de ${goalReps} ${repUnit(q)} validées (${formatSetsBreakdown(finalSetDetails)})`;
        bannerBadge = '🔥';
      }

      const updatedQuestCandidate = {
        ...q,
        currentValue: effectiveValue,
        currentAssistanceKg: q.unit === 'reps' ? assistanceUsed : 0,
        setDetails: finalSetDetails
      };

      const evalAfter = evaluateQuestProgress(updatedQuestCandidate);
      if (evalAfter.isBossDefeated) {
        xpEarned += 500;
        bannerTitle = `🎵 OBJECTIF VAINCU : ${q.name} !`;
        bannerSubtitle = `Passage au Niveau ${(Number(q.level) || 1) + 1} disponible !`;
        bannerBadge = '👑';
        newUnlocked.add('boss_slayer');
      }

      const defaultNote =
        isTimedQuest(q)
          ? `Séries : ${formatSetsBreakdown(finalSetDetails)} s • ${validatedSetsNow}/${goalSets} séries validées`
          : q.unit === 'reps'
          ? `Séries : ${formatSetsBreakdown(finalSetDetails)} reps (${
              assistanceUsed > 0 ? `Aide ${assistanceUsed} kg` : 'Strict 0 kg'
            }) • ${validatedSetsNow}/${goalSets} séries validées`
          : `${effectiveValue} kg • Séries : ${formatSetsBreakdown(
              finalSetDetails
            )} reps (${validatedSetsNow}/${goalSets} validées)`;

      const newEntry = {
        id: `h_${Date.now()}`,
        date: logDate,
        value: effectiveValue,
        sets: finalSetDetails.length,
        reps: bestRepInSession,
        setDetails: finalSetDetails,
        validatedSets: validatedSetsNow,
        goalSets,
        goalReps,
        assistanceKg: assistanceUsed,
        rpe: logRpe,
        calories,
        goalBeaten: evalAfter.isBossDefeated,
        note: logNote.trim() || defaultNote
      };

      const finalQuest = {
        ...updatedQuestCandidate,
        history: [...(q.history || []), newEntry]
      };

      if (evalAfter.isBossDefeated) {
        questForAutoLevelUp = finalQuest;
      }

      return finalQuest;
    });

    const hasStrength = updatedQuests.some(
      q => q.type === 'strength' && (q.history || []).length > 0
    );
    const hasCardio = updatedQuests.some(
      q => q.type === 'cardio' && (q.history || []).length > 0
    );
    if (hasStrength && hasCardio) newUnlocked.add('hybrid_athlete');

    const totalCaloriesAfter = updatedQuests.reduce(
      (sum, q) =>
        sum +
        (q.history || []).reduce((s, h) => s + (Number(h.calories) || 0), 0),
      0
    );
    if (totalCaloriesAfter >= 1000) newUnlocked.add('calorie_furnace');

    const xpDay = getTodayISODate();
    const award = computeXp(gameState, xpEarned, xpDay, 'session');
    setGameState(prev => ({
      ...prev,
      ...computeXp(prev, xpEarned, xpDay, 'session').patch,
      unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...newUnlocked])),
      quests: updatedQuests
    }));

    setSelectedDate(logDate);
    setSelectedJournalDay(logDate);
    setLogModalQuest(null);
    playGameSound(
      bannerBadge === '👑' ? 'boss' : 'xp',
      gameState.soundEnabled
    );
    triggerToast(bannerTitle, bannerSubtitle + xpNote(award), award.gained, bannerBadge);

    if (questForAutoLevelUp) {
      openLevelUpModal(questForAutoLevelUp);
    }
  };

  return { logModalQuest, setLogModalQuest, logDate, setLogDate, logValue, setLogValue, logUseAssistance, setLogUseAssistance, logAssistanceKg, setLogAssistanceKg, logEntryMode, setLogEntryMode, logUniformSets, logUniformReps, logSetDetails, logDurationMin, setLogDurationMin, logElevationM, setLogElevationM, logNote, setLogNote, liveModalCalories, openLogModal, handleUpdateSingleSetRep, handleAddSetSlot, handleRemoveSetSlot, handleApplyUniformToSets, handleSaveSession };
}
