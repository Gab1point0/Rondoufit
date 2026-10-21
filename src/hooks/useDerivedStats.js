import { ARENA_GROUPS, normalizeArenaGroup } from '../data/arenas';
import { RPG_RANKS } from '../data/gamification';
import { getTodayISODate } from '../lib/dates';
import { compareWithPreviousSession, evaluateQuestProgress } from '../lib/progress';
import { getSetDetailsArray, isTimedQuest } from '../lib/quests';
import { computeCurrentStreak } from '../lib/stats';
import { useMemo } from 'react';

export function useDerivedStats({ gameState, selectedDate }) {
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

  return { levelInfo, currentStreak, arenaLevels, dailySummary, dailyJournalList, lifetimeStats };
}
