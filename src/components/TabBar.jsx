import { ACHIEVEMENTS_LIST } from '../data/gamification';

// Onglets de l'application. `group` : « suivi » (poids, maxima, courbes) et « plus » (souvenirs, bilan, trophées)
// sont regroupés dans la barre du bas sur téléphone.
export const TABS = [
  { id: 'coach', icon: '🧠', label: 'Coach' },
  { id: 'quests', icon: '🏋️', label: 'Exercices' },
  { id: 'journal', icon: '📅', label: 'Journal' },
  { id: 'charts', icon: '📈', label: 'Courbes', group: 'suivi' },
  { id: 'maxima', icon: '💯', label: 'Mes maxima', group: 'suivi' },
  { id: 'weight', icon: '⚖️', label: 'Poids', group: 'suivi' },
  { id: 'photos', icon: '📸', label: 'Souvenirs', group: 'plus' },
  { id: 'bilan', icon: '📊', label: 'Bilan', group: 'plus' },
  { id: 'trophies', icon: '🏆', label: 'Trophées', group: 'plus' },
];
export const SUIVI_TABS = TABS.filter(t => t.group === 'suivi');
export const PLUS_TABS = TABS.filter(t => t.group === 'plus');

const tabText = (t, gameState) =>
  t.id === 'quests' ? `${t.icon} ${t.label} (${gameState.quests.length})`
    : t.id === 'trophies' ? `${t.icon} ${t.label} (${gameState.unlockedAchievements.length}/${ACHIEVEMENTS_LIST.length})`
      : `${t.icon} ${t.label}`;

// Grande barre d'onglets (ordinateur et tablette)
export function TabBar({ activeTab, gameState, setActiveTab }) {
  return (
    <nav className="hidden md:flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3" aria-label="Onglets">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`rounded-xl font-bold flex items-center gap-2 transition ${
            t.id === 'coach'
              ? `px-5 py-3 font-black text-base text-white shadow-lg ${activeTab === 'coach' ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 shadow-pink-600/40 ring-2 ring-pink-300/60' : 'bg-gradient-to-r from-pink-600/70 to-fuchsia-700/70 shadow-pink-600/20 hover:from-pink-500 hover:to-fuchsia-600'}`
              : `px-3.5 py-2.5 text-sm ${activeTab === t.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`
          }`}
        >
          {tabText(t, gameState)}
        </button>
      ))}
    </nav>
  );
}

// Téléphone : petites pastilles pour passer de Poids / Maxima / Courbes (ou Souvenirs / Bilan / Trophées)
export function SubTabs({ activeTab, setActiveTab }) {
  const group = SUIVI_TABS.some(t => t.id === activeTab) ? SUIVI_TABS : PLUS_TABS.some(t => t.id === activeTab) ? PLUS_TABS : null;
  if (!group) return null;
  return (
    <div className="md:hidden flex gap-1.5" aria-label="Sous-onglets">
      {group.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`flex-1 px-2 py-2 rounded-xl text-xs font-bold border ${activeTab === t.id ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// Téléphone : barre fixe en bas de l'écran
export function BottomNav({ activeTab, moreOpen, onOpenMore, setActiveTab }) {
  const inSuivi = SUIVI_TABS.some(t => t.id === activeTab);
  const inPlus = PLUS_TABS.some(t => t.id === activeTab);
  const items = [
    { key: 'coach', icon: '🧠', label: 'Coach', on: activeTab === 'coach', go: () => setActiveTab('coach') },
    { key: 'quests', icon: '🏋️', label: 'Exercices', on: activeTab === 'quests', go: () => setActiveTab('quests') },
    { key: 'journal', icon: '📅', label: 'Journal', on: activeTab === 'journal', go: () => setActiveTab('journal') },
    { key: 'suivi', icon: '📈', label: 'Suivi', on: inSuivi, go: () => setActiveTab(inSuivi ? activeTab : 'weight') },
    { key: 'plus', icon: '☰', label: 'Plus', on: inPlus || moreOpen, go: onOpenMore },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]" aria-label="Navigation">
      {items.map(i => (
        <button key={i.key} onClick={i.go} className={`flex flex-col items-center justify-center gap-0.5 py-2 ${i.on ? 'text-pink-300' : 'text-slate-400'}`}>
          <span className="text-xl leading-none">{i.icon}</span>
          <span className={`text-[11px] ${i.on ? 'font-black' : 'font-bold'}`}>{i.label}</span>
        </button>
      ))}
    </nav>
  );
}
