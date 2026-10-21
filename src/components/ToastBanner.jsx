import { X } from '../icons';

export function ToastBanner({ dismissToast, toast }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900/95 border-2 border-pink-400/80 shadow-2xl shadow-pink-500/20 rounded-2xl p-4 flex items-center gap-3.5 animate-bounce">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center text-2xl shrink-0 shadow-inner">
        <span className={toast.badge === '🏅' ? 'inline-block animate-bounce' : ''}>{toast.badge}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-extrabold text-pink-300 text-sm uppercase tracking-wider truncate">
            {toast.title}
          </p>
          {toast.xpGain > 0 && (
            <span className="px-2 py-0.5 text-xs font-black rounded-full bg-indigo-500/30 border border-indigo-400 text-indigo-200">
              +{toast.xpGain} EXP
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{toast.subtitle}</p>
      </div>
      <button
        onClick={dismissToast}
        className="text-slate-400 hover:text-white p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
