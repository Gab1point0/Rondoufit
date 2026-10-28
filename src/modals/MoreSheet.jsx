import { PLUS_TABS } from '../components/TabBar';

// « Plus » : pages secondaires, réglages et données (remplace les boutons Exporter / Importer / Réinitialiser de l'en-tête)
const row = 'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-sm font-bold text-slate-100 hover:border-slate-600';

export function MoreSheet({ activeTab, gameState, importInputRef, onClose, onExport, onGoTab, onOpenSync, onReset, setGameState, syncStatus }) {
  const close = fn => () => { onClose(); fn(); };
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl p-4 pb-8 sm:pb-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-white">Plus</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 font-black" aria-label="Fermer">✕</button>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-pink-300">Pages</p>
          {PLUS_TABS.map(t => (
            <button key={t.id} onClick={close(() => onGoTab(t.id))} className={`${row} ${activeTab === t.id ? 'border-pink-500/60' : ''}`}>
              <span className="text-lg">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-pink-300">Réglages</p>
          <button onClick={() => setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))} className={row}>
            <span className="text-lg">{gameState.soundEnabled ? '🔊' : '🔇'}</span>
            <span>Sons : {gameState.soundEnabled ? 'activés' : 'coupés'}</span>
          </button>
          <button onClick={close(onOpenSync)} className={row}>
            <span className="text-lg">☁️</span>
            <span>Sauvegarde GitHub{syncStatus === 'off' ? ' (non réglée)' : ''}</span>
          </button>
          <button onClick={close(onExport)} className={row} title="Exporter une sauvegarde (JSON)">
            <span className="text-lg">💾</span>
            <span>Exporter mes données</span>
          </button>
          <button onClick={close(() => importInputRef.current && importInputRef.current.click())} className={row} title="Importer une sauvegarde (JSON)">
            <span className="text-lg">📥</span>
            <span>Importer une sauvegarde</span>
          </button>
        </div>

        <div className="pt-1 border-t border-slate-800">
          <button onClick={close(onReset)} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-rose-950/30 border border-rose-900/60 text-left text-sm font-bold text-rose-200" title="Réinitialiser l'aventure à zéro">
            <span className="text-lg">♻️</span>
            <span>Réinitialiser l’aventure</span>
          </button>
        </div>
      </div>
    </div>
  );
}
