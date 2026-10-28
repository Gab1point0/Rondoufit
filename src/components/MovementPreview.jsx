import { useEffect, useRef, useState } from 'react';
import { Figure } from '../anim/Figure';
import { animatedList, animationIdFor, movementFor } from '../anim/resolve';
import { phaseToU, poseAt } from '../anim/skeleton';

const CYCLE_MS = 5200;
const LIST = animatedList();

function Bullets({ title, items, tone = 'text-slate-300' }) {
  if (!items || !items.length) return null;
  return (
    <section className="space-y-1">
      <h4 className="text-[0.75rem] font-black uppercase tracking-wider text-pink-300">{title}</h4>
      <ul className={`space-y-1 text-xs ${tone} list-disc pl-4`}>
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </section>
  );
}

// Fenêtre « Voir le mouvement » : animation du geste, trajet à respecter, installation / machine, erreurs à éviter.
// S'ouvre par l'événement `rondoufit-movement` (lib/movement.js).
export function MovementPreview() {
  const [target, setTarget] = useState(null);
  const [id, setId] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState(0);
  const last = useRef(0);

  useEffect(() => {
    const h = e => {
      const t = e.detail || {};
      setTarget(t);
      setId(animationIdFor(t));
      setPhase(0);
      const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setPlaying(!reduced);
    };
    window.addEventListener('rondoufit-movement', h);
    return () => window.removeEventListener('rondoufit-movement', h);
  }, []);

  const mv = id ? movementFor(id) : null;

  useEffect(() => {
    if (!target || !playing || !mv) return undefined;
    let raf;
    last.current = 0;
    const tick = t => {
      if (last.current) setPhase(p => (p + ((t - last.current) / CYCLE_MS) * speed) % 1);
      last.current = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, playing, speed, mv]);

  if (!target) return null;
  const close = () => setTarget(null);
  const scene = mv && mv.scene;
  const u = scene ? phaseToU(phase, scene.loop) : 0;
  const info = mv && mv.info;
  const labels = info ? info.p : ['Effort', 'Retour'];
  const goingForward = scene && scene.loop === 'cycle' ? true : phase < 0.5;
  const phaseLabel = goingForward ? labels[0] : labels[1];

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-sm flex p-4 pt-20 pb-24 sm:py-4 overflow-y-auto" onClick={close}>
      <div className="m-auto bg-slate-900 border border-sky-500/40 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-3" onClick={e => e.stopPropagation()} role="dialog" aria-label="Voir le mouvement">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white">🎬 {mv ? mv.name : target.name || 'Exercice'}</h3>
            {mv && <p className="text-[0.75rem] text-slate-400">{mv.category}{mv.equip ? ` · ${mv.equip}` : ''}</p>}
          </div>
          <button type="button" onClick={close} aria-label="Fermer" className="shrink-0 w-9 h-9 rounded-lg bg-slate-800 text-slate-300 font-black">✕</button>
        </div>

        {mv ? (
          <>
            <div className="rounded-xl overflow-hidden border border-slate-800">
              <Figure scene={scene} pose={poseAt(scene.keys, u)} />
            </div>
            <p className="text-center text-sm font-black text-amber-300" aria-live="polite">{phaseLabel}</p>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPlaying(p => !p)} className="px-3 py-2 rounded-xl bg-sky-600 text-white text-sm font-black">{playing ? '⏸ Pause' : '▶ Lecture'}</button>
              <button type="button" onClick={() => setSpeed(s => (s === 1 ? 0.5 : 1))} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 text-sm font-bold">🐢 {speed === 0.5 ? 'Lent ✔' : 'Lent'}</button>
              <input
                type="range" min="0" max="100" value={Math.round(u * 100)} aria-label="Position dans le mouvement"
                onChange={e => { setPlaying(false); const v = Number(e.target.value) / 100; setPhase(scene.loop === 'cycle' ? v * 0.999 : v / 2); }}
                className="flex-1 accent-sky-400"
              />
            </div>
            <p className="text-[0.75rem] text-slate-500">Pointillés jaunes : trajet à respecter (le cercle est le départ, la flèche le sens de l’effort). Fais glisser la barre pour voir chaque position.</p>

            {info ? (
              <div className="space-y-3 pt-1">
                <section className="space-y-1">
                  <h4 className="text-[0.75rem] font-black uppercase tracking-wider text-pink-300">Muscles travaillés</h4>
                  <p className="text-xs text-slate-300">{info.m}</p>
                </section>
                <Bullets title="Installation et matériel" items={[...(info.s || []), ...mv.equipTips]} />
                <Bullets title="Le mouvement" items={info.g} />
                <Bullets title="Respiration et rythme" items={info.hold ? ['Respire calmement, sans bloquer.', 'Tiens la position sans te raidir.'] : ['Expire pendant l’effort, inspire pendant le retour.', 'Descends (ou reviens) en 2 à 3 secondes, monte en 1 à 2 secondes.']} />
                <Bullets title="Erreurs à éviter" items={info.e} tone="text-rose-200" />
                {info.safe && <p className="text-xs text-amber-200 bg-amber-950/30 border border-amber-500/30 rounded-lg p-2">⚠️ {info.safe}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Pas encore de conseils écrits pour cet exercice.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-300">Cet exercice personnalisé n’a pas d’animation. Choisis un exercice proche dans la liste ci-dessous pour voir le geste.</p>
        )}

        <div className="pt-1">
          <label className="block text-[0.75rem] font-bold text-slate-400 mb-1" htmlFor="mv-select">Voir un autre exercice</label>
          <select id="mv-select" value={id || ''} onChange={e => { setId(e.target.value || null); setPhase(0); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white">
            <option value="">Choisir…</option>
            {LIST.map(x => <option key={x.id} value={x.id}>{x.category} · {x.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
