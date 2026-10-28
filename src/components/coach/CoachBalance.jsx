import { coachFmt } from '../../coach/labels';
import { coachSuggestExercises } from '../../coach/suggest';
import { card } from './ui';

export function CoachBalance({ balance, gameState, lowRows, onAddExercise }) {
  return (
    <section className={card}>
      <h3 className="font-black text-white">⚖️ Équilibre des arènes <span className="text-xs text-slate-400 font-semibold">(séries par semaine, moyenne sur 4 semaines)</span></h3>
      <div className="space-y-2">
        {balance.rows.map(r => {
          const color = r.status === 'good' ? 'bg-emerald-500' : r.status === 'mid' ? 'bg-amber-400' : 'bg-rose-500';
          return (
            <div key={r.arena}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{r.arena}</span>
                <span className="text-slate-400">{coachFmt(r.avg)} séries/sem. · cible {r.band.min}-{r.band.good}+ · {coachFmt(r.perWeekFreq)} séance(s)/sem.</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (r.avg / r.band.good) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[0.75rem] text-slate-500">
        Repères : au moins 2 séances par semaine par groupe (Schoenfeld 2016) et environ 10 séries/semaine pour gagner du muscle (Schoenfeld 2017). Pendant une perte de poids, 6 séries ou plus suffisent généralement pour conserver sa masse musculaire (Spiering 2021).
      </p>
      {balance.ratio !== null && (
        <p className="text-xs text-slate-300">
          Haut du corps : <b>{balance.push}</b> séries de poussée contre <b>{balance.pull}</b> de tirage (rapport tirage/poussée {coachFmt(balance.ratio)}).{' '}
          {balance.ratio < 0.8 ? 'Pense à ajouter du tirage (dos, oiseau, face pull) pour équilibrer les épaules.' : balance.ratio > 1.6 ? 'Tu tires beaucoup plus que tu ne pousses : un peu plus de poussée équilibrerait.' : 'Bon équilibre.'}{' '}
          <span className="text-slate-500">(Pratique courante, preuves limitées.)</span>
        </p>
      )}
      {lowRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-rose-300">Groupes à travailler davantage :</p>
          {lowRows.map(r => {
            const sug = coachSuggestExercises(gameState, r.arena, 2);
            if (!sug.length) return null;
            return (
              <div key={r.arena} className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-300 font-bold">{r.arena} :</span>
                {sug.map(c => (
                  <button key={c.id} onClick={() => onAddExercise(c.id)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold">
                    + {c.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
