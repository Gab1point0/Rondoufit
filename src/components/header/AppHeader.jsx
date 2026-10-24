import { ArenaBanner } from './ArenaBanner';
import { HeaderActions } from './HeaderActions';
import { HeaderProfile } from './HeaderProfile';

export function AppHeader({
  arenaLevels, currentStreak, gameState, handleExportJSON, handleImportJSON, importInputRef,
  levelInfo, lifetimeStats, onOpenRewards, onOpenSync, onOpenTrial, onRetrySync,
  openCreateQuestModal, questFilter, selectedDate, setActiveTab, setConfirmResetOpen, setGameState,
  setQuestFilter, setQuickCardioDate, setQuickCardioModalOpen, streakBonusPct, syncStatus, triggerToast,
  trialRank,
}) {
  return (
    <header className="relative overflow-hidden border-b border-pink-500/20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <HeaderProfile
            currentStreak={currentStreak}
            gameState={gameState}
            levelInfo={levelInfo}
            lifetimeStats={lifetimeStats}
            onOpenRewards={onOpenRewards}
            onOpenSync={onOpenSync}
            onOpenTrial={onOpenTrial}
            onRetrySync={onRetrySync}
            setActiveTab={setActiveTab}
            streakBonusPct={streakBonusPct}
            syncStatus={syncStatus}
            trialRank={trialRank}
          />

          {/* Boutons d'Action Rapide */}
          <HeaderActions
            gameState={gameState}
            handleExportJSON={handleExportJSON}
            handleImportJSON={handleImportJSON}
            importInputRef={importInputRef}
            openCreateQuestModal={openCreateQuestModal}
            selectedDate={selectedDate}
            setActiveTab={setActiveTab}
            setConfirmResetOpen={setConfirmResetOpen}
            setGameState={setGameState}
            setQuickCardioDate={setQuickCardioDate}
            setQuickCardioModalOpen={setQuickCardioModalOpen}
            triggerToast={triggerToast}
          />
        </div>

        {/* BANDEAU DES 6 ARÈNES & NIVEAUX PAR GROUPE MUSCULAIRE */}
        <ArenaBanner arenaLevels={arenaLevels} questFilter={questFilter} setActiveTab={setActiveTab} setQuestFilter={setQuestFilter} />
      </div>
    </header>
  );
}
