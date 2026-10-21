import { addDaysISO } from '../lib/dates';

export function BilanTab({ gameState, handleClaimChallenge, records, weekData }) {
  return (
    <div className="space-y-6">
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="font-black text-white">
          🎯 Défis de la semaine{' '}
          <span className="text-xs text-slate-400 font-semibold">
            (du {weekData.ws.slice(8)}/{weekData.ws.slice(5, 7)} au {addDaysISO(weekData.ws, 6).slice(8)}/{addDaysISO(weekData.ws, 6).slice(5, 7)})
          </span>
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {weekData.challenges.map(c => {
            const cur = Math.min(c.target, weekData.cur[c.key] || 0);
            const done = cur >= c.target;
            const claimed = (gameState.claimedChallenges || []).includes(c.uid);
            return (
              <div key={c.uid} className={`p-3.5 rounded-xl border ${done ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800 bg-slate-950'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <p className="font-extrabold text-white text-sm">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.desc}</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-pink-500" style={{ width: `${(cur / c.target) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-slate-300 font-bold">{Math.round(cur * 10) / 10} / {c.target}</span>
                  {claimed ? (
                    <span className="text-emerald-400 font-bold">✅ Réclamé</span>
                  ) : done ? (
                    <button onClick={() => handleClaimChallenge(c)} className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black hover:bg-amber-400">
                      Réclamer +{c.xp} EXP
                    </button>
                  ) : (
                    <span className="text-pink-300 font-bold">+{c.xp} EXP</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="font-black text-white">📊 Bilan de la semaine <span className="text-xs text-slate-400 font-semibold">(vs semaine précédente)</span></h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { k: 'sessions', l: 'Séances', u: '' },
            { k: 'days', l: 'Jours actifs', u: '' },
            { k: 'kcal', l: 'Calories brûlées', u: ' kcal' },
            { k: 'km', l: 'Distance', u: ' km' },
            { k: 'volume', l: 'Volume soulevé', u: ' kg' },
            { k: 'reps', l: 'Répétitions', u: '' }
          ].map(m => {
            const diff = Math.round((weekData.cur[m.k] - weekData.prev[m.k]) * 10) / 10;
            return (
              <div key={m.k} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">{m.l}</span>
                <span className="text-xl font-black text-white">{weekData.cur[m.k]}{m.u}</span>
                <span className={`block text-xs font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : '＝ '}{diff !== 0 ? diff : 'stable'}{diff !== 0 ? m.u : ''}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="font-black text-white">🏅 Records personnels</h3>
        {records.length === 0 && <p className="text-xs text-slate-400">Enregistrez une séance pour voir vos records apparaître.</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {records.map(g => (
            <div key={g.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <p className="font-extrabold text-white text-sm mb-1.5">{g.icon} {g.name}</p>
              {g.recs.map(r => (
                <div key={r.key} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="text-right">
                    <b className="text-pink-300">{r.text}</b>
                    <span className="text-slate-500 ml-1.5">{r.date ? r.date.slice(8, 10) + '/' + r.date.slice(5, 7) : ''}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
