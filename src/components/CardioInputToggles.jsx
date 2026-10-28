// Choix de saisie du cardio : « distance + durée » ou « vitesse + durée », et dénivelé en mètres ou pente en %.
// Rendu commun à « + Course / Marche du jour » et à « Noter séance » ; les champs (vitesse, pente) sont ici,
// les champs classiques (distance, durée, dénivelé) restent dans la fenêtre qui l'utilise.
const chip = on => `flex-1 px-2 py-1.5 rounded-lg text-[11px] font-black border ${on ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-950 border-slate-700 text-slate-300'}`;
const field = 'w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-center font-black text-white text-sm';

export function CardioInputToggles({ ci, setCi, showSpeed = true, distanceKm, elevationM }) {
  return (
    <div className="space-y-2" data-testid="cardio-input">
      {showSpeed && (
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setCi({ inputMode: 'distance' })} className={chip(ci.inputMode === 'distance')}>Distance + durée</button>
          <button type="button" onClick={() => setCi({ inputMode: 'speed' })} className={chip(ci.inputMode === 'speed')}>Vitesse + durée</button>
        </div>
      )}
      <div className="flex gap-1.5">
        <button type="button" onClick={() => setCi({ slopeMode: 'meters' })} className={chip(ci.slopeMode === 'meters')}>Dénivelé en m</button>
        <button type="button" onClick={() => setCi({ slopeMode: 'percent' })} className={chip(ci.slopeMode === 'percent')}>Pente en %</button>
      </div>
      {(showSpeed && ci.inputMode === 'speed') || ci.slopeMode === 'percent' ? (
        <div className="grid grid-cols-2 gap-2.5">
          {showSpeed && ci.inputMode === 'speed' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Vitesse (km/h)</label>
              <input type="number" step="0.1" min="0" value={ci.speedKmh} onChange={e => setCi({ speedKmh: e.target.value })} className={field} />
            </div>
          )}
          {ci.slopeMode === 'percent' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Pente (%)</label>
              <input type="number" step="0.5" min="0" max="40" value={ci.slopePct} onChange={e => setCi({ slopePct: e.target.value })} className={field} />
            </div>
          )}
        </div>
      ) : null}
      {(ci.inputMode === 'speed' && showSpeed) || ci.slopeMode === 'percent' ? (
        <p className="text-[11px] text-emerald-300">
          {showSpeed && ci.inputMode === 'speed' ? `≈ ${distanceKm} km parcourus` : ''}
          {showSpeed && ci.inputMode === 'speed' && ci.slopeMode === 'percent' ? ' · ' : ''}
          {ci.slopeMode === 'percent' ? `≈ ${elevationM} m de dénivelé positif` : ''}
        </p>
      ) : null}
    </div>
  );
}
