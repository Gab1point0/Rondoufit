import { AccountForm } from '../components/AccountForm';
import { X } from '../icons';

// Fenêtre « Mon compte » : créer un compte, se connecter, se déconnecter (sauvegarde automatique).
export function AccountModal({ sync, recovery, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex p-4 pt-20 pb-24 sm:py-4 overflow-y-auto" role="dialog" aria-label="Mon compte">
      <div className="m-auto bg-slate-900 border border-pink-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white">☁️ Mon compte et ma sauvegarde</h3>
            <p className="text-xs text-slate-400 mt-0.5">Avec un compte, tes données sont sauvegardées automatiquement et se retrouvent sur tous tes appareils.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <AccountForm sync={sync} recovery={recovery} onDone={onClose} />
      </div>
    </div>
  );
}
