import { useEffect, useState } from 'react';
import { COACH_CHANGE_BADGES, coachFmt } from '../coach/labels';

// Séance guidée : exercice par exercice, avec repos automatique
export function GuidedSession({ g, setG, onFinish, onMinimize, onCancel }) {
  const [now, setNow] = useState(Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    let lock = null;
    const req = async () => { try { if (navigator.wakeLock) lock = await navigator.wakeLock.request('screen'); } catch (e) {} };
    req();
    const onVis = () => { if (document.visibilityState === 'visible') req(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      try { lock && lock.release(); } catch (e) {}
    };
  }, []);

  const elapsed = Math.max(0, Math.floor((now - g.startedAt) / 1000));
  const fmtT = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const items = g.items;
  const it = items[g.idx];
  const d = it ? g.data[it.questId] : null;
  const patch = (qid, p) => setG(prev => ({ ...prev, data: { ...prev.data, [qid]: { ...prev.data[qid], ...p } } }));
  const startRest = sec => { try { window.dispatchEvent(new CustomEvent('rondoufit-rest', { detail: sec })); } catch (e) {} };

  const toggleSet = i => {
    const wasDone = d.done[i];
    const done = d.done.map((x, k) => (k === i ? !x : x));
    patch(it.questId, { done });
    if (!wasDone) {
      const isLastSet = i === d.done.length - 1;
      const isLastEx = g.idx === items.length - 1;
      if (!(isLastSet && isLastEx)) startRest(it.restSec);
    }
  };
  const [sw, setSw] = useState(null);
  const toggleSw = i => {
    if (sw && sw.i === i) {
      const sec = Math.max(1, Math.round((Date.now() - sw.start) / 1000));
      patch(it.questId, { reps: d.reps.map((r, k) => (k === i ? sec : r)) });
      setSw(null);
    } else setSw({ i, start: Date.now() });
  };
  const setReps = (i, v) => patch(it.questId, { reps: d.reps.map((r, k) => (k === i ? Math.max(0, v) : r)) });
  const addSet = () => patch(it.questId, { reps: [...d.reps, d.reps[d.reps.length - 1] || it.goalReps], done: [...d.done, false] });
  const removeSet = () => { if (d.reps.length > 1) patch(it.questId, { reps: d.reps.slice(0, -1), done: d.done.slice(0, -1) }); };
  const goto = idx => { setSw(null); setG(prev => ({ ...prev, idx: Math.max(0, Math.min(items.length - 1, idx)), phase: 'run' })); };
  const doneCount = it ? d.done.filter(Boolean).length : 0;
  const step = it && it.kind === 'load' ? (it.equip === 'Haltères' ? (d.load < 10 ? 1 : 2) : d.load < 10 ? 1 : 2.5) : 2.5;

  const RPE_LABELS = { 6: 'Facile', 7: 'Modéré', 8: 'Dur', 9: 'Très dur', 10: 'Maximum' };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-pink-300 font-black uppercase tracking-wider">Séance guidée {g.templateId ? `· ${g.templateId}` : ''}</p>
            <p className="text-xs text-slate-400">⏱ {fmtT(elapsed)} · {g.phase === 'summary' ? 'Résumé' : `Exercice ${g.idx + 1}/${items.length}`}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onMinimize} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold">Réduire</button>
            <button onClick={() => setConfirmCancel(true)} className="px-3 py-2 rounded-lg bg-rose-900/60 text-rose-200 text-xs font-bold">Abandonner</button>
          </div>
        </div>

        <div className="flex gap-1">
          {items.map((x, i) => {
            const dn = g.data[x.questId].done.filter(Boolean).length;
            return (
              <button key={x.questId} onClick={() => goto(i)} title={x.name}
                className={`flex-1 h-2 rounded-full ${g.phase === 'run' && i === g.idx ? 'bg-pink-500' : dn > 0 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            );
          })}
        </div>

        {confirmCancel && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-sm text-rose-100 space-y-2">
            <p>Abandonner la séance ? Rien ne sera enregistré.</p>
            <div className="flex gap-2">
              <button onClick={onCancel} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs">Oui, abandonner</button>
              <button onClick={() => setConfirmCancel(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-bold text-xs">Continuer</button>
            </div>
          </div>
        )}

        {g.phase === 'run' && it && d && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-white">{it.icon} {it.name}</h2>
                <p className="text-xs text-slate-400">{it.arena} · repos {Math.floor(it.restSec / 60)} min{it.restSec % 60 ? ` ${it.restSec % 60}` : ''}</p>
              </div>
              {(() => { const b = COACH_CHANGE_BADGES[it.change] || COACH_CHANGE_BADGES.new; return <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold ${b[2]}`}>{b[0]} {b[1]}</span>; })()}
            </div>
            <p className="text-[11px] text-slate-400">{it.reason}</p>
            {g.idx === 0 && g.warmup && <p className="text-[11px] text-amber-200 bg-amber-950/30 border border-amber-500/30 rounded-lg p-2">🔥 {g.warmup}</p>}

            {it.kind === 'load' && (
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-sm font-bold text-slate-300">Charge</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => patch(it.questId, { load: Math.max(0, Math.round((d.load - step) * 100) / 100) })} className="w-10 h-10 rounded-lg bg-slate-800 text-white text-xl font-black">−</button>
                  <input type="number" step="0.5" value={d.load} onChange={e => patch(it.questId, { load: Number(e.target.value) || 0 })} className="w-24 text-center bg-slate-950 border border-slate-700 rounded-lg py-2 text-xl font-black text-pink-300" />
                  <button onClick={() => patch(it.questId, { load: Math.round((d.load + step) * 100) / 100 })} className="w-10 h-10 rounded-lg bg-slate-800 text-white text-xl font-black">+</button>
                  <span className="text-sm text-slate-400">kg</span>
                </div>
              </div>
            )}
            {it.kind === 'assisted' && (
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-sm font-bold text-slate-300">Aide élastique</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => patch(it.questId, { assist: Math.max(0, d.assist - 2.5) })} className="w-10 h-10 rounded-lg bg-slate-800 text-white text-xl font-black">−</button>
                  <input type="number" step="2.5" value={d.assist} onChange={e => patch(it.questId, { assist: Math.max(0, Number(e.target.value) || 0) })} className="w-24 text-center bg-slate-950 border border-slate-700 rounded-lg py-2 text-xl font-black text-pink-300" />
                  <button onClick={() => patch(it.questId, { assist: d.assist + 2.5 })} className="w-10 h-10 rounded-lg bg-slate-800 text-white text-xl font-black">+</button>
                  <span className="text-sm text-slate-400">kg</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {d.reps.map((r, i) => (
                <div key={i} className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 ${d.done[i] ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div>
                    <p className="text-sm font-black text-white">Série {i + 1}</p>
                    <p className="text-[10px] text-slate-500">objectif {it.targetReps[i] !== undefined ? it.targetReps[i] : it.goalReps} {it.timed ? 's' : 'reps'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setReps(i, (Number(r) || 0) - (it.timed ? 5 : 1))} className="w-9 h-9 rounded-lg bg-slate-800 text-white text-lg font-black">−</button>
                    <input type="number" value={r} onChange={e => setReps(i, Number(e.target.value) || 0)} className="w-14 text-center bg-slate-950 border border-slate-700 rounded-lg py-1.5 text-lg font-black text-white" />
                    <button onClick={() => setReps(i, (Number(r) || 0) + (it.timed ? 5 : 1))} className="w-9 h-9 rounded-lg bg-slate-800 text-white text-lg font-black">+</button>
                    {it.timed && (
                      <button onClick={() => toggleSw(i)} className={`px-2 h-9 rounded-lg text-xs font-black ${sw && sw.i === i ? 'bg-rose-600 text-white' : 'bg-cyan-700 text-white'}`}>
                        {sw && sw.i === i ? `■ ${Math.max(0, Math.round((now - sw.start) / 1000))} s` : '⏱ Chrono'}
                      </button>
                    )}
                  </div>
                  <button onClick={() => toggleSet(i)} className={`px-3 py-2 rounded-lg text-sm font-black ${d.done[i] ? 'bg-emerald-600 text-white' : 'bg-pink-600 text-white'}`}>
                    {d.done[i] ? '✔ Faite' : 'Faite'}
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={addSet} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold">+ Série</button>
                <button onClick={removeSet} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold">− Série</button>
              </div>
              <p className="text-[11px] text-slate-500">« Faite » lance automatiquement le chrono de repos (bouton en bas à droite).</p>
            </div>
          </div>
        )}

        {g.phase === 'summary' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-lg font-black text-white">Résumé de la séance</h2>
            {items.map(x => {
              const dd = g.data[x.questId];
              const reps = dd.reps.filter((r, i) => dd.done[i]);
              return (
                <div key={x.questId} className="flex items-center justify-between gap-2 text-sm bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <span className="font-bold text-white truncate">{x.icon} {x.name}</span>
                  <span className={reps.length ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                    {reps.length ? `${reps.join(' - ')} ${x.timed ? 's' : 'reps'}${x.kind === 'load' ? ` · ${coachFmt(dd.load)} kg` : x.kind === 'assisted' ? ` · aide ${coachFmt(dd.assist)} kg` : ''}` : 'passé'}
                  </span>
                </div>
              );
            })}
            <div>
              <p className="text-xs font-bold text-slate-300 mb-1.5">Ressenti global de la séance (RPE)</p>
              <div className="grid grid-cols-5 gap-1.5">
                {[6, 7, 8, 9, 10].map(n => (
                  <button key={n} onClick={() => setG(prev => ({ ...prev, rpe: n }))}
                    className={`py-2 rounded-lg text-xs font-black border ${g.rpe === n ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-950 border-slate-700 text-slate-300'}`}>
                    {n}<span className="block text-[9px] font-semibold">{RPE_LABELS[n]}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Le coach s’en sert : si la séance était très dure, il consolide au lieu d’augmenter.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => goto(items.length - 1)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm">Retour</button>
              <button onClick={() => onFinish(g)} className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm">Enregistrer la séance</button>
            </div>
          </div>
        )}
      </div>

      {g.phase === 'run' && it && (
        <div className="fixed bottom-0 inset-x-0 z-[61] bg-slate-950/95 border-t border-slate-800 px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-2">
            <button onClick={() => goto(g.idx - 1)} disabled={g.idx === 0} className="px-4 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm disabled:opacity-40">◀</button>
            <button onClick={() => goto(g.idx + 1)} className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Passer</button>
            <button
              onClick={() => (g.idx === items.length - 1 ? setG(prev => ({ ...prev, phase: 'summary' })) : goto(g.idx + 1))}
              className="flex-1 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-sm"
            >
              {g.idx === items.length - 1 ? 'Terminer ▶ Résumé' : `Exercice suivant ▶ (${doneCount}/${d.reps.length} séries)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
