import { ARENA_GROUPS } from '../data/arenas';
import { openMovement } from '../lib/movement';
import { Crown, Play, Plus, Shield, Sliders, Trash2, TrendingUp } from '../icons';
import { cardioHasElevation, formatPaceAndSpeed } from '../lib/calories';
import { evaluateQuestProgress } from '../lib/progress';
import { formatSetsBreakdown, getSetDetailsArray, isTimedQuest, repUnit } from '../lib/quests';
import { cleanText, pick } from '../edition';
import { arenaLabel } from '../data/muscles';

export function QuestsTab({
  arenaLevels = [], filteredQuests, gameState, handleDeleteQuest, openCreateQuestModal, openEditQuestModal,
  openLevelUpModal, openLogModal, questFilter, setActiveTab, setQuestFilter,
  setSelectedChartQuestId,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setQuestFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            questFilter === 'all'
              ? 'bg-pink-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          {pick('Toutes les Arènes', 'Tous les groupes')} ({gameState.quests.length})
        </button>
        {ARENA_GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => setQuestFilter(g.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              questFilter === g.id
                ? 'bg-pink-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{g.icon}</span>
            <span>{g.label}</span>
            <span className={`px-1.5 rounded-full text-[0.7rem] font-black ${questFilter === g.id ? 'bg-white/20' : 'bg-slate-800 text-pink-300'}`}>Niv. {(arenaLevels.find(a => a.id === g.id) || {}).groupLevel || 1}</span>
          </button>
        ))}
      </div>

      {gameState.quests.length === 0 ? (
        <div className="bg-slate-900/70 border border-pink-500/30 rounded-2xl p-8 text-center space-y-3">
          <p className="text-4xl">👋</p>
          <p className="text-lg font-black text-white">Bienvenue !</p>
          <p className="text-sm text-slate-300">Ajoute ton premier exercice : le coach te proposera ensuite tes séances, avec les charges et les répétitions.</p>
          <button
            onClick={openCreateQuestModal}
            className="px-4 py-2.5 rounded-xl text-sm font-black bg-pink-600 hover:bg-pink-500 text-white inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter mon premier exercice
          </button>
          <p className="text-[0.75rem] text-slate-500">Astuce : le bouton « + » en bas à droite permet aussi de dicter une séance ou d’ajouter une course.</p>
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-bold text-slate-300">
            Aucun exercice actif dans cette catégorie.
          </p>
          <button
            onClick={openCreateQuestModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter un Exercice / Objectif
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredQuests.map(quest => {
            const evalState = evaluateQuestProgress(quest);
            const lastEntry =
              quest.history && quest.history.length > 0
                ? quest.history[quest.history.length - 1]
                : null;
            const goalMode = quest.goalMode || 'sets_reps';
            const goalSets = Math.max(1, Number(quest.goalSets) || 3);
            const goalReps = Math.max(
              1,
              Number(quest.goalReps) || Number(quest.goalValue) || 6
            );
            const currentSetsArray =
              quest.type === 'strength'
                ? getSetDetailsArray(quest, goalSets, goalReps)
                : [];
            const questLevel = Number(quest.level) || 1;

            return (
              <div
                key={quest.id}
                className={`rounded-2xl border transition-all p-5 flex flex-col justify-between relative overflow-hidden ${
                  evalState.isBossDefeated
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border-amber-400/70 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                        {quest.icon}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[0.7rem] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/40">
                            Niv. {questLevel} • {arenaLabel(quest)}
                          </span>

                          {quest.type === 'strength' && (
                            <span className="text-[0.7rem] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              {goalMode === 'weight_only'
                                ? `🏋️ Objectif Poids : ${quest.goalValue} kg`
                                : goalMode === 'reps_only'
                                ? `${isTimedQuest(quest) ? '⏱ Objectif Durée' : '🔁 Objectif Reps'} : ${goalReps} ${repUnit(quest)}`
                                : goalMode === 'free_mode'
                                ? `🕊️ Entraînement Libre`
                                : `🛡️ Objectif : ${goalSets} × ${goalReps} ${repUnit(quest)}`}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-extrabold text-white mt-1">
                          {quest.name}
                        </h3>
                        {quest.type === 'strength' && (
                          <button type="button" onClick={() => openMovement(quest)} title="Voir le mouvement (animation)" aria-label="Voir le mouvement" className="mt-1 px-2.5 py-1 rounded-lg bg-sky-900/50 hover:bg-sky-800/60 border border-sky-500/40 text-[0.75rem] font-bold text-sky-200">🎬 Mouvement</button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditQuestModal(quest)}
                        title="Ajuster l'objectif"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-slate-700/70 transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Ajuster</span>
                      </button>
                      <button
                        onClick={() => handleDeleteQuest(quest.id)}
                        title="Supprimer cet exercice"
                        className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {quest.type === 'strength' ? (
                    <div className="mt-4 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-pink-400" />
                          {goalMode === 'weight_only' ? (
                            <span>
                              Charge actuelle :{' '}
                              <strong className="text-white">{quest.currentValue} kg</strong> /{' '}
                              <strong className="text-amber-300">{quest.goalValue} kg</strong>
                            </span>
                          ) : goalMode === 'reps_only' ? (
                            <span>
                              Record :{' '}
                              <strong className="text-white">
                                {Math.max(...currentSetsArray, Number(quest.currentValue) || 0)} {repUnit(quest)}
                              </strong>{' '}
                              / Cible <strong className="text-amber-300">{goalReps} {repUnit(quest)}</strong>
                            </span>
                          ) : (
                            <span>
                              {pick('Poké-Séries validées', 'Séries validées')} :{' '}
                              <strong className="text-white">
                                {Math.min(evalState.validatedSets, goalSets)} / {goalSets} séries de {goalReps} {repUnit(quest)}
                              </strong>
                            </span>
                          )}
                        </div>

                        {isTimedQuest(quest) ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[0.75rem] font-extrabold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            ⏱ Chronométré • Cible {quest.goalValue || goalReps} s
                          </span>
                        ) : quest.unit === 'reps' ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[0.75rem] font-extrabold border ${
                              (Number(quest.currentAssistanceKg) || 0) > 0
                                ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {(Number(quest.currentAssistanceKg) || 0) > 0
                              ? `🪢 Aide : -${quest.currentAssistanceKg} kg (Cible : ${
                                  Number(quest.goalAssistanceKg) > 0
                                    ? `-${quest.goalAssistanceKg} kg`
                                    : 'Strict 0 kg'
                                })`
                              : '🦅 Strict • 0 kg d’aide'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[0.75rem] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            🏋️ {quest.currentValue} kg / Cible {quest.goalValue} kg
                          </span>
                        )}
                      </div>

                      {goalMode === 'sets_reps' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Array.from({
                            length: Math.max(goalSets, currentSetsArray.length)
                          }).map((_, idx) => {
                            const repDone = Number(currentSetsArray[idx]) || 0;
                            const isValidated = repDone >= goalReps;
                            return (
                              <div
                                key={idx}
                                className={`px-2.5 py-2 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                                  isValidated
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                              >
                                <span className="text-[0.75rem] uppercase tracking-wider">
                                  Série {idx + 1}
                                </span>
                                <span className="flex items-center gap-1 font-black">
                                  {repDone}/{goalReps}
                                  {isValidated ? (
                                    <span title={pick('Pokéball validée', 'Série validée')}>{pick('🔴', '✅')}</span>
                                  ) : (
                                    <span className="text-[0.7rem] text-amber-400">⚪</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                        <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800/80">
                          <span className="text-[0.7rem] uppercase text-slate-400 block">
                            Départ (Niv.{questLevel})
                          </span>
                          <span className="font-bold text-slate-200">
                            {quest.unit === 'kg'
                              ? `${quest.startValue} kg`
                              : `${quest.startValue} ${repUnit(quest)}`}
                          </span>
                          {quest.unit === 'reps' && !isTimedQuest(quest) && (
                            <span className="block text-[0.7rem] text-violet-300">
                              {Number(quest.startAssistanceKg) > 0
                                ? `Aide ${quest.startAssistanceKg}kg`
                                : 'Strict 0kg'}
                            </span>
                          )}
                        </div>

                        <div className="bg-pink-950/30 rounded-lg p-2 border border-pink-500/30">
                          <span className="text-[0.7rem] uppercase text-pink-300 block">
                            Actuel
                          </span>
                          <span className="font-extrabold text-white">
                            {goalMode === 'weight_only'
                              ? `${quest.currentValue} kg`
                              : `${formatSetsBreakdown(currentSetsArray)} ${repUnit(quest)}`}
                          </span>
                          <span className="block text-[0.7rem] text-pink-300">
                            {quest.unit === 'kg'
                              ? `Barre à ${quest.currentValue} kg`
                              : isTimedQuest(quest) ? 'Chronométré'
                              : Number(quest.currentAssistanceKg) > 0
                              ? `Aide ${quest.currentAssistanceKg}kg`
                              : 'Strict 0kg'}
                          </span>
                        </div>

                        <div className="bg-amber-950/30 rounded-lg p-2 border border-amber-500/30">
                          <span className="text-[0.7rem] uppercase text-amber-300 block">
                            Objectif Niv.{questLevel + 1}
                          </span>
                          <span className="font-extrabold text-amber-300">
                            {goalMode === 'weight_only'
                              ? `${quest.goalValue} kg`
                              : goalMode === 'reps_only'
                              ? `${goalReps} ${repUnit(quest)}`
                              : `${goalSets} × ${goalReps} ${repUnit(quest)}`}
                          </span>
                          <span className="block text-[0.7rem] text-amber-200/80">
                            {quest.unit === 'kg'
                              ? `à ${quest.goalValue} kg`
                              : isTimedQuest(quest) ? 'par série'
                              : Number(quest.goalAssistanceKg) > 0
                              ? `Aide ${quest.goalAssistanceKg}kg`
                              : 'Strict 0kg'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-900 rounded-lg p-2 border border-slate-800">
                          <span className="text-[0.7rem] uppercase text-slate-400 block">
                            Départ (Niv.{questLevel})
                          </span>
                          <span className="font-bold text-slate-200">
                            {quest.startValue} {quest.unit}
                          </span>
                        </div>
                        <div className="bg-emerald-950/40 rounded-lg p-2 border border-emerald-500/30">
                          <span className="text-[0.7rem] uppercase text-emerald-300 block">
                            Record Actuel
                          </span>
                          <span className="font-extrabold text-white">
                            {quest.currentValue} {quest.unit}
                          </span>
                        </div>
                       <div className="bg-amber-950/30 rounded-lg p-2 border border-amber-500/30">
                          <span className="text-[0.7rem] uppercase text-amber-300 block">
                            {goalMode === 'free_mode' ? 'Objectif' : `Objectif Niv.${questLevel + 1}`}
                          </span>
                          <span className="font-extrabold text-amber-300">
                            {goalMode === 'free_mode' ? '🕊️ Libre' : `${quest.goalValue} ${quest.unit}`}
                          </span>
                        </div>
                      </div>
                      {quest.unit === 'km' && quest.durationMin && (
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 px-1 pt-1">
                          <span>
                            ⏱️ Allure :{' '}
                            <strong className="text-emerald-300">
                              {formatPaceAndSpeed(quest.currentValue, quest.durationMin).pace}
                            </strong>{' '}
                            ({formatPaceAndSpeed(quest.currentValue, quest.durationMin).speed})
                          </span>
                          {cardioHasElevation(quest.cardioMode) && <span>⛰️ D+ : {quest.elevationM || 0} m</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span className="text-slate-400">
                        Progression vers le Niveau {questLevel + 1}
                      </span>
                      <span
                        className={
                          evalState.isBossDefeated ? 'text-amber-300' : 'text-pink-300'
                        }
                      >
                        {evalState.percent}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          evalState.isBossDefeated
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : quest.type === 'cardio'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-pink-500 to-purple-500'
                        }`}
                        style={{ width: `${evalState.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => openLevelUpModal(quest)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                        evalState.isBossDefeated
                          ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow-lg shadow-amber-500/20 animate-pulse'
                          : 'bg-slate-800/70 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <Crown className="w-4 h-4" />
                      <span>
                        {evalState.isBossDefeated
                          ? `🎵 Objectif Atteint ! Passer au Niv. ${questLevel + 1} & Fixer le suivant`
                          : `Valider cet objectif & Passer au Niv. ${questLevel + 1}`}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-400 truncate">
                    {lastEntry ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 font-bold border border-orange-500/30">
                          🔥 {lastEntry.calories || 45} kcal
                        </span>
                        <span className="truncate">{cleanText(lastEntry.note)}</span>
                      </span>
                    ) : (
                      <span>Aucune séance notée</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedChartQuestId(quest.id);
                        setActiveTab('charts');
                      }}
                      title="Voir la courbe de progression"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openLogModal(quest)}
                      className="px-3.5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/20 flex items-center gap-1.5 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Noter Séance</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
