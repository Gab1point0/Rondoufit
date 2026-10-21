import { useEffect, useMemo, useRef, useState } from 'react';
import { coachSessionRecap } from './coach/advice';
import { getCoachSettings } from './coach/settings';
import { CoachPanel } from './components/coach/CoachPanel';
import { GuidedSession } from './components/GuidedSession';
import { PhotoCalendar } from './components/photos/PhotoCalendar';
import { PhotoReminder } from './components/photos/PhotoReminder';
import { RestTimer } from './components/RestTimer';
import { SessionRecap } from './components/SessionRecap';
import { VoiceWorkoutAssistant } from './components/VoiceWorkoutAssistant';
import { SCRIPT_URL, STORAGE_KEY } from './config';
import { ARENA_GROUPS, normalizeArenaGroup } from './data/arenas';
import { EXERCISE_CATALOG } from './data/catalog';
import { ACHIEVEMENTS_LIST, RPG_RANKS } from './data/gamification';
import { INITIAL_STATE } from './data/initialState';
import { calculateCardioCalories, calculateStrengthCalories } from './lib/calories';
import { addDaysISO, getTodayISODate, getWeekStart } from './lib/dates';
import { compareWithPreviousSession, evaluateQuestProgress } from './lib/progress';
import { countValidatedSets, formatSetsBreakdown, getAllEntries, getSetDetailsArray, isTimedCatalog, isTimedQuest, repUnit } from './lib/quests';
import { playGameSound } from './lib/sound';
import { computeAchievementStats, computeCurrentStreak, computeDerivedAchievements, computePersonalRecords, computeWeekStats, getWeekChallenges } from './lib/stats';
import { BilanTab } from './tabs/BilanTab';
import { ChartsTab } from './tabs/ChartsTab';
import { DailySummary } from './components/DailySummary';
import { JournalTab } from './tabs/JournalTab';
import { LevelUpModal } from './modals/LevelUpModal';
import { LogSessionModal } from './modals/LogSessionModal';
import { QuestFormModal } from './modals/QuestFormModal';
import { QuestsTab } from './tabs/QuestsTab';
import { QuickCardioModal } from './modals/QuickCardioModal';
import { ResetModal } from './modals/ResetModal';
import { TabBar } from './components/TabBar';
import { ToastBanner } from './components/ToastBanner';
import { TrophiesTab } from './tabs/TrophiesTab';
import { UndoBar } from './components/UndoBar';
import { WeightTab } from './tabs/WeightTab';
import { AppHeader } from './components/header/AppHeader';

export function App() {
  const [gameState, setGameState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.quests)) {
          return {
            ...INITIAL_STATE,
            ...parsed,
            weightHistory: Array.isArray(parsed.weightHistory)
              ? parsed.weightHistory
              : INITIAL_STATE.weightHistory
          };
        }
      }
    } catch (e) {}
    return INITIAL_STATE;
  });

  const [cloudStatus, setCloudStatus] = useState('loading');
  const isLoaded = useRef(false);
  const cloudOk = useRef(false);          // true seulement si on a réussi à lire le cloud
  const skipPush = useRef(false);         // état tout juste reçu du cloud : ne pas le renvoyer
  const hadLocal = useRef((() => { try { return !!localStorage.getItem(STORAGE_KEY); } catch (e) { return false; } })());
  const TS_KEY = 'rondoudou_local_ts';
  const getLocalTs = () => { try { return Number(localStorage.getItem(TS_KEY)) || 0; } catch (e) { return 0; } };
  const setLocalTs = t => { try { localStorage.setItem(TS_KEY, String(t)); } catch (e) {} };
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const pushCloud = (state, ts) =>
    fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...state, _savedAt: ts }),
      redirect: "follow"
    });

  // 1. Lecture du cloud (au démarrage, puis à chaque retour sur l'app) — la version la plus récente gagne
  const loadCloud = isStartup => {
    setCloudStatus('loading');
    return fetch(SCRIPT_URL + "?t=" + Date.now(), { redirect: "follow" })
      .then(r => r.json())
      .then(res => {
        cloudOk.current = true;
        if (res && res.data && Array.isArray(res.data.quests)) {
          const { _savedAt, ...cloudData } = res.data;
          const cloudTs = Number(_savedAt) || 0;
          const localTs = getLocalTs();
          // Les modifications locales plus récentes que le cloud (ex. faites hors-ligne) sont conservées
          const localNewer = hadLocal.current && localTs > cloudTs && localTs > 0;
          const applyCloud = isStartup ? !localNewer : cloudTs > localTs;
          if (applyCloud) {
            const merged = {
              ...INITIAL_STATE,
              ...cloudData,
              weightHistory: Array.isArray(cloudData.weightHistory) ? cloudData.weightHistory : INITIAL_STATE.weightHistory
            };
            skipPush.current = true;
            setGameState(merged);
            setLocalTs(cloudTs);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch (e) {}
            setCloudStatus('synced');
          } else if (localNewer) {
            return pushCloud(stateRef.current, localTs).then(() => setCloudStatus('synced'));
          } else setCloudStatus('synced');
        } else if (hadLocal.current) {
          // Cloud vide : on y met la sauvegarde de cet appareil (seulement si elle existe vraiment)
          const ts = getLocalTs() || Date.now();
          setLocalTs(ts);
          return pushCloud(stateRef.current, ts).then(() => setCloudStatus('synced'));
        } else setCloudStatus('synced');
      })
      .catch(() => { setCloudStatus('error'); })
      .finally(() => { isLoaded.current = true; });
  };
  useEffect(() => {
    loadCloud(true);
    const onVis = () => { if (document.visibilityState === 'visible' && isLoaded.current) loadCloud(false); };
    document.addEventListener('visibilitychange', onVis);
    const retry = setInterval(() => { if (!cloudOk.current && isLoaded.current) loadCloud(false); }, 30000);
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(retry); };
  }, []);

  // 2. Sauvegarde automatique à chaque modification (LocalStorage + Google Sheets)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {}

    if (!isLoaded.current) return;
    if (skipPush.current) { skipPush.current = false; return; }
    const ts = Date.now();
    setLocalTs(ts);
    hadLocal.current = true;
    // Sécurité : tant que le cloud n'a pas pu être lu, on ne l'écrase JAMAIS (évite de perdre les données d'un autre appareil)
    if (!cloudOk.current) { setCloudStatus('error'); return; }
    setCloudStatus('saving');
    const timer = setTimeout(() => {
      pushCloud(gameState, ts)
        .then(() => setCloudStatus('synced'))
        .catch(() => setCloudStatus('error'));
    }, 500);

    return () => clearTimeout(timer);
  }, [gameState]);

  // Navigation et filtres
  const [activeTab, setActiveTab] = useState('quests');
  const [questFilter, setQuestFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(getTodayISODate());
  const [selectedJournalDay, setSelectedJournalDay] = useState(getTodayISODate());
  const [selectedChartQuestId, setSelectedChartQuestId] = useState(
    () => gameState.quests[0]?.id || ''
  );

  // Toast RPG Pokémon
  const [toast, setToast] = useState(null);
  const toastQueueRef = useRef([]);
  const triggerToast = (title, subtitle, xpGain = 0, badge = '🎵') => {
    const t = { title, subtitle, xpGain, badge, id: Date.now() + Math.random() };
    setToast(cur => {
      if (cur) { toastQueueRef.current.push(t); return cur; }
      return t;
    });
  };
  const dismissToast = () => setToast(toastQueueRef.current.shift() || null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // Déblocage automatique des trophées + versement du bonus EXP
  const paidAchievementsRef = useRef(null);
  useEffect(() => {
    if (!isLoaded.current) return;
    const unlocked = gameState.unlockedAchievements || [];
    if (paidAchievementsRef.current === null) {
      paidAchievementsRef.current = new Set(unlocked);
    }
    const paid = paidAchievementsRef.current;
    const all = new Set([...unlocked, ...computeDerivedAchievements(gameState)]);
    Array.from(paid).forEach(id => { if (!all.has(id)) paid.delete(id); });

    const fresh = ACHIEVEMENTS_LIST.filter(a => all.has(a.id) && !paid.has(a.id));
    if (fresh.length === 0) return;

    fresh.forEach(a => paid.add(a.id));
    const bonus = fresh.reduce((sum, a) => sum + a.xpBonus, 0);

    setGameState(prev => ({
      ...prev,
      xp: prev.xp + bonus,
      unlockedAchievements: Array.from(
        new Set([...(prev.unlockedAchievements || []), ...fresh.map(a => a.id)])
      )
    }));

    {
      playGameSound('boss', gameState.soundEnabled);
      triggerToast(
        fresh.length === 1 ? `🏆 Trophée : ${fresh[0].title}` : `🏆 ${fresh.length} trophées débloqués !`,
        fresh.length === 1 ? fresh[0].desc : fresh.map(a => a.title).join(' • '),
        bonus,
        fresh[0].icon
      );
    }
  }, [gameState, cloudStatus]);

  // Annuler après suppression
  const skipPRRef = useRef(false);
  const [undoInfo, setUndoInfo] = useState(null);
  const registerUndo = label => setUndoInfo({ label, snapshot: gameState, id: Date.now() });
  useEffect(() => {
    if (!undoInfo) return;
    const t = setTimeout(() => setUndoInfo(null), 8000);
    return () => clearTimeout(t);
  }, [undoInfo]);
  const handleUndo = () => {
    if (!undoInfo) return;
    skipPRRef.current = true;
    setGameState(undoInfo.snapshot);
    setUndoInfo(null);
    triggerToast('Suppression annulée', 'Les données ont été restaurées.', 0, '↩️');
  };

  // Détection des nouveaux records personnels
  const prRef = useRef(null);
  useEffect(() => {
    if (!isLoaded.current) return;
    const flat = {};
    computePersonalRecords(gameState).forEach(g =>
      g.recs.forEach(r => { flat[r.key] = { ...r, name: g.name }; })
    );
    const prev = prRef.current;
    prRef.current = flat;
    if (prev === null) return;
    if (skipPRRef.current) { skipPRRef.current = false; return; }
    const broken = Object.keys(flat).filter(k => prev[k] !== undefined && flat[k].score > prev[k].score);
    if (broken.length === 0) return;
    const r = flat[broken[0]];
    playGameSound('boss', gameState.soundEnabled);
    triggerToast(
      `Nouveau record : ${r.name}`,
      `${r.label} : ${r.text}${broken.length > 1 ? ` (+${broken.length - 1} autre(s) record(s))` : ''}`,
      0,
      '🏅'
    );
  }, [gameState, cloudStatus]);

  const weekData = useMemo(() => {
    const entries = getAllEntries(gameState);
    const ws = getWeekStart();
    return { ws, cur: computeWeekStats(entries, ws), prev: computeWeekStats(entries, addDaysISO(ws, -7)), challenges: getWeekChallenges(ws) };
  }, [gameState.quests]);
  const records = useMemo(() => computePersonalRecords(gameState), [gameState.quests]);
  const achStats = useMemo(() => computeAchievementStats(gameState), [gameState]);
  const handleClaimChallenge = c => {
    if ((gameState.claimedChallenges || []).includes(c.uid)) return;
    setGameState(prev => ({ ...prev, xp: prev.xp + c.xp, claimedChallenges: [...(prev.claimedChallenges || []), c.uid] }));
    playGameSound('boss', gameState.soundEnabled);
    triggerToast(`Défi relevé : ${c.title}`, c.desc, c.xp, c.icon);
  };

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

  // Modale "Objectif Validé & Passage au Niveau Supérieur"
  const [levelUpModalQuest, setLevelUpModalQuest] = useState(null);
  const [nextGoalMode, setNextGoalMode] = useState('sets_reps');
  const [nextGoalValue, setNextGoalValue] = useState(60);
  const [nextGoalSets, setNextGoalSets] = useState(3);
  const [nextGoalReps, setNextGoalReps] = useState(8);
  const [nextGoalAssistanceKg, setNextGoalAssistanceKg] = useState(0);

  // Modale "Ajouter / Ajuster un Objectif"
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState(null);
  const [formCatalogId, setFormCatalogId] = useState('pullups');
  const [formCustomName, setFormCustomName] = useState('');
  const [formCategory, setFormCategory] = useState('Dos');
  const [formType, setFormType] = useState('strength');
  const [formUnit, setFormUnit] = useState('reps');
  const [formTimed, setFormTimed] = useState(false);
  const [formGoalMode, setFormGoalMode] = useState('sets_reps');
  const [formCardioMode, setFormCardioMode] = useState('run');
  const [formIcon, setFormIcon] = useState('🦅');
  const [formStartValue, setFormStartValue] = useState(4);
  const [formCurrentValue, setFormCurrentValue] = useState(4);
  const [formGoalValue, setFormGoalValue] = useState(6);
  const [formGoalSets, setFormGoalSets] = useState(3);
  const [formGoalReps, setFormGoalReps] = useState(6);
  const [formStartAssistanceKg, setFormStartAssistanceKg] = useState(15);
  const [formGoalAssistanceKg, setFormGoalAssistanceKg] = useState(0);

  // Modale rapide "+ Course / Marche du jour"
  const [quickCardioModalOpen, setQuickCardioModalOpen] = useState(false);
  const [quickCardioCatalogId, setQuickCardioCatalogId] = useState('running_endurance');
  const [quickCardioDistanceKm, setQuickCardioDistanceKm] = useState(5);
  const [quickCardioDurationMin, setQuickCardioDurationMin] = useState(28);
  const [quickCardioElevationM, setQuickCardioElevationM] = useState(40);
  const [quickCardioRpe, setQuickCardioRpe] = useState(7);
  const [quickCardioDate, setQuickCardioDate] = useState(getTodayISODate());
  const [quickCardioNote, setQuickCardioNote] = useState('');

  // États pour l'onglet "⚖️ Suivi du Poids"
  const [newWeightInput, setNewWeightInput] = useState(() => gameState.userWeightKg || 82);
  const [newWeightDate, setNewWeightDate] = useState(getTodayISODate());
  const [newWeightNote, setNewWeightNote] = useState('');

  // Modale d'avertissement de réinitialisation (Professeur Chen)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // ==========================================
  // CALCULS DÉRIVÉS
  // ==========================================
  const levelInfo = useMemo(() => {
    const level = Math.floor(gameState.xp / 250) + 1;
    const currentLevelXp = gameState.xp % 250;
    const progressPct = Math.min(100, Math.round((currentLevelXp / 250) * 100));
    const rank = [...RPG_RANKS].reverse().find(r => level >= r.minLevel) || RPG_RANKS[0];
    return { level, currentLevelXp, nextLevelXp: 250, progressPct, rank };
  }, [gameState.xp]);

  const currentStreak = useMemo(() => computeCurrentStreak(gameState.quests), [gameState.quests]);

  const arenaLevels = useMemo(() => {
    return ARENA_GROUPS.map(arena => {
      const matchingQuests = gameState.quests.filter(
        q => normalizeArenaGroup(q.category, q.type) === arena.id
      );
      const levelUpsInGroup = matchingQuests.reduce(
        (sum, q) => sum + Math.max(0, (Number(q.level) || 1) - 1),
        0
      );
      const bossesReady = matchingQuests.filter(q => evaluateQuestProgress(q).isBossDefeated).length;
      const groupLevel = 1 + levelUpsInGroup + bossesReady;
      return {
        ...arena,
        groupLevel,
        questsCount: matchingQuests.length,
        bossesReady
      };
    });
  }, [gameState.quests]);

  const dailySummary = useMemo(() => {
    let strengthKcal = 0;
    let cardioKcal = 0;
    const activities = [];

    gameState.quests.forEach(quest => {
      (quest.history || []).forEach(entry => {
        if (entry.date === selectedDate) {
          const kcal = Number(entry.calories) || 0;
          if (quest.type === 'cardio') {
            cardioKcal += kcal;
          } else {
            strengthKcal += kcal;
          }
          activities.push({
            ...entry,
            questId: quest.id,
            questName: quest.name,
            questIcon: quest.icon,
            questType: quest.type,
            questUnit: quest.unit,
            questTimed: isTimedQuest(quest),
            goalMode: quest.goalMode || 'sets_reps',
            goalSets: quest.goalSets || 3,
            goalReps: quest.goalReps || quest.goalValue || 6
          });
        }
      });
    });

    return {
      strengthKcal,
      cardioKcal,
      totalKcal: strengthKcal + cardioKcal,
      activities
    };
  }, [gameState.quests, selectedDate]);

  const dailyJournalList = useMemo(() => {
    const byDate = {};

    gameState.quests.forEach(quest => {
      const hist = quest.history || [];
      hist.forEach((entry, index) => {
        const dateKey = entry.date || getTodayISODate();
        if (!byDate[dateKey]) {
          byDate[dateKey] = {
            date: dateKey,
            totalKcal: 0,
            totalSets: 0,
            totalReps: 0,
            improvedCount: 0,
            goalsBeatenCount: 0,
            items: []
          };
        }
        const prevEntry = index > 0 ? hist[index - 1] : null;
        const comparison = compareWithPreviousSession(quest, entry, prevEntry);

        const setsArr =
          quest.type === 'strength'
            ? getSetDetailsArray(entry, quest.goalSets || 3, quest.goalReps || 6)
            : [];

        byDate[dateKey].totalKcal += Number(entry.calories) || 0;
        byDate[dateKey].totalSets += setsArr.length;
        if (!isTimedQuest(quest)) byDate[dateKey].totalReps += setsArr.reduce((a, b) => a + b, 0);
        if (comparison.improved) byDate[dateKey].improvedCount += 1;
        if (comparison.goalBeaten) byDate[dateKey].goalsBeatenCount += 1;

        byDate[dateKey].items.push({
          entry,
          quest,
          setsArr,
          comparison
        });
      });
    });

    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [gameState.quests]);

  const lifetimeStats = useMemo(() => {
    let totalKcal = 0;
    let totalSessions = 0;
    let bossesDefeated = 0;

    gameState.quests.forEach(q => {
      const ev = evaluateQuestProgress(q);
      if (ev.isBossDefeated) bossesDefeated += 1;
      (q.history || []).forEach(h => {
        totalKcal += Number(h.calories) || 0;
        totalSessions += 1;
      });
    });

    return { totalKcal, totalSessions, bossesDefeated };
  }, [gameState.quests]);

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

  const liveQuickCardioCalories = useMemo(() => {
    const cat =
      EXERCISE_CATALOG.find(c => c.id === quickCardioCatalogId) ||
      EXERCISE_CATALOG.find(c => c.id === 'running_endurance');
    return calculateCardioCalories({
      cardioMode: cat?.cardioMode || 'run',
      distanceKm: quickCardioDistanceKm,
      durationMin: quickCardioDurationMin,
      elevationM: quickCardioElevationM,
      rpe: quickCardioRpe,
      userWeightKg: gameState.userWeightKg
    });
  }, [
    quickCardioCatalogId,
    quickCardioDistanceKm,
    quickCardioDurationMin,
    quickCardioElevationM,
    quickCardioRpe,
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

  const openLevelUpModal = quest => {
    playGameSound('boss', gameState.soundEnabled);
    setLevelUpModalQuest(quest);
    const gMode = quest.goalMode || 'sets_reps';
    setNextGoalMode(gMode);

    if (quest.type === 'cardio') {
      setNextGoalValue(Math.round((Number(quest.goalValue) || 5) * 1.25 * 10) / 10);
    } else if (quest.unit === 'kg') {
      setNextGoalValue((Number(quest.goalValue) || Number(quest.currentValue) || 40) + 5);
      setNextGoalSets(Number(quest.goalSets) || 3);
      setNextGoalReps(Number(quest.goalReps) || 8);
      setNextGoalAssistanceKg(0);
    } else {
      const currAssist = Number(quest.currentAssistanceKg) || 0;
      const nextAssist = Math.max(0, currAssist - 5);
      setNextGoalAssistanceKg(nextAssist);
      setNextGoalSets(Number(quest.goalSets) || 3);
      const nextReps = currAssist === 0 ? (Number(quest.goalReps) || 6) + (isTimedQuest(quest) ? 10 : 2) : Number(quest.goalReps) || 6;
      setNextGoalReps(nextReps);
      setNextGoalValue(nextReps);
    }
  };

  const handleConfirmLevelUp = e => {
    e.preventDefault();
    if (!levelUpModalQuest) return;

    const q = levelUpModalQuest;
    const newLevel = (Number(q.level) || 1) + 1;
    const newUnlocked = new Set(gameState.unlockedAchievements);
    newUnlocked.add('level_up_exo');
    newUnlocked.add('boss_slayer');

    setGameState(prev => ({
      ...prev,
      xp: prev.xp + 300,
      unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...newUnlocked])),
      quests: prev.quests.map(item => {
        if (item.id !== q.id) return item;
        if (item.type === 'cardio') {
          return {
            ...item,
            level: newLevel,
            startValue: item.currentValue,
            goalValue: Math.max(1, Number(nextGoalValue) || item.goalValue + 2)
          };
        }
        const gSets = Math.max(1, Number(nextGoalSets) || 3);
        const gReps = Math.max(1, Number(nextGoalReps) || 6);
        const gVal =
          item.unit === 'reps'
            ? gReps
            : Math.max(1, Number(nextGoalValue) || item.goalValue + 2.5);
        return {
          ...item,
          level: newLevel,
          goalMode: nextGoalMode,
          startValue: item.currentValue,
          goalValue: gVal,
          goalSets: gSets,
          goalReps: gReps,
          startAssistanceKg: item.currentAssistanceKg || 0,
          goalAssistanceKg: item.unit === 'reps' ? Math.max(0, Number(nextGoalAssistanceKg) || 0) : 0
        };
      })
    }));

    setLevelUpModalQuest(null);
    playGameSound('boss', gameState.soundEnabled);
    triggerToast(
      `🎵 Niveau ${newLevel} débloqué sur ${q.name} !`,
      `Nouvel objectif enregistré pour viser le Niveau ${newLevel + 1} !`,
      300,
      '👑'
    );
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

    setGameState(prev => ({
      ...prev,
      xp: prev.xp + xpEarned,
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
    triggerToast(bannerTitle, bannerSubtitle, xpEarned, bannerBadge);

    if (questForAutoLevelUp) {
      openLevelUpModal(questForAutoLevelUp);
    }
  };

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

  const handleSaveQuickCardio = e => {
    e.preventDefault();
    const cat =
      EXERCISE_CATALOG.find(c => c.id === quickCardioCatalogId) ||
      EXERCISE_CATALOG.find(c => c.id === 'running_endurance');

    const dist = Math.max(0.1, Number(quickCardioDistanceKm) || 5);
    const dur = Math.max(1, Number(quickCardioDurationMin) || 25);
    const elev = Math.max(0, Number(quickCardioElevationM) || 0);
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
        `${cat.name} : ${dist} km en ${dur} min (D+ ${elev}m)`
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

    setGameState(prev => ({
      ...prev,
      xp: prev.xp + xpGain,
      unlockedAchievements: Array.from(new Set([...(prev.unlockedAchievements || []), ...newUnlocked])),
      quests: updatedQuests
    }));

    setSelectedDate(quickCardioDate);
    setSelectedJournalDay(quickCardioDate);
    setQuickCardioModalOpen(false);
    playGameSound('xp', gameState.soundEnabled);
    triggerToast(
      `${cat.name} ajoutée !`,
      `${dist} km en ${dur} min • 🔥 ${calories} kcal brûlées`,
      xpGain,
      cat.icon
    );
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

  const openCreateQuestModal = () => {
    const def = EXERCISE_CATALOG[0];
    setEditingQuestId(null);
    setFormCatalogId(def.id);
    setFormCustomName(def.name);
    setFormCategory(def.category);
    setFormType(def.type);
    setFormUnit(def.unit);
    setFormTimed(isTimedCatalog(def));
    setFormGoalMode(def.defaultGoalMode || 'sets_reps');
    setFormCardioMode(def.cardioMode || 'run');
    setFormIcon(def.icon);
    setFormStartValue(def.defaultStart);
    setFormCurrentValue(def.defaultStart);
    setFormGoalValue(def.defaultGoal);
    setFormGoalSets(def.defaultGoalSets || 3);
    setFormGoalReps(def.defaultGoalReps || 6);
    setFormStartAssistanceKg(def.defaultStartAssistance || 0);
    setFormGoalAssistanceKg(def.defaultGoalAssistance || 0);
    setQuestModalOpen(true);
  };

  const openEditQuestModal = quest => {
    setEditingQuestId(quest.id);
    setFormCatalogId(quest.catalogId || 'custom');
    setFormCustomName(quest.name);
    setFormCategory(normalizeArenaGroup(quest.category, quest.type));
    setFormType(quest.type || 'strength');
    setFormUnit(quest.unit || 'reps');
    setFormTimed(isTimedQuest(quest));
    setFormGoalMode(quest.goalMode || 'sets_reps');
    setFormCardioMode(quest.cardioMode || 'run');
    setFormIcon(quest.icon || '⚔️');
    setFormStartValue(Number(quest.startValue) || 0);
    setFormCurrentValue(Number(quest.currentValue) || 0);
    setFormGoalValue(Number(quest.goalValue) || 6);
    setFormGoalSets(Number(quest.goalSets) || 3);
    setFormGoalReps(Number(quest.goalReps) || Number(quest.goalValue) || 6);
    setFormStartAssistanceKg(Number(quest.startAssistanceKg) || 0);
    setFormGoalAssistanceKg(Number(quest.goalAssistanceKg) || 0);
    setQuestModalOpen(true);
  };

  const handleSelectCatalogExercise = catId => {
    setFormCatalogId(catId);
    if (catId === 'custom_strength') {
      setFormCustomName('');
      setFormCategory('Pectoraux');
      setFormType('strength');
      setFormUnit('kg');
      setFormTimed(false);
      setFormGoalMode('sets_reps');
      setFormIcon('⚔️');
      setFormStartValue(20);
      setFormCurrentValue(20);
      setFormGoalValue(40);
      setFormGoalSets(3);
      setFormGoalReps(8);
      setFormStartAssistanceKg(0);
      setFormGoalAssistanceKg(0);
      return;
    }
    if (catId === 'custom_bodyweight') {
      setFormCustomName('');
      setFormCategory('Dos');
      setFormType('strength');
      setFormUnit('reps');
      setFormTimed(false);
      setFormGoalMode('sets_reps');
      setFormIcon('🦅');
      setFormStartValue(4);
      setFormCurrentValue(4);
      setFormGoalValue(8);
      setFormGoalSets(3);
      setFormGoalReps(8);
      setFormStartAssistanceKg(10);
      setFormGoalAssistanceKg(0);
      return;
    }
    const found = EXERCISE_CATALOG.find(item => item.id === catId);
    if (!found) return;
    setFormCustomName(found.name);
    setFormCategory(normalizeArenaGroup(found.category, found.type));
    setFormType(found.type);
    setFormUnit(found.unit);
    setFormTimed(isTimedCatalog(found));
    setFormGoalMode(found.defaultGoalMode || 'sets_reps');
    setFormCardioMode(found.cardioMode || 'run');
    setFormIcon(found.icon);
    setFormStartValue(found.defaultStart);
    setFormCurrentValue(found.defaultStart);
    setFormGoalValue(found.defaultGoal);
    setFormGoalSets(found.defaultGoalSets || 3);
    setFormGoalReps(found.defaultGoalReps || 6);
    setFormStartAssistanceKg(found.defaultStartAssistance || 0);
    setFormGoalAssistanceKg(found.defaultGoalAssistance || 0);
  };

  const handleSaveQuestForm = e => {
    e.preventDefault();
    const cleanName = formCustomName.trim() || 'Nouvel Exercice';
    const gSets = formGoalMode === 'reps_only' ? 1 : Math.max(1, Number(formGoalSets) || 3);
    const gReps = Math.max(1, Number(formGoalReps) || 6);
    const effectiveUnit =
      formType === 'strength' && formGoalMode === 'weight_only' ? 'kg' : formUnit;
    const finalGoalValue =
      formType === 'strength' && effectiveUnit === 'reps'
        ? gReps
        : Math.max(1, Number(formGoalValue) || gReps);

    if (editingQuestId) {
      setGameState(prev => ({
        ...prev,
        quests: prev.quests.map(q => {
          if (q.id !== editingQuestId) return q;
          return {
            ...q,
            name: cleanName,
            category: formCategory,
            type: formType,
            unit: effectiveUnit,
            timed: formType === 'strength' && effectiveUnit === 'reps' ? formTimed : undefined,
            goalMode: formGoalMode,
            cardioMode: formCardioMode,
            icon: formIcon,
            startValue: Number(formStartValue) || 0,
            currentValue: Number(formCurrentValue) || 0,
            goalValue: finalGoalValue,
            goalSets: gSets,
            goalReps: gReps,
            startAssistanceKg:
              effectiveUnit === 'reps' && !formTimed ? Number(formStartAssistanceKg) || 0 : 0,
            goalAssistanceKg:
              effectiveUnit === 'reps' && !formTimed ? Number(formGoalAssistanceKg) || 0 : 0
          };
        })
      }));
      triggerToast('Objectif ajusté !', `${cleanName} mis à jour.`, 25, '🛠️');
    } else {
      const startRepsOrVal = Number(formStartValue) || 0;
      const initialSetDetails =
        formType === 'strength'
          ? Array(gSets).fill(effectiveUnit === 'reps' ? startRepsOrVal : gReps)
          : [];

      const initialCalories =
        formType === 'cardio'
          ? calculateCardioCalories({
              cardioMode: formCardioMode,
              distanceKm: startRepsOrVal,
              durationMin: 25,
              elevationM: 20,
              rpe: 7,
              userWeightKg: gameState.userWeightKg
            })
          : calculateStrengthCalories({
              unit: effectiveUnit,
              timed: formTimed,
              weightKg: effectiveUnit === 'kg' ? startRepsOrVal : 0,
              assistanceKg:
                effectiveUnit === 'reps' && !formTimed ? Number(formStartAssistanceKg) || 0 : 0,
              setDetails: initialSetDetails,
              rpe: 7,
              userWeightKg: gameState.userWeightKg
            });

      const newQuest = {
        id: `q_${Date.now()}`,
        catalogId: formCatalogId,
        name: cleanName,
        category: formCategory,
        type: formType,
        cardioMode: formCardioMode,
        unit: effectiveUnit,
        timed: formType === 'strength' && effectiveUnit === 'reps' ? formTimed : undefined,
        goalMode: formGoalMode,
        level: 1,
        icon: formIcon,
        startValue: startRepsOrVal,
        currentValue: Number(formCurrentValue) || startRepsOrVal,
        goalValue: finalGoalValue,
        goalSets: gSets,
        goalReps: gReps,
        setDetails: initialSetDetails,
        startAssistanceKg:
          effectiveUnit === 'reps' && !formTimed ? Number(formStartAssistanceKg) || 0 : 0,
        currentAssistanceKg:
          effectiveUnit === 'reps' && !formTimed ? Number(formStartAssistanceKg) || 0 : 0,
        goalAssistanceKg:
          effectiveUnit === 'reps' && !formTimed ? Number(formGoalAssistanceKg) || 0 : 0,
        history: [
          {
            id: `h_start_${Date.now()}`,
            date: getTodayISODate(),
            value: Number(formCurrentValue) || startRepsOrVal,
            sets: gSets,
            reps: effectiveUnit === 'reps' ? startRepsOrVal : gReps,
            setDetails: initialSetDetails,
            assistanceKg:
              effectiveUnit === 'reps' && !formTimed ? Number(formStartAssistanceKg) || 0 : 0,
            rpe: 7,
            calories: initialCalories,
            goalBeaten: false,
            note: `Point de départ — Niveau 1 (${cleanName})`
          }
        ]
      };

      setGameState(prev => ({
        ...prev,
        xp: prev.xp + 40,
        quests: [newQuest, ...prev.quests]
      }));
      setSelectedChartQuestId(newQuest.id);
      triggerToast('Nouvelle Quête Créée !', `${cleanName} ajouté au Pokédex.`, 40, formIcon);
    }

    setQuestModalOpen(false);
    playGameSound('xp', gameState.soundEnabled);
  };

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

  const handleDeleteQuest = questId => {
    registerUndo('Quête retirée');
    setGameState(prev => ({
      ...prev,
      quests: prev.quests.filter(q => q.id !== questId)
    }));
    triggerToast('Quête retirée', 'L’exercice a été retiré du Pokédex.', 0, '🗑️');
  };

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

  const filteredQuests = useMemo(() => {
    if (questFilter === 'all') return gameState.quests;
    return gameState.quests.filter(
      q => normalizeArenaGroup(q.category, q.type) === questFilter
    );
  }, [gameState.quests, questFilter]);

  const activeChartQuest = useMemo(() => {
    return (
      gameState.quests.find(q => q.id === selectedChartQuestId) ||
      gameState.quests[0] ||
      null
    );
  }, [gameState.quests, selectedChartQuestId]);

  const activeJournalDayObj = useMemo(() => {
    return (
      dailyJournalList.find(d => d.date === selectedJournalDay) ||
      dailyJournalList[0] ||
      null
    );
  }, [dailyJournalList, selectedJournalDay]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-white pb-16">
      {/* TOAST NOTIFICATION POKÉMON RONDOUDOU */}
      {toast && (
        <ToastBanner dismissToast={dismissToast} toast={toast} />
      )}

      {undoInfo && (
        <UndoBar handleUndo={handleUndo} undoInfo={undoInfo} />
      )}

      {/* EN-TÊTE : AVATAR RONDOUDOU NATUREL EN HAUT À GAUCHE */}
      <AppHeader
        arenaLevels={arenaLevels}
        cloudStatus={cloudStatus}
        currentStreak={currentStreak}
        gameState={gameState}
        handleExportJSON={handleExportJSON}
        handleImportJSON={handleImportJSON}
        importInputRef={importInputRef}
        levelInfo={levelInfo}
        lifetimeStats={lifetimeStats}
        loadCloud={loadCloud}
        openCreateQuestModal={openCreateQuestModal}
        questFilter={questFilter}
        selectedDate={selectedDate}
        setActiveTab={setActiveTab}
        setConfirmResetOpen={setConfirmResetOpen}
        setGameState={setGameState}
        setQuestFilter={setQuestFilter}
        setQuickCardioDate={setQuickCardioDate}
        setQuickCardioModalOpen={setQuickCardioModalOpen}
      />

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
<VoiceWorkoutAssistant
  gameState={gameState}
  setGameState={setGameState}
  selectedDate={selectedDate}
  triggerToast={triggerToast}
  playGameSound={playGameSound}
/>
{recap && <SessionRecap recap={recap} onClose={() => setRecap(null)} />}
{guided && guidedOpen && (
<GuidedSession
g={guided}
setG={setGuided}
onFinish={handleFinishGuided}
onMinimize={() => setGuidedOpen(false)}
onCancel={() => { setGuided(null); setGuidedOpen(false); }}
/>
)}
<RestTimer soundEnabled={gameState.soundEnabled} />
        {/* BANNIÈRE BILAN ÉNERGÉTIQUE & SÉANCE DU JOUR (AVEC SUPPRESSION D'UNE SÉANCE) */}
        <DailySummary dailySummary={dailySummary} handleDeleteSessionEntry={handleDeleteSessionEntry} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

        {/* BARRE D'ONGLETS PRINCIPALE */}
        <TabBar activeTab={activeTab} dailyJournalList={dailyJournalList} gameState={gameState} setActiveTab={setActiveTab} />

        {activeTab === 'coach' && (
          <CoachPanel
            gameState={gameState}
            setGameState={setGameState}
            onStartGuided={startGuided}
            onOpenLevelUp={openLevelUpModal}
            onAddExercise={addQuestFromCatalog}
            onQuickCardio={() => { setQuickCardioDate(getTodayISODate()); setQuickCardioModalOpen(true); }}
            onGoTab={setActiveTab}
            guidedActive={!!guided}
            onResumeGuided={() => setGuidedOpen(true)}
            onClaimWeekly={handleClaimWeekly}
          />
        )}

        {/* ONGLET 1 : CARTES DES QUÊTES & OBJECTIFS */}
        {activeTab === 'quests' && (
          <QuestsTab
            filteredQuests={filteredQuests}
            gameState={gameState}
            handleDeleteQuest={handleDeleteQuest}
            openCreateQuestModal={openCreateQuestModal}
            openEditQuestModal={openEditQuestModal}
            openLevelUpModal={openLevelUpModal}
            openLogModal={openLogModal}
            questFilter={questFilter}
            setActiveTab={setActiveTab}
            setQuestFilter={setQuestFilter}
            setSelectedChartQuestId={setSelectedChartQuestId}
          />
        )}

        {/* ONGLET 2 : 📅 JOURNAL DES SÉANCES */}
        {activeTab === 'journal' && (
          <JournalTab activeJournalDayObj={activeJournalDayObj} dailyJournalList={dailyJournalList} handleDeleteSessionEntry={handleDeleteSessionEntry} setSelectedJournalDay={setSelectedJournalDay} />
        )}

        {/* ONGLET 3 : COURBES DE PROGRESSION */}
        {activeTab === 'charts' && (
          <ChartsTab activeChartQuest={activeChartQuest} gameState={gameState} openLogModal={openLogModal} setSelectedChartQuestId={setSelectedChartQuestId} />
        )}

        {/* ONGLET 4 : ⚖️ SUIVI DU POIDS */}
        {activeTab === 'weight' && (
          <WeightTab
            gameState={gameState}
            handleAddWeightEntry={handleAddWeightEntry}
            handleDeleteWeightEntry={handleDeleteWeightEntry}
            newWeightDate={newWeightDate}
            newWeightInput={newWeightInput}
            newWeightNote={newWeightNote}
            setGameState={setGameState}
            setNewWeightDate={setNewWeightDate}
            setNewWeightInput={setNewWeightInput}
            setNewWeightNote={setNewWeightNote}
          />
        )}

        {/* ONGLET : BILAN (défis, semaine, records) */}
        {activeTab !== 'photos' && <PhotoReminder gameState={gameState} onGo={() => setActiveTab('photos')} />}
        {activeTab === 'photos' && <PhotoCalendar gameState={gameState} />}

        {activeTab === 'bilan' && (
          <BilanTab gameState={gameState} handleClaimChallenge={handleClaimChallenge} records={records} weekData={weekData} />
        )}

        {/* ONGLET 5 : TROPHÉES */}
        {activeTab === 'trophies' && (
          <TrophiesTab achStats={achStats} gameState={gameState} />
        )}
      </main>

      {/* MODALE 1 : NOTER UNE SÉANCE */}
      {logModalQuest && (
        <LogSessionModal
          handleAddSetSlot={handleAddSetSlot}
          handleApplyUniformToSets={handleApplyUniformToSets}
          handleRemoveSetSlot={handleRemoveSetSlot}
          handleSaveSession={handleSaveSession}
          handleUpdateSingleSetRep={handleUpdateSingleSetRep}
          liveModalCalories={liveModalCalories}
          logAssistanceKg={logAssistanceKg}
          logDate={logDate}
          logDurationMin={logDurationMin}
          logElevationM={logElevationM}
          logEntryMode={logEntryMode}
          logModalQuest={logModalQuest}
          logNote={logNote}
          logSetDetails={logSetDetails}
          logUniformReps={logUniformReps}
          logUniformSets={logUniformSets}
          logUseAssistance={logUseAssistance}
          logValue={logValue}
          setLogAssistanceKg={setLogAssistanceKg}
          setLogDate={setLogDate}
          setLogDurationMin={setLogDurationMin}
          setLogElevationM={setLogElevationM}
          setLogEntryMode={setLogEntryMode}
          setLogModalQuest={setLogModalQuest}
          setLogNote={setLogNote}
          setLogUseAssistance={setLogUseAssistance}
          setLogValue={setLogValue}
        />
      )}

      {/* MODALE 2 : OBJECTIF VALIDÉ & PASSAGE AU NIVEAU SUPÉRIEUR */}
      {levelUpModalQuest && (
        <LevelUpModal
          handleConfirmLevelUp={handleConfirmLevelUp}
          levelUpModalQuest={levelUpModalQuest}
          nextGoalAssistanceKg={nextGoalAssistanceKg}
          nextGoalMode={nextGoalMode}
          nextGoalReps={nextGoalReps}
          nextGoalSets={nextGoalSets}
          nextGoalValue={nextGoalValue}
          setLevelUpModalQuest={setLevelUpModalQuest}
          setNextGoalAssistanceKg={setNextGoalAssistanceKg}
          setNextGoalMode={setNextGoalMode}
          setNextGoalReps={setNextGoalReps}
          setNextGoalSets={setNextGoalSets}
          setNextGoalValue={setNextGoalValue}
        />
      )}

      {/* MODALE 3 : CRÉER OU AJUSTER UN OBJECTIF */}
      {questModalOpen && (
        <QuestFormModal
          editingQuestId={editingQuestId}
          formCatalogId={formCatalogId}
          formCategory={formCategory}
          formCustomName={formCustomName}
          formGoalAssistanceKg={formGoalAssistanceKg}
          formGoalMode={formGoalMode}
          formGoalReps={formGoalReps}
          formGoalSets={formGoalSets}
          formGoalValue={formGoalValue}
          formStartAssistanceKg={formStartAssistanceKg}
          formStartValue={formStartValue}
          formTimed={formTimed}
          formType={formType}
          formUnit={formUnit}
          handleSaveQuestForm={handleSaveQuestForm}
          handleSelectCatalogExercise={handleSelectCatalogExercise}
          setFormCategory={setFormCategory}
          setFormCurrentValue={setFormCurrentValue}
          setFormCustomName={setFormCustomName}
          setFormGoalAssistanceKg={setFormGoalAssistanceKg}
          setFormGoalMode={setFormGoalMode}
          setFormGoalReps={setFormGoalReps}
          setFormGoalSets={setFormGoalSets}
          setFormGoalValue={setFormGoalValue}
          setFormStartAssistanceKg={setFormStartAssistanceKg}
          setFormStartValue={setFormStartValue}
          setFormTimed={setFormTimed}
          setFormUnit={setFormUnit}
          setQuestModalOpen={setQuestModalOpen}
        />
      )}

      {/* MODALE 4 : AJOUT RAPIDE "+ COURSE / MARCHE DU JOUR" */}
      {quickCardioModalOpen && (
        <QuickCardioModal
          handleSaveQuickCardio={handleSaveQuickCardio}
          liveQuickCardioCalories={liveQuickCardioCalories}
          quickCardioCatalogId={quickCardioCatalogId}
          quickCardioDate={quickCardioDate}
          quickCardioDistanceKm={quickCardioDistanceKm}
          quickCardioDurationMin={quickCardioDurationMin}
          quickCardioElevationM={quickCardioElevationM}
          quickCardioNote={quickCardioNote}
          quickCardioRpe={quickCardioRpe}
          setQuickCardioCatalogId={setQuickCardioCatalogId}
          setQuickCardioDate={setQuickCardioDate}
          setQuickCardioDistanceKm={setQuickCardioDistanceKm}
          setQuickCardioDurationMin={setQuickCardioDurationMin}
          setQuickCardioElevationM={setQuickCardioElevationM}
          setQuickCardioModalOpen={setQuickCardioModalOpen}
          setQuickCardioNote={setQuickCardioNote}
          setQuickCardioRpe={setQuickCardioRpe}
        />
      )}

      {/* MODALE 5 : AVERTISSEMENT DE RÉINITIALISATION SÉCURISÉ */}
      {confirmResetOpen && (
        <ResetModal handleResetAll={handleResetAll} setConfirmResetOpen={setConfirmResetOpen} />
      )}
    </div>
  );
}
