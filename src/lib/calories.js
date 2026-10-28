// Calories NETTES (hors métabolisme de repos : 1 MET = 1 kcal/kg/h retiré)
export function calculateStrengthCalories({
  unit, weightKg = 0, assistanceKg = 0, setDetails = [6, 6, 6], rpe = 7, userWeightKg = 82,
  timed = false,
}) {
  const numSets = Math.max(1, setDetails.length);
  const totalReps = setDetails.reduce((acc, r) => acc + (Number(r) || 0), 0) / (timed ? 3 : 1);
  const durationHours = (numSets * 2.2 + totalReps * 0.05) / 60;
  const effectiveLoad = unit === 'reps'
    ? Math.max(15, userWeightKg * 0.78 - (Number(assistanceKg) || 0))
    : Math.max(5, Number(weightKg) || 0);
  const loadRatio = effectiveLoad / Math.max(45, userWeightKg);
  const grossMet = Math.min(6.0, 3.8 + (rpe - 5) * 0.55 + Math.min(2.8, loadRatio * 1.45));
  return Math.max(10, Math.round((grossMet - 1) * userWeightKg * durationHours));
}

export function calculateCardioCalories({
  cardioMode = 'run', distanceKm = 5, durationMin = 30, elevationM = 0, rpe = 7, userWeightKg = 82,
}) {
  const durMin = Math.max(1, Number(durationMin) || 20);
  const distKm = Math.max(0.1, Number(distanceKm) || 0);
  const elevM = Math.max(0, Number(elevationM) || 0);
  const w = Math.max(30, Number(userWeightKg) || 82);
  const hours = durMin / 60;
  let kcal = 0;

  if (cardioMode === 'volleyball') {
    // ~3 MET à RPE 4, ~4,8 à RPE 7, ~6 à RPE 9 (valeurs brutes), temps morts inclus
    const grossMet = Math.max(2, 3 + (Math.min(10, Math.max(1, rpe)) - 4) * 0.6);
    kcal = (grossMet - 1) * w * hours;
  } else if (['run', 'interval', 'walk', 'incline_walk'].includes(cardioMode)) {
    // Équations ACSM (vitesse + pente), VO2 en ml/kg/min, 1 L O2 ≈ 5 kcal
    const speed = (distKm * 1000) / durMin; // m/min
    const grade = Math.min(0.25, elevM / (distKm * 1000));
    const isRunning = cardioMode === 'run' || cardioMode === 'interval' || speed >= 120;
    const vo2 = isRunning
      ? 0.2 * speed + 0.9 * speed * grade + 3.5
      : 0.1 * speed + 1.8 * speed * grade + 3.5;
    kcal = (vo2 - 3.5) * w * durMin / 1000 * 5; // net : repos retiré
  } else {
    const MET_BY_MODE = { bike: 6.8, elliptical: 5.0, rower: 7.0, stairs: 8.8, skierg: 7.5, jumprope: 10.5, hiit: 8.0, boxing: 7.5, group_class: 6.0 };
    const grossMet = (MET_BY_MODE[cardioMode] || 6.8) + (rpe - 6) * 0.5;
    kcal = (grossMet - 1) * w * hours + (cardioMode === 'other' ? w * elevM * 0.01 : 0);
  }
  return Math.max(20, Math.round(kcal));
}

export const DEFAULT_CARDIO_INPUT = { inputMode: 'distance', speedKmh: 10, slopeMode: 'meters', slopePct: 5 };

/**
 * Saisie cardio « vitesse + durée » et/ou « pente en % » → distance (km) et dénivelé positif (m) utilisés partout ailleurs.
 *  - inputMode 'speed' : distance = vitesse × durée (ex. 10 km/h pendant 5 min = 0,83 km) ;
 *  - slopeMode 'percent' : dénivelé = pente % × distance parcourue (ex. 4 km/h pendant 40 min à 10 % = 2,67 km → 267 m).
 */
export function resolveCardioInputs({ inputMode = 'distance', distanceKm = 0, speedKmh = 0, durationMin = 0, slopeMode = 'meters', elevationM = 0, slopePct = 0 }) {
  const dur = Math.max(0, Number(durationMin) || 0);
  const dist = inputMode === 'speed'
    ? Math.round(Math.max(0, Number(speedKmh) || 0) * dur / 60 * 100) / 100
    : Math.max(0, Number(distanceKm) || 0);
  const elev = slopeMode === 'percent'
    ? Math.round(Math.max(0, Number(slopePct) || 0) / 100 * dist * 1000)
    : Math.max(0, Number(elevationM) || 0);
  return { distanceKm: dist, elevationM: elev };
}

/** Texte « à 10 km/h, pente 10 % » ajouté aux notes automatiques ('' en saisie classique). */
export function cardioInputNote(ci) {
  if (!ci) return '';
  const parts = [];
  if (ci.inputMode === 'speed') parts.push(`à ${Number(ci.speedKmh) || 0} km/h`);
  if (ci.slopeMode === 'percent') parts.push(`pente ${Number(ci.slopePct) || 0} %`);
  return parts.join(', ');
}

export function formatPaceAndSpeed(distanceKm, durationMin) {
  const dist = Number(distanceKm) || 0;
  const dur = Number(durationMin) || 0;
  if (dist <= 0 || dur <= 0) return { pace: '--:-- /km', speed: '0.0 km/h' };
  const paceDecimal = dur / dist;
  const paceMin = Math.floor(paceDecimal);
  const paceSec = Math.round((paceDecimal - paceMin) * 60);
  const normalizedMin = paceSec === 60 ? paceMin + 1 : paceMin;
  const normalizedSec = paceSec === 60 ? 0 : paceSec;
  const speed = (dist / (dur / 60)).toFixed(1);
  return {
    pace: `${normalizedMin}'${String(normalizedSec).padStart(2, '0')}" /km`,
    speed: `${speed} km/h`
  };
}
