import { coachSessionRecap } from '../coach/advice';
import { calculateStrengthCalories } from '../lib/calories';
import { getTodayISODate } from '../lib/dates';
import { evaluateQuestProgress } from '../lib/progress';
import { countValidatedSets, getSetDetailsArray, isTimedQuest } from '../lib/quests';
import { assistsOf, fmtLoads, isMixed, loadsOf } from '../lib/setLoads';
import { playGameSound } from '../lib/sound';
import { useEffect, useState } from 'react';
import { computeXp, xpNote } from '../lib/xp';

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
        loads: e.targetReps.map(() => e.load || 0),     // charge de chaque série (modifiable entre deux séries)
        assists: e.targetReps.map(() => e.assist || 0), // aide de chaque série
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
      // charge / aide de chaque série réalisée
      const doneLoads = loadsOf(dd).filter((_, i) => dd.done[i]).map(x => Math.max(0, Number(x) || 0));
      const doneAssists = assistsOf(dd).filter((_, i) => dd.done[i]).map(x => Math.max(0, Number(x) || 0));
      doneEx++;
      const goalSets = Math.max(1, Number(q.goalSets) || 3);
      const goalReps = Math.max(1, Number(q.goalReps) || Number(q.goalValue) || 6);
      const validatedNow = countValidatedSets(setDetails, goalReps);
      const best = Math.max(...setDetails, 0);
      const isKg = q.unit === 'kg';
      // valeur « de record » : charge la plus lourde, aide la plus faible
      const effectiveValue = isKg ? Math.max(...doneLoads, 0) : best;
      const assistanceUsed = !isKg && it.kind === 'assisted' ? Math.min(...doneAssists) : 0;
      const totalReps = setDetails.reduce((a, r) => a + r, 0);
      const avgLoad = isKg && totalReps > 0 ? setDetails.reduce((a, r, i) => a + r * doneLoads[i], 0) / totalReps : effectiveValue;
      const avgAssist = !isKg && it.kind === 'assisted' && totalReps > 0 ? setDetails.reduce((a, r, i) => a + r * doneAssists[i], 0) / totalReps : assistanceUsed;
      // ressenti de cet exercice (1 à 10) ; sinon le ressenti global de la séance
      const exerciseRpe = Math.min(10, Math.max(1, Number(dd.rpe) || g.rpe || 7));
      const calories = calculateStrengthCalories({
        unit: q.unit,
        timed: isTimedQuest(q),
        weightKg: isKg ? avgLoad : 0,
        assistanceKg: avgAssist,
        setDetails,
        rpe: exerciseRpe,
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
        ...(isKg && isMixed(doneLoads) ? { setLoads: doneLoads } : {}),
        ...(!isKg && it.kind === 'assisted' && isMixed(doneAssists) ? { setAssists: doneAssists } : {}),
        rpe: exerciseRpe,
        calories,
        goalBeaten: ev.isBossDefeated,
        note: `Séance guidée ${g.templateId || ''} • ${isKg ? fmtLoads(doneLoads) + ' • ' : it.kind === 'assisted' && assistanceUsed > 0 ? 'Aide ' + fmtLoads(doneAssists) + ' • ' : ''}${setDetails.join(' - ')} reps`
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
    const award = computeXp(gameState, xpEarned, today, 'session');
    setGameState(prev => ({
      ...prev,
      ...computeXp(prev, xpEarned, today, 'session').patch,
      unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...newUnlocked])),
      quests: updatedQuests
    }));
    setSelectedDate(today);
    setSelectedJournalDay(today);
    setGameState(prev => { const cs = prev.coach; return cs && cs.plan && cs.plan.date <= today ? { ...prev, coach: { ...cs, plan: null } } : prev; });
    setGuided(null);
    setGuidedOpen(false);
    playGameSound(bossQuest ? 'boss' : 'xp', gameState.soundEnabled);
    triggerToast('Séance guidée terminée !', `${doneEx} exercice(s) enregistré(s)` + xpNote(award), award.gained, bossQuest ? '👑' : '🎵');
    try { setRecap(coachSessionRecap(gameState.quests, updatedQuests, g, today, award.gained, gameState)); } catch (err) {}
    if (bossQuest) openLevelUpModal(bossQuest);
  };

  const [recap, setRecap] = useState(null);

  return { guided, setGuided, guidedOpen, setGuidedOpen, startGuided, handleFinishGuided, recap, setRecap };
}
