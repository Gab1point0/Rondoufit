import { useMemo } from 'react';
import { coachOverview } from '../coach/advice';
import { coachDayLabel } from '../coach/settings';
import { getTodayISODate } from '../lib/dates';

/**
 * Grande carte d'accueil du Coach : prochaine séance, accès direct à la séance guidée et à l'onglet Coach.
 */
export function CoachBanner({ gameState, guidedActive, onOpenCoach, onResumeGuided, onStartGuided }) {
  const today = getTodayISODate();
  const ov = useMemo(
    () => coachOverview(gameState, today),
    [gameState.quests, gameState.coach, gameState.userWeightKg, today]
  );
  const session = ov.session && ov.session.exercises.length > 0 ? ov.session : null;
  const isToday = !!(ov.first && ov.first.iso === today);

  let headline = 'Ton coach personnel';
  let detail = 'Il prépare tes séances, règle les charges et suit ta progression.';
  if (guidedActive) {
    headline = 'Séance guidée en cours';
    detail = 'Reprends là où tu t’étais arrêté.';
  } else if (session && ov.first) {
    headline = isToday ? 'Séance prévue aujourd’hui' : `Prochaine séance : ${coachDayLabel(ov.first.iso)}`;
    detail = `${session.exercises.length} exercice(s) · ≈ ${session.estMin} min · ≈ ${session.estKcal} kcal`;
  } else if (!ov.hasExercises) {
    headline = 'Ajoute tes exercices';
    detail = 'Dès que tu as des objectifs de musculation, le coach te prépare tes séances.';
  }

  return (
    <section className="bg-gradient-to-r from-pink-600/30 via-fuchsia-600/20 to-indigo-600/30 border-2 border-pink-400/60 rounded-3xl p-5 sm:p-6 shadow-xl shadow-pink-500/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-4xl sm:text-5xl shadow-lg shrink-0">
            🧠
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-white">Mon Coach</h2>
            <p className="text-sm sm:text-base font-bold text-pink-200">{headline}</p>
            <p className="text-xs sm:text-sm text-slate-300">{detail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {guidedActive ? (
            <button
              type="button"
              onClick={onResumeGuided}
              className="flex-1 md:flex-none px-5 py-3 rounded-2xl font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
            >
              ▶ Reprendre ma séance
            </button>
          ) : (
            session && isToday && (
              <button
                type="button"
                onClick={() => onStartGuided(session)}
                className="flex-1 md:flex-none px-5 py-3 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white shadow-lg shadow-pink-600/30"
              >
                ▶ Lancer ma séance
              </button>
            )
          )}
          <button
            type="button"
            onClick={onOpenCoach}
            className={`flex-1 md:flex-none px-5 py-3 rounded-2xl font-black text-sm sm:text-base ${
              !guidedActive && !(session && isToday)
                ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white shadow-lg shadow-pink-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-white border border-pink-400/50'
            }`}
          >
            🧠 Ouvrir le Coach
          </button>
        </div>
      </div>
    </section>
  );
}
