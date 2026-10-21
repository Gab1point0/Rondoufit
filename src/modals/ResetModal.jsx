import { AlertTriangle } from '../icons';

export function ResetModal({ handleResetAll, setConfirmResetOpen }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-rose-500/70 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              Alerte du Professeur Chen : Réinitialiser ?
            </h3>
            <p className="text-xs text-slate-400">
              Attention, cette action effacera votre progression actuelle.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => handleResetAll(false)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition"
          >
            🔄 Réinitialiser au Jour 1 (avec les exercices de base)
          </button>
          <button
            type="button"
            onClick={() => handleResetAll(true)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-950 text-rose-300 border border-rose-500/30 transition"
          >
            🧹 Réinitialiser avec une page vierge (0 exercice)
          </button>
          <button
            type="button"
            onClick={() => setConfirmResetOpen(false)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition"
          >
            Annuler et garder ma progression
          </button>
        </div>
      </div>
    </div>
  );
}
