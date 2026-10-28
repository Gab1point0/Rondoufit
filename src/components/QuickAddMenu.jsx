import { useState } from 'react';

// Bouton « + » flottant : les actions de saisie rapide au même endroit (au pouce)
export function QuickAddMenu({ onCourse, onExercise, onTimer, onVoice }) {
  const [open, setOpen] = useState(false);
  const item = (label, icon, fn, title) => (
    <button key={label} onClick={() => { setOpen(false); fn(); }} title={title} className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 border border-slate-600 text-sm font-bold text-white shadow-xl">
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-950/50" onClick={() => setOpen(false)} />}
      <div className="fixed right-4 bottom-20 md:bottom-6 z-40 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col items-end gap-2">
            {item('+ Course / Marche', '🏃', onCourse)}
            {item('+ Objectif / Exercice', '➕', onExercise)}
            {item('Dicter ma séance', '🎤', onVoice, 'Dicter toute ma séance à la voix')}
            {item('Minuteur de repos', '⏱', onTimer)}
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Ajouter"
          title="Ajouter"
          className={`w-14 h-14 rounded-full text-3xl font-black text-white shadow-2xl shadow-pink-600/40 bg-gradient-to-br from-pink-500 to-fuchsia-600 border-2 border-pink-300/60 transition-transform ${open ? 'rotate-45' : ''}`}
        >
          +
        </button>
      </div>
    </>
  );
}
