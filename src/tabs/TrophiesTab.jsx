import { ACHIEVEMENTS_LIST } from '../data/gamification';
import { CheckCircle2 } from '../icons';
import { ACH_PROGRESS } from '../lib/stats';

export function TrophiesTab({ achStats, gameState }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS_LIST.map(ach => {
          const unlocked = gameState.unlockedAchievements.includes(ach.id);
          return (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border flex items-start gap-3.5 transition ${
                unlocked
                  ? 'bg-gradient-to-br from-slate-900 to-pink-950/40 border-amber-500/50 shadow-lg'
                  : 'bg-slate-900/40 border-slate-800/70 opacity-60'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                {ach.secret && !unlocked ? '❔' : ach.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-white text-sm">{ach.secret && !unlocked ? 'Trophée secret' : ach.title}</h4>
                  {unlocked && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {ach.secret && !unlocked ? 'Continuez à vous entraîner pour le découvrir…' : ach.desc}
                </p>
                {!unlocked && ACH_PROGRESS[ach.id] && !ach.secret && (() => {
                  const pr = ACH_PROGRESS[ach.id];
                  const cur = Math.min(pr.max, Number(achStats[pr.key]) || 0);
                  return (
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500" style={{ width: `${(cur / pr.max) * 100}%` }} />
                      </div>
                      <span className="text-[0.7rem] text-slate-400">{Math.round(cur * 10) / 10} / {pr.max}</span>
                    </div>
                  );
                })()}
                <span className="inline-block mt-2 text-[0.75rem] font-bold text-pink-300">
                  Bonus : +{ach.xpBonus} EXP
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
