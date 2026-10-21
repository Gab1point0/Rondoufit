import { useMemo, useState } from 'react';
import { CoachPanel } from './components/coach/CoachPanel';
import { GuidedSession } from './components/GuidedSession';
import { PhotoCalendar } from './components/photos/PhotoCalendar';
import { PhotoReminder } from './components/photos/PhotoReminder';
import { RestTimer } from './components/RestTimer';
import { SessionRecap } from './components/SessionRecap';
import { VoiceWorkoutAssistant } from './components/VoiceWorkoutAssistant';
import { normalizeArenaGroup } from './data/arenas';
import { getTodayISODate } from './lib/dates';
import { playGameSound } from './lib/sound';
import { BilanTab } from './tabs/BilanTab';
import { ChartsTab } from './tabs/ChartsTab';
import { DailySummary } from './components/DailySummary';
import { JournalTab } from './tabs/JournalTab';
import { LevelUpModal } from './modals/LevelUpModal';
import { LogSessionModal } from './modals/LogSessionModal';
import { QuestFormModal } from './modals/QuestFormModal';
import { QuestsTab } from './tabs/QuestsTab';
import { QuickCardioModal } from './modals/QuickCardioModal';
import { ResetModal } from './modals/ResetModal';
import { SyncModal } from './modals/SyncModal';
import { TabBar } from './components/TabBar';
import { ToastBanner } from './components/ToastBanner';
import { TrophiesTab } from './tabs/TrophiesTab';
import { UndoBar } from './components/UndoBar';
import { WeightTab } from './tabs/WeightTab';
import { AppHeader } from './components/header/AppHeader';
import { useDataTransfer } from './hooks/useDataTransfer';
import { useDerivedStats } from './hooks/useDerivedStats';
import { useGameState } from './hooks/useGameState';
import { useGuidedSession } from './hooks/useGuidedSession';
import { useLevelUp } from './hooks/useLevelUp';
import { useLogSession } from './hooks/useLogSession';
import { useQuestActions } from './hooks/useQuestActions';
import { useQuestForm } from './hooks/useQuestForm';
import { useQuickCardio } from './hooks/useQuickCardio';
import { useRewards } from './hooks/useRewards';
import { useToast } from './hooks/useToast';
import { useWeightLog } from './hooks/useWeightLog';

export function App() {
  const { gameState, setGameState, setGameStateAuto, sync, isLoaded } = useGameState();
  const [syncOpen, setSyncOpen] = useState(false);
  // Navigation et filtres
  const [activeTab, setActiveTab] = useState('quests');
  const [questFilter, setQuestFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(getTodayISODate());
  const [selectedJournalDay, setSelectedJournalDay] = useState(getTodayISODate());
  const [selectedChartQuestId, setSelectedChartQuestId] = useState(
    () => gameState.quests[0]?.id || ''
  );

  const { toast, triggerToast, dismissToast } = useToast();

  const {
    paidAchievementsRef, skipPRRef, undoInfo, registerUndo, handleUndo, weekData, records, achStats,
    handleClaimChallenge,
  } = useRewards({
    syncStatus: sync.status, gameState, isLoaded, setGameState, setGameStateAuto, triggerToast,
  });

  const {
    levelUpModalQuest, setLevelUpModalQuest, nextGoalMode, setNextGoalMode, nextGoalValue,
    setNextGoalValue, nextGoalSets, setNextGoalSets, nextGoalReps, setNextGoalReps,
    nextGoalAssistanceKg, setNextGoalAssistanceKg, openLevelUpModal, handleConfirmLevelUp,
  } = useLevelUp({
    gameState, setGameState, triggerToast,
  });

  const {
    questModalOpen, setQuestModalOpen, editingQuestId, formCatalogId, formCustomName,
    setFormCustomName, formCategory, setFormCategory, formType, formUnit, setFormUnit, formTimed,
    setFormTimed, formGoalMode, setFormGoalMode, formStartValue, setFormStartValue,
    setFormCurrentValue, formGoalValue, setFormGoalValue, formGoalSets, setFormGoalSets,
    formGoalReps, setFormGoalReps, formStartAssistanceKg, setFormStartAssistanceKg,
    formGoalAssistanceKg, setFormGoalAssistanceKg, openCreateQuestModal, openEditQuestModal,
    handleSelectCatalogExercise, handleSaveQuestForm,
  } = useQuestForm({
    gameState, setGameState, setSelectedChartQuestId, triggerToast,
  });

  const {
    quickCardioModalOpen, setQuickCardioModalOpen, quickCardioCatalogId, setQuickCardioCatalogId,
    quickCardioDistanceKm, setQuickCardioDistanceKm, quickCardioDurationMin,
    setQuickCardioDurationMin, quickCardioElevationM, setQuickCardioElevationM, quickCardioRpe,
    setQuickCardioRpe, quickCardioDate, setQuickCardioDate, quickCardioNote, setQuickCardioNote,
    liveQuickCardioCalories, handleSaveQuickCardio,
  } = useQuickCardio({
    gameState, setGameState, setSelectedDate, setSelectedJournalDay, triggerToast,
  });

  const {
    newWeightInput, setNewWeightInput, newWeightDate, setNewWeightDate, newWeightNote,
    setNewWeightNote, handleAddWeightEntry, handleDeleteWeightEntry,
  } = useWeightLog({
    gameState, registerUndo, setGameState, triggerToast,
  });

  const {
    confirmResetOpen, setConfirmResetOpen, importInputRef, handleExportJSON, handleImportJSON,
    handleResetAll,
  } = useDataTransfer({
    gameState, paidAchievementsRef, setGameState, skipPRRef, triggerToast,
  });

  const {
    levelInfo, currentStreak, arenaLevels, dailySummary, dailyJournalList, lifetimeStats,
  } = useDerivedStats({
    gameState, selectedDate,
  });
  const {
    logModalQuest, setLogModalQuest, logDate, setLogDate, logValue, setLogValue, logUseAssistance,
    setLogUseAssistance, logAssistanceKg, setLogAssistanceKg, logEntryMode, setLogEntryMode,
    logUniformSets, logUniformReps, logSetDetails, logDurationMin, setLogDurationMin, logElevationM,
    setLogElevationM, logNote, setLogNote, liveModalCalories, openLogModal,
    handleUpdateSingleSetRep, handleAddSetSlot, handleRemoveSetSlot, handleApplyUniformToSets,
    handleSaveSession,
  } = useLogSession({
    gameState, openLevelUpModal, selectedDate, setGameState, setSelectedDate, setSelectedJournalDay,
    triggerToast,
  });

  const {
    guided, setGuided, guidedOpen, setGuidedOpen, startGuided, handleFinishGuided, recap, setRecap,
  } = useGuidedSession({
    gameState, openLevelUpModal, setGameState, setSelectedDate, setSelectedJournalDay, triggerToast,
  });

  const {
    handleClaimWeekly, addQuestFromCatalog, handleDeleteSessionEntry, handleDeleteQuest,
  } = useQuestActions({
    gameState, registerUndo, setGameState, triggerToast,
  });
  const filteredQuests = useMemo(() => {
    if (questFilter === 'all') return gameState.quests;
    return gameState.quests.filter(
      q => normalizeArenaGroup(q.category, q.type) === questFilter
    );
  }, [gameState.quests, questFilter]);

  const activeChartQuest = useMemo(() => {
    return (
      gameState.quests.find(q => q.id === selectedChartQuestId) ||
      gameState.quests[0] ||
      null
    );
  }, [gameState.quests, selectedChartQuestId]);

  const activeJournalDayObj = useMemo(() => {
    return (
      dailyJournalList.find(d => d.date === selectedJournalDay) ||
      dailyJournalList[0] ||
      null
    );
  }, [dailyJournalList, selectedJournalDay]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-white pb-16">
      {/* TOAST NOTIFICATION POKÉMON RONDOUDOU */}
      {toast && (
        <ToastBanner dismissToast={dismissToast} toast={toast} />
      )}

      {undoInfo && (
        <UndoBar handleUndo={handleUndo} undoInfo={undoInfo} />
      )}

      {/* EN-TÊTE : AVATAR RONDOUDOU NATUREL EN HAUT À GAUCHE */}
      <AppHeader
        arenaLevels={arenaLevels}
        currentStreak={currentStreak}
        gameState={gameState}
        handleExportJSON={handleExportJSON}
        handleImportJSON={handleImportJSON}
        importInputRef={importInputRef}
        levelInfo={levelInfo}
        lifetimeStats={lifetimeStats}
        onOpenSync={() => setSyncOpen(true)}
        onRetrySync={sync.syncNow}
        syncStatus={sync.status}
        openCreateQuestModal={openCreateQuestModal}
        questFilter={questFilter}
        selectedDate={selectedDate}
        setActiveTab={setActiveTab}
        setConfirmResetOpen={setConfirmResetOpen}
        setGameState={setGameState}
        setQuestFilter={setQuestFilter}
        setQuickCardioDate={setQuickCardioDate}
        setQuickCardioModalOpen={setQuickCardioModalOpen}
      />

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
<VoiceWorkoutAssistant
  gameState={gameState}
  setGameState={setGameState}
  selectedDate={selectedDate}
  triggerToast={triggerToast}
  playGameSound={playGameSound}
/>
{recap && <SessionRecap recap={recap} onClose={() => setRecap(null)} />}
{guided && guidedOpen && (
<GuidedSession
g={guided}
setG={setGuided}
onFinish={handleFinishGuided}
onMinimize={() => setGuidedOpen(false)}
onCancel={() => { setGuided(null); setGuidedOpen(false); }}
/>
)}
<RestTimer soundEnabled={gameState.soundEnabled} />
        {/* BANNIÈRE BILAN ÉNERGÉTIQUE & SÉANCE DU JOUR (AVEC SUPPRESSION D'UNE SÉANCE) */}
        <DailySummary dailySummary={dailySummary} handleDeleteSessionEntry={handleDeleteSessionEntry} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

        {/* BARRE D'ONGLETS PRINCIPALE */}
        <TabBar activeTab={activeTab} dailyJournalList={dailyJournalList} gameState={gameState} setActiveTab={setActiveTab} />

        {activeTab === 'coach' && (
          <CoachPanel
            gameState={gameState}
            setGameState={setGameState}
            onStartGuided={startGuided}
            onOpenLevelUp={openLevelUpModal}
            onAddExercise={addQuestFromCatalog}
            onQuickCardio={() => { setQuickCardioDate(getTodayISODate()); setQuickCardioModalOpen(true); }}
            onGoTab={setActiveTab}
            guidedActive={!!guided}
            onResumeGuided={() => setGuidedOpen(true)}
            onClaimWeekly={handleClaimWeekly}
          />
        )}

        {/* ONGLET 1 : CARTES DES QUÊTES & OBJECTIFS */}
        {activeTab === 'quests' && (
          <QuestsTab
            filteredQuests={filteredQuests}
            gameState={gameState}
            handleDeleteQuest={handleDeleteQuest}
            openCreateQuestModal={openCreateQuestModal}
            openEditQuestModal={openEditQuestModal}
            openLevelUpModal={openLevelUpModal}
            openLogModal={openLogModal}
            questFilter={questFilter}
            setActiveTab={setActiveTab}
            setQuestFilter={setQuestFilter}
            setSelectedChartQuestId={setSelectedChartQuestId}
          />
        )}

        {/* ONGLET 2 : 📅 JOURNAL DES SÉANCES */}
        {activeTab === 'journal' && (
          <JournalTab activeJournalDayObj={activeJournalDayObj} dailyJournalList={dailyJournalList} handleDeleteSessionEntry={handleDeleteSessionEntry} setSelectedJournalDay={setSelectedJournalDay} />
        )}

        {/* ONGLET 3 : COURBES DE PROGRESSION */}
        {activeTab === 'charts' && (
          <ChartsTab activeChartQuest={activeChartQuest} gameState={gameState} openLogModal={openLogModal} setSelectedChartQuestId={setSelectedChartQuestId} />
        )}

        {/* ONGLET 4 : ⚖️ SUIVI DU POIDS */}
        {activeTab === 'weight' && (
          <WeightTab
            gameState={gameState}
            handleAddWeightEntry={handleAddWeightEntry}
            handleDeleteWeightEntry={handleDeleteWeightEntry}
            newWeightDate={newWeightDate}
            newWeightInput={newWeightInput}
            newWeightNote={newWeightNote}
            setGameState={setGameState}
            setNewWeightDate={setNewWeightDate}
            setNewWeightInput={setNewWeightInput}
            setNewWeightNote={setNewWeightNote}
          />
        )}

        {/* ONGLET : BILAN (défis, semaine, records) */}
        {activeTab !== 'photos' && <PhotoReminder gameState={gameState} onGo={() => setActiveTab('photos')} />}
        {activeTab === 'photos' && <PhotoCalendar gameState={gameState} />}

        {activeTab === 'bilan' && (
          <BilanTab gameState={gameState} handleClaimChallenge={handleClaimChallenge} records={records} weekData={weekData} />
        )}

        {/* ONGLET 5 : TROPHÉES */}
        {activeTab === 'trophies' && (
          <TrophiesTab achStats={achStats} gameState={gameState} />
        )}
      </main>

      {/* MODALE 1 : NOTER UNE SÉANCE */}
      {logModalQuest && (
        <LogSessionModal
          handleAddSetSlot={handleAddSetSlot}
          handleApplyUniformToSets={handleApplyUniformToSets}
          handleRemoveSetSlot={handleRemoveSetSlot}
          handleSaveSession={handleSaveSession}
          handleUpdateSingleSetRep={handleUpdateSingleSetRep}
          liveModalCalories={liveModalCalories}
          logAssistanceKg={logAssistanceKg}
          logDate={logDate}
          logDurationMin={logDurationMin}
          logElevationM={logElevationM}
          logEntryMode={logEntryMode}
          logModalQuest={logModalQuest}
          logNote={logNote}
          logSetDetails={logSetDetails}
          logUniformReps={logUniformReps}
          logUniformSets={logUniformSets}
          logUseAssistance={logUseAssistance}
          logValue={logValue}
          setLogAssistanceKg={setLogAssistanceKg}
          setLogDate={setLogDate}
          setLogDurationMin={setLogDurationMin}
          setLogElevationM={setLogElevationM}
          setLogEntryMode={setLogEntryMode}
          setLogModalQuest={setLogModalQuest}
          setLogNote={setLogNote}
          setLogUseAssistance={setLogUseAssistance}
          setLogValue={setLogValue}
        />
      )}

      {/* MODALE 2 : OBJECTIF VALIDÉ & PASSAGE AU NIVEAU SUPÉRIEUR */}
      {levelUpModalQuest && (
        <LevelUpModal
          handleConfirmLevelUp={handleConfirmLevelUp}
          levelUpModalQuest={levelUpModalQuest}
          nextGoalAssistanceKg={nextGoalAssistanceKg}
          nextGoalMode={nextGoalMode}
          nextGoalReps={nextGoalReps}
          nextGoalSets={nextGoalSets}
          nextGoalValue={nextGoalValue}
          setLevelUpModalQuest={setLevelUpModalQuest}
          setNextGoalAssistanceKg={setNextGoalAssistanceKg}
          setNextGoalMode={setNextGoalMode}
          setNextGoalReps={setNextGoalReps}
          setNextGoalSets={setNextGoalSets}
          setNextGoalValue={setNextGoalValue}
        />
      )}

      {/* MODALE 3 : CRÉER OU AJUSTER UN OBJECTIF */}
      {questModalOpen && (
        <QuestFormModal
          editingQuestId={editingQuestId}
          formCatalogId={formCatalogId}
          formCategory={formCategory}
          formCustomName={formCustomName}
          formGoalAssistanceKg={formGoalAssistanceKg}
          formGoalMode={formGoalMode}
          formGoalReps={formGoalReps}
          formGoalSets={formGoalSets}
          formGoalValue={formGoalValue}
          formStartAssistanceKg={formStartAssistanceKg}
          formStartValue={formStartValue}
          formTimed={formTimed}
          formType={formType}
          formUnit={formUnit}
          handleSaveQuestForm={handleSaveQuestForm}
          handleSelectCatalogExercise={handleSelectCatalogExercise}
          setFormCategory={setFormCategory}
          setFormCurrentValue={setFormCurrentValue}
          setFormCustomName={setFormCustomName}
          setFormGoalAssistanceKg={setFormGoalAssistanceKg}
          setFormGoalMode={setFormGoalMode}
          setFormGoalReps={setFormGoalReps}
          setFormGoalSets={setFormGoalSets}
          setFormGoalValue={setFormGoalValue}
          setFormStartAssistanceKg={setFormStartAssistanceKg}
          setFormStartValue={setFormStartValue}
          setFormTimed={setFormTimed}
          setFormUnit={setFormUnit}
          setQuestModalOpen={setQuestModalOpen}
        />
      )}

      {/* MODALE 4 : AJOUT RAPIDE "+ COURSE / MARCHE DU JOUR" */}
      {quickCardioModalOpen && (
        <QuickCardioModal
          handleSaveQuickCardio={handleSaveQuickCardio}
          liveQuickCardioCalories={liveQuickCardioCalories}
          quickCardioCatalogId={quickCardioCatalogId}
          quickCardioDate={quickCardioDate}
          quickCardioDistanceKm={quickCardioDistanceKm}
          quickCardioDurationMin={quickCardioDurationMin}
          quickCardioElevationM={quickCardioElevationM}
          quickCardioNote={quickCardioNote}
          quickCardioRpe={quickCardioRpe}
          setQuickCardioCatalogId={setQuickCardioCatalogId}
          setQuickCardioDate={setQuickCardioDate}
          setQuickCardioDistanceKm={setQuickCardioDistanceKm}
          setQuickCardioDurationMin={setQuickCardioDurationMin}
          setQuickCardioElevationM={setQuickCardioElevationM}
          setQuickCardioModalOpen={setQuickCardioModalOpen}
          setQuickCardioNote={setQuickCardioNote}
          setQuickCardioRpe={setQuickCardioRpe}
        />
      )}

      {/* MODALE 5 : AVERTISSEMENT DE RÉINITIALISATION SÉCURISÉ */}
      {confirmResetOpen && (
        <ResetModal handleResetAll={handleResetAll} setConfirmResetOpen={setConfirmResetOpen} />
      )}

      {/* MODALE 6 : RÉGLAGES DE LA SAUVEGARDE GITHUB */}
      {syncOpen && (
        <SyncModal sync={sync} onClose={() => setSyncOpen(false)} triggerToast={triggerToast} />
      )}
    </div>
  );
}
