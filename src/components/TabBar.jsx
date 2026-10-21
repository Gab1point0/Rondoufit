import { ACHIEVEMENTS_LIST } from '../data/gamification';
import { BarChart3, Calendar, Scale, Sword, Trophy } from '../icons';

export function TabBar({ activeTab, dailyJournalList, gameState, setActiveTab }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'quests'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sword className="w-4 h-4" />
          <span>Quêtes & Objectifs ({gameState.quests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coach')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'coach'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🧠 Coach</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'journal'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>📅 Journal des Séances ({dailyJournalList.length} j)</span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'charts'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Courbes</span>
        </button>

        <button
          onClick={() => setActiveTab('weight')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'weight'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>⚖️ Suivi du Poids</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'photos'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>📸 Souvenirs</span>
        </button>

        <button
          onClick={() => setActiveTab('bilan')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'bilan'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>📊 Bilan</span>
        </button>

        <button
          onClick={() => setActiveTab('trophies')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
            activeTab === 'trophies'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>
            Trophées ({gameState.unlockedAchievements.length}/{ACHIEVEMENTS_LIST.length})
          </span>
        </button>
      </div>
    </div>
  );
}
