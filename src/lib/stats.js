import { ARENA_GROUPS, normalizeArenaGroup } from '../data/arenas';
import { addDaysISO, toLocalISODate } from './dates';
import { entryKm, entryReps, entryVolume, getAllEntries, isRunQuest, isStartEntry, isTimedQuest, isVolleyQuest, repUnit } from './quests';

// Série en cours : jours consécutifs avec séance (jusqu'à aujourd'hui, ou hier si rien aujourd'hui)
export function computeCurrentStreak(quests) {
  const days = new Set();
  (quests || []).forEach(q =>
    (q.history || []).forEach(h => {
      if (h.date && !String(h.note || '').startsWith('Point de départ')) days.add(h.date);
    })
  );
  const d = new Date();
  if (!days.has(toLocalISODate(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(toLocalISODate(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

export function computeWeekStats(entries, weekStart) {
  const end = addDaysISO(weekStart, 6);
  const wk = entries.filter(e => e.date >= weekStart && e.date <= end);
  return {
    sessions: wk.length,
    days: new Set(wk.map(e => e.date)).size,
    kcal: wk.reduce((s, e) => s + (Number(e.calories) || 0), 0),
    km: Math.round(wk.reduce((s, e) => s + entryKm(e), 0) * 10) / 10,
    volume: Math.round(wk.reduce((s, e) => s + entryVolume(e), 0)),
    reps: wk.reduce((s, e) => s + entryReps(e), 0),
    arenas: new Set(wk.map(e => normalizeArenaGroup(e.quest.category || '', e.quest.type))).size,
    volley: wk.filter(e => isVolleyQuest(e.quest)).length
  };
}

export function computePersonalRecords(state) {
  const out = [];
  (state.quests || []).forEach(q => {
    const es = (q.history || []).filter(h => !isStartEntry(h));
    if (!es.length) return;
    const pick = get => es.reduce((b, h) => { const v = get(h); return b === null || v > b.v ? { v, date: h.date } : b; }, null);
    const recs = [];
    if (q.type === 'cardio') {
      const m = pick(h => Number(h.value) || 0);
      recs.push({ key: `${q.id}:main`, label: q.unit === 'km' ? 'Plus longue distance' : 'Plus longue durée', text: `${m.v} ${q.unit}`, score: m.v, date: m.date });
    } else {
      const setMax = h => (Array.isArray(h.setDetails) ? Math.max(0, ...h.setDetails.map(Number)) : Number(h.reps) || 0);
      if (q.unit === 'kg') {
        const k = pick(h => Number(h.value) || 0);
        recs.push({ key: `${q.id}:kg`, label: 'Charge max', text: `${k.v} kg`, score: k.v, date: k.date });
      }
      const r = pick(setMax);
      recs.push({ key: `${q.id}:reps`, label: isTimedQuest(q) ? 'Plus longue série' : 'Meilleure série', text: `${r.v} ${repUnit(q)}`, score: r.v, date: r.date });
      if (q.unit === 'reps' && !isTimedQuest(q)) {
        const wa = es.filter(h => h.assistanceKg !== undefined && h.assistanceKg !== null);
        if (wa.length) {
          const m = wa.reduce((b, h) => (Number(h.assistanceKg) < Number(b.assistanceKg) ? h : b));
          recs.push({ key: `${q.id}:assist`, label: 'Aide minimale', text: Number(m.assistanceKg) === 0 ? 'Strict (0 kg)' : `${m.assistanceKg} kg d’aide`, score: -Number(m.assistanceKg), date: m.date });
        }
      }
    }
    out.push({ id: q.id, name: q.name, icon: q.icon, recs });
  });
  return out;
}

export function computeAchievementStats(state) {
  const entries = getAllEntries(state);
  const perDay = {};
  entries.forEach(e => { if (e.date) (perDay[e.date] = perDay[e.date] || new Set()).add(e.quest.id); });
  let run = 0, bestRun = 0, prev = null;
  Object.keys(perDay).sort().forEach(d => {
    const t = Date.parse(d + 'T00:00:00Z');
    run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    prev = t;
    if (run > bestRun) bestRun = run;
  });
  const arenaIds = ARENA_GROUPS.map(g => g.id);
  return {
    sessions: entries.length,
    kcal: entries.reduce((s, e) => s + (Number(e.calories) || 0), 0),
    maxPerDay: Math.max(0, ...Object.values(perDay).map(x => x.size)),
    bestRun,
    arenaCount: new Set(entries.map(e => normalizeArenaGroup(e.quest.category || '', e.quest.type)).filter(a => arenaIds.includes(a))).size,
    lost: Math.max(0, (Number(state.startWeightKg) || 0) - (Number(state.userWeightKg) || 0)),
    runKm: Math.round(entries.filter(e => e.quest.type === 'cardio' && isRunQuest(e.quest)).reduce((s, e) => s + entryKm(e), 0) * 10) / 10,
    sunday: entries.some(e => e.date && new Date(e.date + 'T00:00:00').getDay() === 0),
    volley: entries.some(e => isVolleyQuest(e.quest))
  };
}

export const ACH_PROGRESS = {
  veteran_20: { key: 'sessions', max: 20 }, calorie_furnace: { key: 'kcal', max: 1000 }, calorie_inferno: { key: 'kcal', max: 5000 },
  polyvalent: { key: 'arenaCount', max: 4 }, all_arenas: { key: 'arenaCount', max: 7 }, triple_combo: { key: 'maxPerDay', max: 3 },
  streak_3: { key: 'bestRun', max: 3 }, weight_loss_5: { key: 'lost', max: 5 }, marathon_km: { key: 'runKm', max: 42.2 }
};

// Trophées calculés automatiquement à partir de l’historique (rétroactifs)
export function computeDerivedAchievements(state) {
  const st = computeAchievementStats(state);
  const met = [];
  if (st.volley) met.push('volley_rookie');
  if (st.maxPerDay >= 3) met.push('triple_combo');
  if (st.bestRun >= 3) met.push('streak_3');
  if (st.arenaCount >= 4) met.push('polyvalent');
  if (st.sessions >= 20) met.push('veteran_20');
  if (st.kcal >= 5000) met.push('calorie_inferno');
  if (st.lost >= 5) met.push('weight_loss_5');
  if (st.sunday) met.push('sunday_warrior');
  if (st.runKm >= 42.2) met.push('marathon_km');
  if (st.arenaCount >= ARENA_GROUPS.length) met.push('all_arenas');
  return met;
}
