import { getWeekStart } from '../lib/dates';
import { coachDaysBetween, getCoachSettings } from './settings';

// Profils de travail du coach : puissance (force), hypertrophie, endurance de force.
// Repères (« continuum des répétitions », ACSM 2009 et NSCA) :
//  - force / puissance : 1 à 6 répétitions à 85 % du 1RM ou plus, repos de 2 à 5 minutes ;
//  - hypertrophie : 6 à 12 répétitions à 67-85 % du 1RM, repos plus courts (30 s à 2 min selon les sources) ;
//  - endurance de force : 12 répétitions ou plus à 67 % ou moins (ACSM : 40-60 %), repos courts (90 s ou moins).
// Mises à jour de la recherche (Schoenfeld et al. 2021 ; Lopez et al. 2021) : la force progresse mieux avec des charges
// lourdes, alors que l'hypertrophie peut s'obtenir sur une large plage de charges si les séries sont proches de l'échec.
// Les fourchettes ci-dessous sont donc des repères pratiques, pas des frontières strictes.

export const PROFILES = {
  puissance: {
    id: 'puissance',
    label: 'Puissance',
    icon: '🚀',
    lo: 3, hi: 5,
    sets: 4, setsAccessory: 3,
    pctStart: 85, pctText: '85 à 93 %',
    restCompound: 210, restAccessory: 150,
    restText: '2 min 30 à 3 min 30',
    summary: 'Charges lourdes, peu de répétitions, longs repos. Pour gagner en force maximale.',
  },
  hypertrophie: {
    id: 'hypertrophie',
    label: 'Hypertrophie',
    icon: '💪',
    lo: 8, hi: 12,
    sets: 4, setsAccessory: 3,
    pctStart: 72, pctText: '67 à 80 %',
    restCompound: 120, restAccessory: 75,
    restText: '1 min 15 à 2 min',
    summary: 'Charges modérées, 8 à 12 répétitions proches de l’échec. Pour prendre du volume musculaire.',
  },
  endurance: {
    id: 'endurance',
    label: 'Endurance de force',
    icon: '🔁',
    lo: 15, hi: 20,
    sets: 3, setsAccessory: 3,
    pctStart: 58, pctText: '50 à 65 %',
    restCompound: 75, restAccessory: 45,
    restText: '45 s à 1 min 15',
    summary: 'Charges légères, beaucoup de répétitions, repos courts. Pour tenir l’effort plus longtemps.',
  },
};
const PROFILE_IDS = Object.keys(PROFILES);
export const PROFILE_CHOICES = [{ id: 'auto', label: 'Automatique (comme avant)' }, ...PROFILE_IDS.map(id => ({ id, label: `${PROFILES[id].icon} ${PROFILES[id].label}` }))];

// % du 1RM selon le nombre de répétitions possibles (tableau NSCA jusqu'à 12 ; au-delà, estimation approchée)
const POINTS = [[1, 100], [2, 95], [3, 93], [4, 90], [5, 87], [6, 85], [7, 83], [8, 80], [9, 77], [10, 75], [12, 67], [15, 62], [20, 55], [30, 45]];
export function pctForReps(reps) {
  const r = Math.max(1, Number(reps) || 1);
  for (let i = 1; i < POINTS.length; i++) {
    if (r <= POINTS[i][0]) {
      const [r0, p0] = POINTS[i - 1];
      const [r1, p1] = POINTS[i];
      return p0 + ((p1 - p0) * (r - r0)) / (r1 - r0);
    }
  }
  return POINTS[POINTS.length - 1][1];
}

/**
 * Profil actif à une date : celui du cycle en cours (si « un profil par cycle » est réglé), sinon le profil général.
 * @returns {{ id: string|null, fromCycle: boolean, cycleIndex: number|null }} id = null → mode automatique
 */
export function coachProfileAt(coach, iso) {
  const seq = (coach.cycleProfiles || []).filter(p => p === 'auto' || PROFILES[p]);
  const len = Number(coach.cycleWeeks) || 0;
  if (len && coach.cycleStart && seq.length) {
    const diff = Math.round(coachDaysBetween(coach.cycleStart, getWeekStart(iso)) / 7);
    const k = diff < 0 ? 0 : Math.floor(diff / len);
    const id = seq[k % seq.length];
    return { id: PROFILES[id] ? id : null, fromCycle: true, cycleIndex: k };
  }
  const id = coach.workProfile;
  return { id: PROFILES[id] ? id : null, fromCycle: false, cycleIndex: null };
}

/** Options à passer à computeExerciseTarget pour le jour `iso`. */
export function profileOpts(state, iso) {
  return { profile: coachProfileAt(getCoachSettings(state), iso).id, maxRecords: (state && state.maxRecords) || {} };
}
