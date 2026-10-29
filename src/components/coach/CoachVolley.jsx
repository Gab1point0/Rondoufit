import { EXERCISE_CATALOG } from '../../data/catalog';
import { card } from './ui';

export function CoachVolley({ gameState, onAddExercise, sport }) {
  return (
    <section className={card}>
      <h3 className="font-black text-white">{sport.icon} {sport.cap} : {sport.title}</h3>
      <p className="text-xs text-slate-300">
        {sport.intro} {sport.note}
      </p>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {sport.exercises.map(id => {
          const c = EXERCISE_CATALOG.find(x => x.id === id);
          if (!c) return null;
          const owned = gameState.quests.some(q => q.catalogId === id);
          return owned ? (
            <span key={id} className="px-2.5 py-1 rounded-lg bg-emerald-900/30 border border-emerald-500/40 text-emerald-300 font-bold">✅ {c.name}</span>
          ) : (
            <button key={id} onClick={() => onAddExercise(id)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold">+ {c.name}</button>
          );
        })}
      </div>
    </section>
  );
}
