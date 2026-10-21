import { useMemo, useState } from 'react';
import { RPG_RANKS } from '../data/gamification';
import { evaluateTrial } from '../data/trials';
import { getTodayISODate } from '../lib/dates';
import { playGameSound } from '../lib/sound';

/** Épreuve du prochain rang à passer (voir data/trials.js) : fenêtre, avancement et validation. */
export function useRankTrial({ gameState, setGameState, triggerToast }) {
  const [trialOpen, setTrialOpen] = useState(false);
  const passed = gameState.rankTrials || [];
  const trialRank = RPG_RANKS.find(r => r.minLevel > 1 && !passed.includes(r.minLevel)) || null;
  const today = getTodayISODate();
  const trialEval = useMemo(
    () => (trialRank ? evaluateTrial(trialRank.minLevel, gameState, today) : null),
    [gameState.quests, trialRank && trialRank.minLevel, today]
  );

  const validateTrial = () => {
    if (!trialRank || !trialEval || !trialEval.done) return;
    setGameState(prev => ({ ...prev, rankTrials: [...(prev.rankTrials || []), trialRank.minLevel] }));
    setTrialOpen(false);
    playGameSound('boss', gameState.soundEnabled);
    triggerToast('Épreuve de rang réussie !', `Le rang « ${trialRank.title} » t’est ouvert.`, 0, '⚔️');
  };

  return { trialOpen, setTrialOpen, trialRank, trialEval, validateTrial };
}
