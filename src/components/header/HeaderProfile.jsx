import { Flame } from '../../icons';
import { RANK_FRAMES, activeCosmetics } from '../../data/rewards';
import { RPG_RANKS } from '../../data/gamification';
import { JigglypuffAvatar } from '../JigglypuffAvatar';
import { NeutralAvatar } from '../NeutralAvatar';
import { NEUTRAL, pick } from '../../edition';

const chip = 'px-2 py-0.5 rounded-full text-[0.75rem] sm:text-xs font-bold border flex items-center gap-1';

export function HeaderProfile({
  currentStreak, gameState, levelInfo, lifetimeStats, onOpenMore, onOpenRewards, onOpenSync, onOpenTrial,
  onRetrySync, setActiveTab, streakBonusPct, syncStatus, trialRank,
}) {
  const { theme, accessory, title } = activeCosmetics(gameState.cosmetics, levelInfo.level);
  const hero = /^Dresseur/i.test(gameState.heroName || '') ? '' : gameState.heroName || ''; // le nom par défaut de l'édition Rondoudou n'est pas un prénom
  const rankIndex = Math.max(0, RPG_RANKS.findIndex(r => r.title === levelInfo.rank.title));
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('weight')}
          title="Voir le suivi du poids"
          className={`cursor-pointer relative w-[76px] h-[76px] sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${theme.ring} ${RANK_FRAMES[rankIndex]} shrink-0 group transition-transform hover:scale-105`}
        >
          <div className="w-full h-full bg-slate-950/95 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
            {NEUTRAL ? <NeutralAvatar name={hero} size={64} /> : <JigglypuffAvatar currentWeightKg={gameState.userWeightKg} targetWeightKg={gameState.targetWeightKg} size={64} />}
            <span className="absolute bottom-0.5 px-2 py-0.2 rounded-full bg-slate-900/90 border border-pink-400/50 text-[9px] font-black uppercase tracking-widest text-pink-300">
              Niv. {levelInfo.level}
            </span>
          </div>
          {accessory.id !== 'none' && (
            <span className={`absolute pointer-events-none ${accessory.pos}`}>{accessory.icon}</span>
          )}
          <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-900 border border-pink-400/60 flex items-center justify-center text-sm">
            {levelInfo.rank.badge}
          </span>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[0.75rem] sm:text-xs font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  {levelInfo.rank.badge} {levelInfo.rank.title}
                </span>
                {title.id && (
                  <span className="px-2 py-0.5 rounded-full text-[0.75rem] sm:text-xs font-bold bg-violet-500/20 text-violet-200 border border-violet-400/40">{title.label}</span>
                )}
              </div>
              <h1 className="mt-1 text-base sm:text-2xl font-black tracking-tight leading-tight bg-gradient-to-r from-pink-300 via-rose-200 to-amber-200 bg-clip-text text-transparent">
                {pick('From Grosdoudou to Rondoudou', hero ? `Salut ${hero}` : 'Ma musculation')}
              </h1>
            </div>
            <button
              type="button"
              onClick={onOpenMore}
              title="Réglages et données"
              aria-label="Réglages et données"
              className="shrink-0 w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-lg text-slate-200 hover:text-white"
            >
              ⚙️
            </button>
          </div>

          <div className="w-full max-w-md">
            <div className="flex justify-between text-[0.75rem] sm:text-xs font-semibold text-slate-400 mb-1">
              <span>Jauge EXP ({gameState.xp} EXP)</span>
              <span className="text-pink-300">{levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} EXP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div className={`h-full rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-500`} style={{ width: `${levelInfo.progressPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {levelInfo.locked ? (
        <p className="text-[0.75rem] text-amber-300">
          🔒 Niveau bloqué : réussis l’épreuve pour devenir {levelInfo.locked.badge} {levelInfo.locked.title}. Ton EXP en réserve : {levelInfo.reserve}.
        </p>
      ) : (
        levelInfo.nextRank && (
          <p className="hidden sm:block text-[0.75rem] text-slate-500">
            Prochain rang : {levelInfo.nextRank.badge} {levelInfo.nextRank.title} (niv. {levelInfo.nextRank.minLevel}, encore {levelInfo.xpToNextRank} EXP)
          </p>
        )
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`${chip} bg-amber-500/15 text-amber-300 border-amber-500/30`}>
          <Flame className="w-3.5 h-3.5 text-amber-400" /> Série : {currentStreak} j
        </span>
        <span className={`${chip} bg-rose-500/15 text-rose-300 border-rose-500/30`}>🔥 {lifetimeStats.totalKcal} kcal brûlées</span>
        {streakBonusPct > 0 && (
          <span title="Chaque semaine d’affilée avec une séance : +10 % d’EXP sur tes séances (maximum +50 %)" className={`${chip} bg-lime-500/15 text-lime-300 border-lime-500/30`}>
            📈 Bonus régularité +{streakBonusPct} %
          </span>
        )}
        <button type="button" onClick={() => setActiveTab('weight')} title="Voir le suivi du poids" className={`${chip} bg-slate-800 text-slate-200 border-slate-600`}>
          ⚖️ {gameState.userWeightKg} kg ➔ {gameState.targetWeightKg} kg
        </button>
        <button
          type="button"
          onClick={onOpenSync}
          title="Mon compte et ma sauvegarde"
          className={`${chip} ${
            syncStatus === 'synced'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : syncStatus === 'saving' || syncStatus === 'loading'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
              : syncStatus === 'off'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          {syncStatus === 'synced' ? (
            <><span className="sm:hidden">☁️ Sauvegardé</span><span className="hidden sm:inline">{'☁️ Sauvegardé en ligne'}</span></>
          ) : syncStatus === 'saving' ? (
            '⏳ Synchronisation…'
          ) : syncStatus === 'loading' ? (
            '☁️ Chargement…'
          ) : syncStatus === 'off' ? (
            <><span className="sm:hidden">⚠️ Pas de sauvegarde</span><span className="hidden sm:inline">⚠️ Pas de sauvegarde en ligne : connecte-toi (données sur cet appareil seulement)</span></>
          ) : (
            <><span className="sm:hidden">⚠️ Sauvegarde injoignable</span><span className="hidden sm:inline">⚠️ Sauvegarde injoignable : données gardées sur cet appareil</span></>
          )}
        </button>
        {syncStatus === 'error' && (
          <button onClick={onRetrySync} className={`${chip} bg-slate-800 text-white border-slate-600`}>🔄 Réessayer</button>
        )}
        <button type="button" onClick={onOpenRewards} className={`${chip} bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600`}>
          🎁 Récompenses
        </button>
        {trialRank && (
          <button
            type="button"
            onClick={onOpenTrial}
            className={`${chip} ${levelInfo.locked ? 'bg-amber-500/20 text-amber-200 border-amber-400/60 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'}`}
          >
            {levelInfo.locked ? '🔒' : '⚔️'} Épreuve de rang
          </button>
        )}
      </div>
    </div>
  );
}
