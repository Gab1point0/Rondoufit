import { calculateCardioCalories, calculateStrengthCalories } from './calories';
import { countValidatedSets, formatSetsBreakdown, getSetDetailsArray, isTimedQuest } from './quests';

// Correction d'une séance déjà enregistrée (onglet Journal) : on reconstruit l'entrée à partir des valeurs corrigées
// et on remet l'exercice à jour comme si la séance corrigée avait été saisie telle quelle.

const goalSetsOf = q => Math.max(1, Number(q.goalSets) || 3);
const goalRepsOf = q => Math.max(1, Number(q.goalReps) || Number(q.goalValue) || 6);

/** Note générée automatiquement pour une entrée (la même que celle de « Noter séance »). */
export function defaultEntryNote(q, e) {
  if (q.type === 'cardio') {
    return `Sortie ${q.name} : ${e.value} ${q.unit} en ${e.durationMin} min (${e.calories} kcal)`;
  }
  const sets = e.setDetails || [];
  const validated = e.validatedSets !== undefined ? e.validatedSets : countValidatedSets(sets, goalRepsOf(q));
  const goalSets = e.goalSets || goalSetsOf(q);
  if (isTimedQuest(q)) return `Séries : ${formatSetsBreakdown(sets)} s • ${validated}/${goalSets} séries validées`;
  if (q.unit === 'reps') {
    return `Séries : ${formatSetsBreakdown(sets)} reps (${(Number(e.assistanceKg) || 0) > 0 ? `Aide ${e.assistanceKg} kg` : 'Strict 0 kg'}) • ${validated}/${goalSets} séries validées`;
  }
  return `${e.value} kg • Séries : ${formatSetsBreakdown(sets)} reps (${validated}/${goalSets} validées)`;
}

/**
 * Entrée corrigée : valeurs nettoyées, champs dérivés (meilleure série, séries validées, calories, note automatique)
 * recalculés. `patch` peut contenir date, setDetails, value, assistanceKg, durationMin, elevationM, rpe, note.
 */
export function rebuildEntry(q, entry, patch, userWeightKg) {
  const e = { ...entry, ...patch };
  const rpe = Math.min(10, Math.max(1, Number(e.rpe) || 7));
  let rebuilt;
  if (q.type === 'cardio') {
    const value = Math.max(0.1, Number(e.value) || 0);
    const durationMin = Math.max(1, Number(e.durationMin) || 20);
    const elevationM = Math.max(0, Number(e.elevationM) || 0);
    const calories = calculateCardioCalories({
      cardioMode: q.cardioMode || 'run',
      distanceKm: q.unit === 'km' ? value : (value / 60) * 5.2,
      durationMin: q.unit === 'min' ? value : durationMin,
      elevationM,
      rpe,
      userWeightKg,
    });
    rebuilt = { ...e, value, durationMin, elevationM, rpe, calories };
  } else {
    const setDetails = (e.setDetails || []).map(r => Math.max(0, Number(r) || 0));
    if (!setDetails.length) setDetails.push(0);
    const best = Math.max(...setDetails, 0);
    const assistanceKg = q.unit === 'reps' ? Math.max(0, Number(e.assistanceKg) || 0) : 0;
    const value = q.unit === 'kg' ? Math.max(0, Number(e.value) || 0) : best;
    const calories = calculateStrengthCalories({
      unit: q.unit,
      timed: isTimedQuest(q),
      weightKg: q.unit === 'kg' ? value : 0,
      assistanceKg,
      setDetails,
      rpe,
      userWeightKg,
    });
    rebuilt = {
      ...e,
      value,
      sets: setDetails.length,
      reps: best,
      setDetails,
      validatedSets: countValidatedSets(setDetails, goalRepsOf(q)),
      goalSets: goalSetsOf(q),
      goalReps: goalRepsOf(q),
      assistanceKg,
      rpe,
      calories,
    };
  }
  // Note : si elle était générée automatiquement et que l'utilisateur ne l'a pas réécrite, on la régénère.
  const noteUntouched = patch.note === undefined || patch.note === entry.note;
  if (noteUntouched && entry.note === defaultEntryNote(q, entry)) rebuilt.note = defaultEntryNote(q, rebuilt);
  return rebuilt;
}

/** L'exercice après un changement de son historique : valeur actuelle, aide, séries… reprises de la dernière séance. */
export function questAfterHistoryChange(q, history) {
  // L'historique reste dans l'ordre des dates (la « dernière séance » sert de référence au coach).
  const remaining = history.map((h, i) => [h, i]).sort((a, b) => (a[0].date < b[0].date ? -1 : a[0].date > b[0].date ? 1 : a[1] - b[1])).map(p => p[0]);
  if (remaining.length === 0) {
    const gSets = goalSetsOf(q);
    const gReps = goalRepsOf(q);
    const resetVal = Number(q.startValue) || 0;
    return {
      ...q,
      currentValue: resetVal,
      currentAssistanceKg: q.unit === 'reps' ? Number(q.startAssistanceKg) || 0 : 0,
      setDetails: q.type === 'strength' ? Array(gSets).fill(q.unit === 'reps' ? resetVal : gReps) : [],
      history: [],
    };
  }
  const last = remaining[remaining.length - 1];
  if (q.type === 'cardio') {
    const maxVal = remaining.reduce((max, h) => Math.max(max, Number(h.value) || 0), Number(q.startValue) || 0);
    return {
      ...q,
      currentValue: maxVal,
      durationMin: last.durationMin || q.durationMin,
      elevationM: last.elevationM !== undefined ? last.elevationM : q.elevationM,
      history: remaining,
    };
  }
  return {
    ...q,
    currentValue: Number(last.value) || Number(q.startValue) || 0,
    currentAssistanceKg: q.unit === 'reps' ? Number(last.assistanceKg) || 0 : 0,
    setDetails: getSetDetailsArray(last, goalSetsOf(q), goalRepsOf(q)),
    history: remaining,
  };
}
