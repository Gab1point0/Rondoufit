import { Footprints, Plus, RefreshCw, Scale, Volume2, VolumeX } from '../../icons';

export function HeaderActions({
  gameState, handleExportJSON, handleImportJSON, importInputRef, openCreateQuestModal, selectedDate,
  setActiveTab, setConfirmResetOpen, setGameState, setQuickCardioDate, setQuickCardioModalOpen,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={() => setActiveTab('weight')}
        className="bg-slate-900 hover:bg-slate-800/90 border border-pink-500/30 rounded-xl px-3 py-2 flex items-center gap-2.5 transition text-left"
      >
        <Scale className="w-4 h-4 text-pink-400 shrink-0" />
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Poids Actuel ➔ Cible
          </span>
          <span className="text-xs font-black text-white">
            {gameState.userWeightKg} kg{' '}
            <span className="text-pink-300 font-bold">
              ➔ {gameState.targetWeightKg} kg
            </span>
          </span>
        </div>
      </button>

      <button
        onClick={() => {
          setQuickCardioDate(selectedDate);
          setQuickCardioModalOpen(true);
        }}
        className="px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
      >
        <Footprints className="w-4 h-4" />
        <span>+ Course / Marche</span>
      </button>

      <button
        onClick={openCreateQuestModal}
        className="px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-600/25 flex items-center gap-2 transition"
      >
        <Plus className="w-4 h-4" />
        <span>+ Objectif / Exercice</span>
      </button>

      <button
        onClick={() =>
          setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        title="Activer / couper la Berceuse de Rondoudou"
        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
      >
        {gameState.soundEnabled ? (
          <Volume2 className="w-4 h-4 text-pink-400" />
        ) : (
          <VolumeX className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <button
        onClick={handleExportJSON}
        title="Exporter une sauvegarde (JSON)"
        className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
      >
        <span>💾</span>
        <span className="hidden sm:inline">Exporter</span>
      </button>
      <button
        onClick={() => importInputRef.current && importInputRef.current.click()}
        title="Importer une sauvegarde (JSON)"
        className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
      >
        <span>📥</span>
        <span className="hidden sm:inline">Importer</span>
      </button>
      <input ref={importInputRef} type="file" accept="application/json,.json" onChange={handleImportJSON} className="hidden" />

      <button
        onClick={() => setConfirmResetOpen(true)}
        title="Réinitialiser l'aventure à zéro"
        className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/60 text-slate-300 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Réinitialiser</span>
      </button>
    </div>
  );
}
