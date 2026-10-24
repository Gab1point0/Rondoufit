import { getTodayISODate, getYesterdayISODate } from '../lib/dates';

// ==========================================
// ÉTAT INITIAL COMPLET
// ==========================================
export const INITIAL_STATE = {
  heroName: 'Dresseur Rondoudou',
  startWeightKg: 84,
  userWeightKg: 82,
  targetWeightKg: 75,
  coach: { sessionsPerWeek: 2, sessionMinutes: 60, volleyDays: [4, 5], matchDates: [], deloadWeeks: [], cycleWeeks: 0, cycleStart: null, weeklyClaimed: [], splitMode: 'auto', gymSlots: {}, gymSkips: [] },
  weightHistory: [
    { id: 'w_1', date: getYesterdayISODate(), weightKg: 84.0, note: 'Pesée initiale (Mode Grosdoudou)' },
    { id: 'w_2', date: getTodayISODate(), weightKg: 82.0, note: 'Premiers kilos perdus, en route vers Rondoudou Fit !' }
  ],
  xp: 280,
  streak: 2,
  soundEnabled: true,
  xpWeeks: {},                                  // EXP gagnée par semaine (clé = lundi AAAA-MM-JJ), pour la courbe du Bilan
  xpDaily: { date: '', earned: 0 },             // EXP gagnée aujourd'hui (plafond du jour)
  rankTrials: [],                               // niveaux des rangs dont l'épreuve est réussie
  cosmetics: { theme: 'rose', accessory: 'none', title: '' },
  maxRecords: {},                               // records réels saisis dans l'onglet « Mes maxima » (clé = id de l'exercice)
  unlockedAchievements: ['first_blood', 'weight_tracker'],
  claimedChallenges: [],
  quests: [
    {
      id: 'q_pullups_3x6',
      catalogId: 'pullups',
      name: 'Tractions Pronation',
      category: 'Dos',
      type: 'strength',
      unit: 'reps',
      goalMode: 'sets_reps',
      level: 1,
      icon: '🦅',
      startValue: 4,
      currentValue: 6,
      goalValue: 6,
      goalSets: 3,
      goalReps: 6,
      setDetails: [6, 6, 4],
      startAssistanceKg: 15,
      currentAssistanceKg: 10,
      goalAssistanceKg: 0,
      history: [
        {
          id: 'h_pull_0',
          date: getYesterdayISODate(),
          value: 5,
          sets: 3,
          reps: 5,
          setDetails: [5, 4, 4],
          assistanceKg: 15,
          rpe: 8,
          calories: 52,
          goalBeaten: false,
          note: 'Première séance avec élastique 15 kg (5 - 4 - 4 reps).'
        },
        {
          id: 'h_pull_1',
          date: getTodayISODate(),
          value: 6,
          sets: 3,
          reps: 6,
          setDetails: [6, 6, 4],
          assistanceKg: 10,
          rpe: 8,
          calories: 58,
          goalBeaten: false,
          note: 'Passage à l’élastique 10 kg et 2 séries de 6 validées (6 - 6 - 4) !'
        }
      ]
    },
    {
      id: 'q_bench_3x8',
      catalogId: 'bench_press',
      name: 'Développé Couché Barre',
      category: 'Pectoraux',
      type: 'strength',
      unit: 'kg',
      goalMode: 'sets_reps',
      level: 1,
      icon: '🏋️',
      startValue: 40,
      currentValue: 45,
      goalValue: 60,
      goalSets: 3,
      goalReps: 8,
      setDetails: [8, 8, 7],
      startAssistanceKg: 0,
      currentAssistanceKg: 0,
      goalAssistanceKg: 0,
      history: [
        {
          id: 'h_bench_0',
          date: getYesterdayISODate(),
          value: 40,
          sets: 3,
          reps: 8,
          setDetails: [8, 7, 6],
          assistanceKg: 0,
          rpe: 7,
          calories: 68,
          goalBeaten: false,
          note: 'Reprise à 40 kg.'
        },
        {
          id: 'h_bench_1',
          date: getTodayISODate(),
          value: 45,
          sets: 3,
          reps: 8,
          setDetails: [8, 8, 7],
          assistanceKg: 0,
          rpe: 7,
          calories: 76,
          goalBeaten: false,
          note: '+5 kg sur la barre (45 kg) : 8 - 8 - 7 reps !'
        }
      ]
    },
    {
      id: 'q_squat_3x6',
      catalogId: 'squat',
      name: 'Squat Barre',
      category: 'Jambes',
      type: 'strength',
      unit: 'kg',
      goalMode: 'weight_only',
      level: 1,
      icon: '🦵',
      startValue: 50,
      currentValue: 60,
      goalValue: 80,
      goalSets: 3,
      goalReps: 6,
      setDetails: [6, 6, 6],
      startAssistanceKg: 0,
      currentAssistanceKg: 0,
      goalAssistanceKg: 0,
      history: [
        {
          id: 'h_sq_1',
          date: getTodayISODate(),
          value: 60,
          sets: 3,
          reps: 6,
          setDetails: [6, 6, 6],
          assistanceKg: 0,
          rpe: 7,
          calories: 84,
          goalBeaten: false,
          note: 'Barre à 60 kg propre en 3×6 ! En route vers les 80 kg.'
        }
      ]
    },
    {
      id: 'q_abs_crunch',
      catalogId: 'crunches_floor',
      name: 'Crunchs Abdominaux au Sol',
      category: 'Abdominaux',
      type: 'strength',
      unit: 'reps',
      goalMode: 'sets_reps',
      level: 1,
      icon: '🍫',
      startValue: 12,
      currentValue: 18,
      goalValue: 20,
      goalSets: 3,
      goalReps: 20,
      setDetails: [20, 20, 16],
      startAssistanceKg: 0,
      currentAssistanceKg: 0,
      goalAssistanceKg: 0,
      history: [
        {
          id: 'h_abs_1',
          date: getTodayISODate(),
          value: 20,
          sets: 3,
          reps: 20,
          setDetails: [20, 20, 16],
          assistanceKg: 0,
          rpe: 7,
          calories: 44,
          goalBeaten: false,
          note: '2 séries de 20 reps validées pour sculpter les abdos de Rondoudou !'
        }
      ]
    },
    {
      id: 'q_run_endurance',
      catalogId: 'running_endurance',
      name: 'Course à pied (Endurance)',
      category: 'Course & Cardio',
      type: 'cardio',
      cardioMode: 'run',
      unit: 'km',
      level: 1,
      icon: '🏃',
      startValue: 3,
      currentValue: 4.5,
      goalValue: 10,
      durationMin: 27,
      elevationM: 45,
      history: [
        {
          id: 'h_run_1',
          date: getTodayISODate(),
          value: 4.5,
          durationMin: 27,
          elevationM: 45,
          rpe: 7,
          calories: 365,
          goalBeaten: false,
          note: 'Footing de 4.5 km après la musculation.'
        }
      ]
    }
  ]
};
