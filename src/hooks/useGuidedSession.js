import { coachSessionRecap } from '../coach/advice';
import { calculateStrengthCalories } from '../lib/calories';
import { getTodayISODate } from '../lib/dates';
import { evaluateQuestProgress } from '../lib/progress';
import { countValidatedSets, getSetDetailsArray, isTimedQuest } from '../lib/quests';
import { playGameSound } from '../lib/sound';
import { useEffect, useState } from 'react';

export function useGuidedSession({
  gameState, openLevelUpModal, setGameState, setSelectedDate, setSelectedJournalDay, triggerToast,
}) {
  // ---- Coach : séance guidée ----
  const GUIDED_KEY = 'rondoufit_guided_v1';

  const [guided, setGuided] = useState(() => {
    try { const s = localStorage.getItem(GUIDED_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  });

  const [guidedOpen, setGuidedOpen] = useState(false);

  useEffect(() => {
    try {
      if (guided) localStorage.setItem(GUIDED_KEY, JSON.stringify(guided));
      else localStorage.removeItem(GUIDED_KEY);
    } catch (e) {}
  }, [guided]);

  const startGuided = session => {
    if (!session || !session.exercises.length) return;
    const data = {};
    session.exercises.forEach(e => {
      data[e.questId] = {
        reps: e.targetReps.slice(),
        done: e.targetReps.map(() => false),
        load: e.load || 0,
        assist: e.assist || 0
      };
    });
    setGuided({
      startedAt: Date.now(),
      templateId: session.templateId,
      items: session.exercises,
      data,
      idx: 0,
      phase: 'run',
      rpe: 7,
      warmup: session.warmup || ''
    });
    setGuidedOpen(true);
  };

  const handleFinishGuided = g => {
    const today = getTodayISODate();
    let xpEarned = 0;
    let bossQuest = null;
    let doneEx = 0;
    const newUnlocked = new Set(gameState.unlockedAchievements || []);
    const updatedQuests = gameState.quests.map(q => {
      const it = g.items.find(x => x.questId === q.id);
      if (!it) return q;
      const dd = g.data[q.id];
      const setDetails = dd.reps.map(r => Math.max(0, Number(r) || 0)).filter((r, i) => dd.done[i]);
      if (!setDetails.length) return q;
      doneEx++;
      const goalSets = Math.max(1, Number(q.goalSets) || 3);
      const goalReps = Math.max(1, Number(q.goalReps) || Number(q.goalValue) || 6);
      const validatedNow = countValidatedSets(setDetails, goalReps);
      const best = Math.max(...setDetails, 0);
      const isKg = q.unit === 'kg';
      const effectiveValue = isKg ? Math.max(0, Number(dd.load) || 0) : best;
      const assistanceUsed = !isKg && it.kind === 'assisted' ? Math.max(0, Number(dd.assist) || 0) : 0;
      const calories = calculateStrengthCalories({
        unit: q.unit,
        timed: isTimedQuest(q),
        weightKg: isKg ? effectiveValue : 0,
        assistanceKg: assistanceUsed,
        setDetails,
        rpe: g.rpe || 7,
        userWeightKg: gameState.userWeightKg
      });
      xpEarned += 50 + Math.round(calories * 0.15);
      const prevDetails = getSetDetailsArray(q, goalSets, goalReps);
      const reducedAssistance = !isKg && assistanceUsed < (Number(q.currentAssistanceKg) || 0);
      const increasedLoad = isKg && effectiveValue > (Number(q.currentValue) || 0);
      if (reducedAssistance) { newUnlocked.add('elastic_drop'); xpEarned += 100; }
      if (validatedNow >= goalSets) { newUnlocked.add('sets_master'); xpEarned += 150; }
      else if (validatedNow > countValidatedSets(prevDetails, goalReps) || increasedLoad || reducedAssistance) xpEarned += 120;
      const cand = { ...q, currentValue: effectiveValue, currentAssistanceKg: !isKg ? assistanceUsed : 0, setDetails };
      const ev = evaluateQuestProgress(cand);
      if (ev.isBossDefeated) { xpEarned += 500; newUnlocked.add('boss_slayer'); }
      const entry = {
        id: `h_${Date.now()}_${q.id}`,
        date: today,
        value: effectiveValue,
        sets: setDetails.length,
        reps: best,
        setDetails,
        validatedSets: validatedNow,
        goalSets,
        goalReps,
        assistanceKg: assistanceUsed,
        rpe: g.rpe || 7,
        calories,
        goalBeaten: ev.isBossDefeated,
        note: `Séance guidée ${g.templateId || ''} • ${isKg ? effectiveValue + ' kg • ' : assistanceUsed > 0 ? 'Aide ' + assistanceUsed + ' kg • ' : ''}${setDetails.join(' - ')} reps`
      };
      const finalQ = { ...cand, history: [...(q.history || []), entry] };
      if (ev.isBossDefeated && !bossQuest) bossQuest = finalQ;
      return finalQ;
    });
    if (doneEx === 0) {
      setGuided(null); setGuidedOpen(false);
      triggerToast('Séance vide', 'Aucune série validée : rien n’a été enregistré.', 0, 'ℹ️');
      return;
    }
    newUnlocked.add('first_blood');
    setGameState(prev => ({
      ...prev,
      xp: prev.xp + xpEarned,
      unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...newUnlocked])),
      quests: updatedQuests
    }));
    setSelectedDate(today);
    setSelectedJournalDay(today);
    setGameState(prev => { const cs = prev.coach; return cs && cs.plan && cs.plan.date <= today ? { ...prev, coach: { ...cs, plan: null } } : prev; });
    setGuided(null);
    setGuidedOpen(false);
    playGameSound(bossQuest ? 'boss' : 'xp', gameState.soundEnabled);
    triggerToast('Séance guidée terminée !', `${doneEx} exercice(s) enregistré(s)`, xpEarned, bossQuest ? '👑' : '🎵');
    try { setRecap(coachSessionRecap(gameState.quests, updatedQuests, g, today, xpEarned)); } catch (err) {}
    if (bossQuest) openLevelUpModal(bossQuest);
  };

  const [recap, setRecap] = useState(null);

  return { guided, setGuided, guidedOpen, setGuidedOpen, startGuided, handleFinishGuided, recap, setRecap };
}
