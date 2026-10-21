import { EXERCISE_CATALOG } from '../data/catalog';
import { Footprints, X } from '../icons';
import { formatPaceAndSpeed } from '../lib/calories';

export function QuickCardioModal({
  handleSaveQuickCardio, liveQuickCardioCalories, quickCardioCatalogId, quickCardioDate,
  quickCardioDistanceKm, quickCardioDurationMin, quickCardioElevationM, quickCardioNote,
  quickCardioRpe, setQuickCardioCatalogId, setQuickCardioDate, setQuickCardioDistanceKm,
  setQuickCardioDurationMin, setQuickCardioElevationM, setQuickCardioModalOpen, setQuickCardioNote,
  setQuickCardioRpe,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Footprints className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-base font-black text-white">
                Ajouter une Course ou Marche du jour
              </h3>
              <p className="text-xs text-slate-400">
                S’ajoute au bilan calorique et au Journal des Séances
              </p>
            </div>
          </div>
          <button
            onClick={() => setQuickCardioModalOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveQuickCardio} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Type de sortie cardio
            </label>
            <select
              value={quickCardioCatalogId}
              onChange={e => setQuickCardioCatalogId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              {EXERCISE_CATALOG.filter(c => c.type === 'cardio').map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={quickCardioDistanceKm}
                onChange={e => setQuickCardioDistanceKm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-center font-black text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Durée (min)
              </label>
              <input
                type="number"
                min="1"
                value={quickCardioDurationMin}
                onChange={e => setQuickCardioDurationMin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-center font-black text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Dénivelé D+ (m)
              </label>
              <input
                type="number"
                min="0"
                value={quickCardioElevationM}
                onChange={e => setQuickCardioElevationM(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-center font-black text-white text-sm"
              />
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Allure & Vitesse</span>
              <span className="font-extrabold text-emerald-300">
                {formatPaceAndSpeed(quickCardioDistanceKm, quickCardioDurationMin).pace} •{' '}
                {formatPaceAndSpeed(quickCardioDistanceKm, quickCardioDurationMin).speed}
              </span>
            </div>
            <div className="text-right">
              <span className="text-orange-300 block font-bold">Dépense estimée</span>
              <span className="text-base font-black text-orange-300">
                🔥 {liveQuickCardioCalories} kcal
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={quickCardioDate}
                onChange={e => setQuickCardioDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Intensité RPE ({quickCardioRpe}/10)
              </label>
              <input
                type="range"
                min="5"
                max="10"
                value={quickCardioRpe}
                onChange={e => setQuickCardioRpe(Number(e.target.value))}
                className="w-full accent-emerald-500 mt-2"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Note (ex: Footing matinal, marche rapide...)"
            value={quickCardioNote}
            onChange={e => setQuickCardioNote(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQuickCardioModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
            >
              Ajouter au Bilan du Jour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
