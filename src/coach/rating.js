import { coachDayInfo, coachPlanWeek } from './planning';
import { COACH_TYPES, coachDaysBetween, getCoachSettings } from './settings';
import { normalizeArenaGroup } from '../data/arenas';
import { addDaysISO, getTodayISODate, getWeekStart } from '../lib/dates';
import { getAllEntries, isStartEntry } from '../lib/quests';

// Note de 1 à 10 pour une séance (proposée par le coach ou composée par l'utilisateur),
// avec des remarques écrites. Ce sont des règles de bon sens appuyées sur les repères ACSM 2009 /
// Schoenfeld 2016-2017 (fréquence, volume, récupération) : une aide à la décision, pas une mesure scientifique exacte.
export function coachRateSession(state, session) {
  const coach = getCoachSettings(state);
  const iso = session.date;
  const ex = session.exercises || [];
  if (!ex.length) {
    return { score: 1, label: 'Séance vide', items: [{ level: 'bad', text: 'La séance ne contient aucun exercice.', fix: 'Ajoute au moins un exercice pour chaque grand groupe (jambes, dos, pectoraux, épaules/bras).' }] };
  }
  const items = [];
  let score = 10;
  const add = (pen, level, text, fix) => { score -= pen; items.push({ level, text, fix: fix || '' }); };
  const ok = text => items.push({ level: 'ok', text, fix: '' });
  const di = coachDayInfo(iso, coach);
  const wkStart = getWeekStart(iso);
  const wk = coachPlanWeek(state, wkStart, getTodayISODate());
  const setsBy = {};
  let total = 0;
  ex.forEach(e => { setsBy[e.arena] = (setsBy[e.arena] || 0) + e.sets; total += e.sets; });
  const legSets = setsBy['Jambes'] || 0;
  const entries = getAllEntries(state).filter(e => e.quest.type === 'strength' && !isStartEntry(e));
  const wkEnd = addDaysISO(wkStart, 6);

  // 1. Jour choisi
  if (di.isMatch) add(3, 'bad', 'Tu as placé la séance un jour de match.', 'Choisis un autre jour : la veille et le lendemain d’un match sont aussi à éviter pour les jambes.');
  else if (di.isVolley) add(1, 'warn', 'Ce jour-là tu as volley : séance de muscu + volley = fatigue cumulée.', 'Fais-la plutôt un jour sans volley, ou réduis le volume (4 à 5 exercices).');
  else ok('Le jour choisi est libre de volley et de match.');
  if (legSets > 0 && !di.legsOk) add(3, 'bad', `Il y a des jambes (${legSets} séries) alors que ce n’est pas le bon moment (${di.legsWhy}).`, 'Retire les exercices de jambes ou déplace la séance : des jambes fatiguées gênent le volley et augmentent le risque de blessure.');
  else if (legSets > 0) ok('Les jambes sont compatibles avec ton calendrier de volley et de match.');
  if (wk.matchInWeek && legSets > 6) add(1, 'warn', 'Semaine de match : beaucoup de séries de jambes.', 'Limite-toi à environ 6 séries de jambes cette semaine-là.');

  // 2. Récupération
  const before = entries.map(e => e.date).filter(d => d < iso).sort();
  const lastBefore = before.length ? before[before.length - 1] : null;
  const daysSince = lastBefore ? coachDaysBetween(lastBefore, iso) : null;
  const recentArenas = new Set(entries.filter(e => e.date < iso && coachDaysBetween(e.date, iso) <= 1).map(e => normalizeArenaGroup(e.quest.category, e.quest.type)));
  const sharedRecent = Object.keys(setsBy).filter(a => a !== 'Abdominaux' && recentArenas.has(a));
  if (entries.some(e => e.date === iso)) add(1, 'warn', 'Tu as déjà une séance de muscu enregistrée ce jour-là.', 'Évite d’empiler deux séances le même jour.');
  else if (daysSince !== null && daysSince <= 1) {
    if (sharedRecent.length) add(1, 'warn', 'Ta dernière séance de muscu date de moins de 48 h et touche les mêmes muscles.', 'Laisse au moins 2 jours entre deux séances sur les mêmes groupes (ACSM 2009 : 48 h de récupération).');
    else ok('Séance la veille, mais sur d’autres groupes musculaires : la récupération est correcte.');
  } else if (daysSince !== null) ok(`Bonne récupération : ${daysSince} jours depuis ta dernière séance.`);
  let overlapPen = 0;
  sharedRecent.forEach(a => {
    if (overlapPen < 1.5) {
      overlapPen += 0.75;
      add(0.75, 'warn', `${a} déjà travaillé il y a moins de 48 h.`, `Remplace ces exercices par un autre groupe, ou décale la séance.`);
    }
  });

  // 3. Nombre de séances dans la semaine
  const weekDays = new Set(entries.filter(e => e.date >= wkStart && e.date <= wkEnd && e.date !== iso).map(e => e.date));
  const cnt = weekDays.size + 1;
  if (cnt > 3) add(2, 'bad', `Ce serait ta ${cnt}e séance de muscu cette semaine, et tu veux 3 maximum.`, 'Reporte-la à la semaine suivante ou remplace-la par du cardio léger.');
  else if (cnt > coach.sessionsPerWeek) add(0.5, 'warn', `Ce serait ta ${cnt}e séance de la semaine (objectif : ${coach.sessionsPerWeek}).`, 'Pas grave si tu récupères bien, mais l’objectif de 2 séances est déjà une dose efficace (Spiering 2021).');
  else ok(`Séance n°${cnt} de la semaine : dans ton objectif.`);

  // 4. Couverture des groupes
  const weekArenas = new Set(entries.filter(e => e.date >= wkStart && e.date <= wkEnd && e.date !== iso).map(e => normalizeArenaGroup(e.quest.category, e.quest.type)));
  const sessType = session.type ? COACH_TYPES[session.type] : null;
  const core = ['Jambes', 'Dos', 'Pectoraux', 'Épaules & Bras'].filter(a => !sessType || sessType.arenas.includes(a));
  let covPen = 0;
  const missing = [];
  core.forEach(a => {
    if (setsBy[a]) return;
    if (a === 'Jambes' && !di.legsOk) return;
    if (weekArenas.has(a)) return;
    missing.push(a);
  });
  missing.forEach(a => {
    if (covPen < 2.25) { covPen += 0.75; add(0.75, 'warn', `Aucun exercice de ${a} dans cette séance (ni plus tôt cette semaine).`, `Ajoute un exercice de ${a}, ou prévois-le dans ta prochaine séance : chaque groupe gagne à être travaillé au moins 2 fois par semaine (Schoenfeld 2016).`); }
  });
  if (!missing.length) ok(sessType ? `La séance couvre bien le type « ${sessType.label} ».` : 'Tous les grands groupes sont couverts cette semaine.');
  if (!setsBy['Abdominaux'] && !weekArenas.has('Abdominaux')) add(0.25, 'info', 'Pas d’abdos cette semaine.', 'Un exercice de gainage ou d’abdos (2 à 3 séries) complète bien la séance et aide pour le volley.');

  // 5. Équilibre poussée / tirage
  const pecs = setsBy['Pectoraux'] || 0, back = setsBy['Dos'] || 0;
  if (pecs > 0 && back === 0) add(1, 'warn', 'Tu pousses (pectoraux) sans aucun exercice de tirage.', 'Ajoute un exercice de dos (tirage, rowing) : le volley sollicite déjà beaucoup les épaules, l’équilibre protège l’articulation (pratique courante, preuves limitées).');
  else if (pecs > 0 && back > 0) {
    const r = back / pecs;
    if (r < 0.5) add(0.5, 'warn', 'Beaucoup plus de poussée que de tirage.', 'Ajoute une série ou deux de dos.');
    else if (r > 2) add(0.5, 'info', 'Beaucoup plus de tirage que de poussée.', 'Ajoute un peu de pectoraux ou d’épaules.');
    else ok('Poussée et tirage équilibrés.');
  }

  // 6. Volume et durée
  if (total < 6) add(1.5, 'warn', `Séance très courte (${total} séries).`, 'Vise au moins 8 à 12 séries au total pour que la séance compte.');
  else if (total > 24) add(1.5, 'warn', `Séance très longue (${total} séries).`, 'Au-delà d’environ 20 séries, la qualité baisse : retire les exercices les moins utiles.');
  else if (total > 18) add(0.5, 'info', `Séance chargée (${total} séries).`, 'Surveille ta fatigue et ta durée.');
  else ok(`Volume raisonnable (${total} séries).`);
  Object.keys(setsBy).forEach(a => {
    if (setsBy[a] > 10) add(0.75, 'warn', `${setsBy[a]} séries sur ${a} dans une seule séance.`, 'Au-delà de 10 séries par groupe dans une séance, le gain supplémentaire est faible : répartis sur une autre séance.');
  });
  const tgt = Number(coach.sessionMinutes) || 0;
  if (tgt && session.estMin < tgt - 12) add(1, 'warn', `Durée estimée de ${session.estMin} min, alors que tu veux environ ${tgt} min.`, 'Ajoute une série sur tes gros exercices ou un exercice pour un groupe peu travaillé : la séance vaut mieux le déplacement.');
  else if (tgt && session.estMin < tgt - 6) add(0.5, 'info', `Durée estimée de ${session.estMin} min (objectif ${tgt} min).`, 'Il te manque quelques minutes : une série ou un exercice en plus suffit.');
  else if (tgt) ok(`Durée estimée de ${session.estMin} min : proche de ton objectif de ${tgt} min.`);
  if (session.estMin > Math.max(90, tgt + 20)) add(1, 'warn', `Durée estimée de ${session.estMin} min.`, 'C’est long à tenir : réduis le nombre d’exercices ou de séries.');
  else if (!tgt && session.estMin > 75) add(0.5, 'info', `Durée estimée de ${session.estMin} min.`, 'Prévois du temps pour les repos.');
  if (ex.length > 9) add(1, 'warn', `${ex.length} exercices : c’est beaucoup.`, 'Garde 5 à 8 exercices bien faits plutôt que 10 survolés.');

  // 7. Ordre des exercices
  const firstCompound = ex.findIndex(e => e.compound);
  const isoBeforeCompound = ex.some((e, i) => !e.compound && e.arena !== 'Abdominaux' && ex.slice(i + 1).some(x => x.compound));
  if (firstCompound >= 0 && isoBeforeCompound) add(0.5, 'info', 'Des exercices d’isolation passent avant des exercices polyarticulaires.', 'Commence par les gros mouvements (squat, développé, rowing) quand tu es frais.');

  // 8. Progression
  const downs = ex.filter(e => e.change === 'down' || e.change === 'resume');
  if (downs.length) items.push({ level: 'info', text: `${downs.map(e => e.name).join(', ')} : le coach te fait reculer légèrement pour consolider.`, fix: '' });

  score = Math.max(1, Math.min(10, Math.round(score * 2) / 2));
  const label = score >= 9 ? 'Excellente' : score >= 7.5 ? 'Bonne' : score >= 6 ? 'Correcte' : score >= 4 ? 'À améliorer' : 'À revoir';
  const order = { bad: 0, warn: 1, info: 2, ok: 3 };
  items.sort((a, b) => order[a.level] - order[b.level]);
  return { score, label, items };
}
