import { Flame } from '../../icons';
import { JigglypuffAvatar } from '../JigglypuffAvatar';

export function HeaderProfile({ cloudStatus, currentStreak, gameState, levelInfo, lifetimeStats, loadCloud, setActiveTab }) {
  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => setActiveTab('weight')}
        title="Voir le suivi du poids"
        className="cursor-pointer relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-pink-400 via-rose-500 to-indigo-600 p-0.5 shadow-lg shadow-pink-500/20 shrink-0 group transition-transform hover:scale-105"
      >
        <div className="w-full h-full bg-slate-950/95 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
          <JigglypuffAvatar
            currentWeightKg={gameState.userWeightKg}
            targetWeightKg={gameState.targetWeightKg}
            size={72}
          />
          <span className="absolute bottom-1 px-2 py-0.2 rounded-full bg-slate-900/90 border border-pink-400/50 text-[9px] font-black uppercase tracking-widest text-pink-300">
            Niv. {levelInfo.level}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
            {levelInfo.rank.badge} {levelInfo.rank.title}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Série : {currentStreak} j
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            🔥 {lifetimeStats.totalKcal} kcal brûlées
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              cloudStatus === 'synced'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : cloudStatus === 'saving' || cloudStatus === 'loading'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            {cloudStatus === 'synced'
              ? '☁️ Sauvegardé sur Google Sheets'
              : cloudStatus === 'saving'
              ? '⏳ Synchronisation Cloud...'
              : cloudStatus === 'loading'
              ? '☁️ Chargement Cloud...'
              : '⚠️ Cloud injoignable : données gardées sur cet appareil'}
          </span>
          {cloudStatus === 'error' && (
            <button onClick={() => loadCloud(false)} className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-white border border-slate-600">🔄 Réessayer</button>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-pink-300 via-rose-200 to-amber-200 bg-clip-text text-transparent">
          From Grosdoudou to Rondoudou
        </h1>

        <div className="w-full max-w-md">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Jauge EXP ({gameState.xp} EXP)</span>
            <span className="text-pink-300">
              {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} EXP
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 transition-all duration-500"
              style={{ width: `${levelInfo.progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
