import { ACHIEVEMENTS_LIST } from '../data/gamification';
import { addDaysISO, getWeekStart } from '../lib/dates';
import { getAllEntries } from '../lib/quests';
import { playGameSound } from '../lib/sound';
import { computeAchievementStats, computeDerivedAchievements, computePersonalRecords, computeWeekStats, getWeekChallenges } from '../lib/stats';
import { useEffect, useMemo, useRef, useState } from 'react';

export function useRewards({ syncStatus, gameState, isLoaded, setGameState, setGameStateAuto, triggerToast }) {
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

    setGameStateAuto(prev => ({
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
  }, [gameState, syncStatus]);

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
  }, [gameState, syncStatus]);

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

  return { paidAchievementsRef, skipPRRef, undoInfo, registerUndo, handleUndo, weekData, records, achStats, handleClaimChallenge };
}
