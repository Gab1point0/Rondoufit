import { EXERCISE_CATALOG } from '../../data/catalog';
import { card } from './ui';

export function CoachVolley({ gameState, onAddExercise }) {
  return (
    <section className={card}>
      <h3 className="font-black text-white">🏐 Volley : épaules et gainage</h3>
      <p className="text-xs text-slate-300">
        Le volley sollicite beaucoup les épaules et les jambes. Renforcer la coiffe des rotateurs, le haut du dos et le tronc est une pratique courante en prévention. Attention : les preuves de réduction des blessures chez les volleyeurs restent limitées.
      </p>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {['fp_ext_rotation', 'fp_face_pull', 'fp_plank'].map(id => {
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
