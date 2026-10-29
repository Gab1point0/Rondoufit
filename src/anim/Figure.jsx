import { musclesOf } from './muscles';
import { ik, SEG, solveFront, solvePose, tracePath, traceFront, SHOULDER_HALF, HIP_HALF } from './skeleton';

// Dessin SVG d'une scène à un instant donné : décor (machine, banc…), silhouette, charge, trajet.
// scene = { keys:[poses], trace:'wrist'|'ankle'|…, equip:[éléments fixes], follow:[éléments liés au corps] }
// Éléments fixes : pad, rect, circle, line, stack, pulley, post · liés : plate, db, handle, cable, lever, ball

const C = {
  frame: '#475569', frameDark: '#334155', pad: '#64748b', plate: '#94a3b8', plateIn: '#cbd5e1',
  body: '#f9a8d4', bodyFar: '#9d4f78', head: '#fbcfe8', trace: '#fbbf24', ground: '#1e293b', cable: '#cbd5e1', accent: '#38bdf8',
};

const Pt = ({ p, r = 3, fill }) => <circle cx={p[0]} cy={p[1]} r={r} fill={fill} />;

function Fixed({ e, i }) {
  switch (e.k) {
    case 'pad': return <line key={i} x1={e.a[0]} y1={e.a[1]} x2={e.b[0]} y2={e.b[1]} stroke={e.dark ? C.frameDark : C.pad} strokeWidth={e.w || 9} strokeLinecap="round" />;
    case 'line': return <line key={i} x1={e.a[0]} y1={e.a[1]} x2={e.b[0]} y2={e.b[1]} stroke={e.c || C.frame} strokeWidth={e.w || 3} strokeLinecap="round" strokeDasharray={e.dash} />;
    case 'rect': return <rect key={i} x={e.x} y={e.y} width={e.w} height={e.h} rx={e.r === undefined ? 2 : e.r} fill={e.c || C.frame} opacity={e.o || 1} />;
    case 'circle': return <circle key={i} cx={e.c[0]} cy={e.c[1]} r={e.r} fill={e.fill || 'none'} stroke={e.stroke || C.frame} strokeWidth={e.w || 2} />;
    case 'pulley': return <g key={i}><circle cx={e.c[0]} cy={e.c[1]} r={e.r || 6} fill={C.frameDark} stroke={C.plate} strokeWidth="2" /><circle cx={e.c[0]} cy={e.c[1]} r="1.6" fill={C.plateIn} /></g>;
    case 'stack': {
      const n = e.n || 8; const hh = e.h / n;
      return (
        <g key={i}>
          <rect x={e.x - 2} y={e.y - 3} width={e.w + 4} height={e.h + 6} rx="3" fill="none" stroke={C.frame} strokeWidth="2" />
          {Array.from({ length: n }, (_, k) => <rect key={k} x={e.x + 1} y={e.y + k * hh + 1} width={e.w - 2} height={hh - 2} rx="1.5" fill={k === (e.sel === undefined ? 2 : e.sel) ? C.accent : C.frameDark} />)}
        </g>
      );
    }
    case 'text': return <text key={i} x={e.p[0]} y={e.p[1]} fontSize={e.s || 9} fill={e.c || '#94a3b8'} textAnchor={e.anchor || 'start'} fontWeight="700">{e.t}</text>;
    default: return null;
  }
}

function Follow({ e, j, i }) {
  const p0 = j[e.at || 'wrist'] || j.wrist;
  const p = e.k === 'padAt' ? p0 : [p0[0] + (e.dx || 0), p0[1] + (e.dy || 0)];
  switch (e.k) {
    case 'plate': return <g key={i} opacity="0.88"><circle cx={p[0]} cy={p[1]} r={e.r || 13} fill={C.plate} stroke={C.plateIn} strokeWidth="2" /><circle cx={p[0]} cy={p[1]} r="3.2" fill="#1e293b" /></g>;
    case 'db': return <g key={i}><circle cx={p[0]} cy={p[1]} r={e.r || 7} fill={C.plate} stroke={C.plateIn} strokeWidth="1.5" /><circle cx={p[0]} cy={p[1]} r="2" fill="#1e293b" /></g>;
    case 'ball': return <circle key={i} cx={p[0]} cy={p[1]} r={e.r || 10} fill="#f59e0b" stroke="#fde68a" strokeWidth="2" />;
    case 'handle': return <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={C.plateIn} />;
    case 'cable': return <line key={i} x1={e.from[0]} y1={e.from[1]} x2={p[0]} y2={p[1]} stroke={C.cable} strokeWidth="1.6" strokeDasharray={e.dash} />;
    case 'lever': return <g key={i}><line x1={e.pivot[0]} y1={e.pivot[1]} x2={p[0]} y2={p[1]} stroke={C.pad} strokeWidth={e.w || 7} strokeLinecap="round" /><circle cx={e.pivot[0]} cy={e.pivot[1]} r="4" fill={C.frameDark} stroke={C.plate} strokeWidth="1.5" /></g>;
    case 'seg': { const a = j[e.a]; const b = j[e.b]; return <line key={i} x1={a[0] + (e.dx || 0)} y1={a[1] + (e.dy || 0)} x2={b[0] + (e.dx || 0)} y2={b[1] + (e.dy || 0)} stroke={e.c || C.pad} strokeWidth={e.w || 9} strokeLinecap="round" />; }
    case 'padAt': return <rect key={i} x={p[0] + (e.dx || 0)} y={p[1] + (e.dy || 0)} width={e.w || 20} height={e.h || 6} rx="3" fill={C.pad} />;
    case 'bar': return <line key={i} x1={e.a[0]} y1={e.a[1]} x2={e.b[0]} y2={e.b[1]} stroke={C.plate} strokeWidth="3" />;
    default: return null;
  }
}

function Limb({ pts, w, c, o = 1 }) {
  return <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />;
}

/** Membre qui s'affine (cuisse large → cheville fine), bouts arrondis. */
function Taper({ a, b, ra, rb, c, o = 1 }) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts = [[a[0] + nx * ra, a[1] + ny * ra], [b[0] + nx * rb, b[1] + ny * rb], [b[0] - nx * rb, b[1] - ny * rb], [a[0] - nx * ra, a[1] - ny * ra]];
  return (
    <g fill={c} opacity={o}>
      <polygon points={pts.map(p => p.join(',')).join(' ')} />
      <circle cx={a[0]} cy={a[1]} r={ra} />
      <circle cx={b[0]} cy={b[1]} r={rb} />
    </g>
  );
}

const MUSCLE = '#f43f5e';
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pulse = lvl => `${(0.18 + 0.28 * lvl).toFixed(2)};${(0.34 + 0.5 * lvl).toFixed(2)};${(0.18 + 0.28 * lvl).toFixed(2)}`;

/** Zone musculaire qui bat doucement : segment (a → b) ou rond (a seul). */
function Hot({ a, b, w, lvl }) {
  return b
    ? <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={MUSCLE} strokeWidth={w} strokeLinecap="round" opacity="0.4"><animate attributeName="opacity" values={pulse(lvl)} dur="1.6s" repeatCount="indefinite" /></line>
    : <circle cx={a[0]} cy={a[1]} r={w} fill={MUSCLE} opacity="0.4"><animate attributeName="opacity" values={pulse(lvl)} dur="1.6s" repeatCount="indefinite" /></circle>;
}

function sideMuscles(j, muscles) {
  const out = [];
  muscles.forEach(({ z, lvl }) => {
    const k = z;
    if (z === 'chest' || z === 'back') out.push(<Hot key={k} a={mix(j.hip, j.shoulder, 0.42)} b={mix(j.hip, j.shoulder, 0.98)} w={13} lvl={lvl} />);
    if (z === 'core') out.push(<Hot key={k} a={mix(j.hip, j.shoulder, 0.04)} b={mix(j.hip, j.shoulder, 0.5)} w={12} lvl={lvl} />);
    if (z === 'shoulder') out.push(<Hot key={k} a={j.shoulder} w={8} lvl={lvl} />);
    if (z === 'biceps' || z === 'triceps') out.push(<Hot key={k} a={j.shoulder} b={j.elbow} w={8} lvl={lvl} />);
    if (z === 'forearm') out.push(<Hot key={k} a={j.elbow} b={j.wrist} w={6} lvl={lvl} />);
    if (z === 'glutes') out.push(<Hot key={k} a={j.hip} w={9} lvl={lvl} />);
    if (z === 'quads' || z === 'hams') out.push(<Hot key={k} a={j.hip} b={j.knee} w={11} lvl={lvl} />);
    if (z === 'calves') out.push(<Hot key={k} a={j.knee} b={j.ankle} w={8} lvl={lvl} />);
  });
  return out;
}

function frontMuscles(f, muscles) {
  const out = [];
  const midY = (f.sy + f.hy) / 2;
  muscles.forEach(({ z, lvl }) => {
    if (z === 'chest') out.push(<Hot key={z} a={[f.c, f.sy + 6]} b={[f.c, midY]} w={20} lvl={lvl} />);
    if (z === 'back') out.push(<Hot key={z} a={[f.c, f.sy + 6]} b={[f.c, f.hy - 4]} w={20} lvl={lvl} />);
    if (z === 'core') out.push(<Hot key={z} a={[f.c, midY]} b={[f.c, f.hy - 2]} w={15} lvl={lvl} />);
    [f.L, f.R].forEach((sd, k) => {
      const id = z + k;
      if (z === 'shoulder') out.push(<Hot key={id} a={sd.shoulder} w={8} lvl={lvl} />);
      if (z === 'biceps' || z === 'triceps') out.push(<Hot key={id} a={sd.shoulder} b={sd.elbow} w={8} lvl={lvl} />);
      if (z === 'forearm') out.push(<Hot key={id} a={sd.elbow} b={sd.wrist} w={6} lvl={lvl} />);
      if (z === 'glutes') out.push(<Hot key={id} a={sd.hip} w={9} lvl={lvl} />);
      if (z === 'quads' || z === 'hams') out.push(<Hot key={id} a={sd.hip} b={sd.knee} w={10} lvl={lvl} />);
      if (z === 'calves') out.push(<Hot key={id} a={sd.knee} b={sd.ankle} w={7} lvl={lvl} />);
    });
  });
  return out;
}

/** Tête de profil : calotte de cheveux du côté du haut du crâne, œil du côté du regard (le buste donne l'orientation). */
function Head({ c, up }) {
  const ang = (Math.atan2(up[1], up[0]) * 180) / Math.PI;
  return (
    <g transform={`translate(${c[0]},${c[1]}) rotate(${ang + 90})`}>
      <circle r="10" fill={C.head} />
      <path d="M-9.4 -3.5 A10 10 0 0 1 9.4 -3.5 Q0 -6.5 -9.4 -3.5 Z" fill="#7c3a5a" />
      <circle cx="4.6" cy="-0.5" r="1.4" fill="#4a1d3a" />
    </g>
  );
}

function FrontFigure({ scene, pose, showTrace, muscles = [] }) {
  const f = solveFront(pose);
  const traces = showTrace && scene.trace !== false ? traceFront(scene.keys, scene.trace || 'wrist') : null;
  const sides = [f.L, f.R];
  const pol = p => p.map(q => q.join(',')).join(' ');
  return (
    <svg viewBox={(scene.box || [0, -24, 320, 244]).join(" ")} className="w-full h-auto select-none" role="img" aria-label={scene.title || 'Animation du mouvement'}>
      <rect x="-200" y="-200" width="800" height="800" fill="#0b1220" />
      <line x1="0" y1="200" x2="320" y2="200" stroke={C.ground} strokeWidth="3" />
      <ellipse cx={f.c} cy="201" rx="46" ry="3.2" fill="#000" opacity="0.28" />
      {(scene.equip || []).map((e, i) => <Fixed key={i} e={e} i={i} />)}
      {traces && traces.map((tr, k) => (
        <polyline key={k} points={pol(tr)} fill="none" stroke={C.trace} strokeWidth="2" strokeDasharray="4 4" opacity="0.9" />
      ))}
      {traces && traces.map((tr, k) => <circle key={'s' + k} cx={tr[0][0]} cy={tr[0][1]} r="3" fill="none" stroke={C.trace} strokeWidth="1.5" />)}
      {traces && traces.map((tr, k) => {
        const a = tr[tr.length - 1]; const b = tr[tr.length - 4];
        const ang = (Math.atan2(a[1] - b[1], a[0] - b[0]) * 180) / Math.PI;
        return <polygon key={'a' + k} points="0,0 -8,-4 -8,4" fill={C.trace} transform={`translate(${a[0]},${a[1]}) rotate(${ang})`} />;
      })}
      {!scene.noLegs && sides.map((s, k) => <g key={'l' + k}><Taper a={s.hip} b={s.knee} ra={6.4} rb={4.6} c={C.body} /><Taper a={s.knee} b={s.ankle} ra={4.6} rb={3.2} c={C.body} /><Taper a={s.ankle} b={[s.ankle[0] + (k === 0 ? -8 : 8), s.ankle[1] + 3]} ra={3.4} rb={2.6} c={C.body} /></g>)}
      <polygon points={pol([[f.c - f.shHalf + f.shift, f.sy + 4], [f.c + f.shHalf + f.shift, f.sy + 4], [f.c + HIP_HALF, f.hy], [f.c - HIP_HALF, f.hy]])} fill={C.body} stroke={C.body} strokeWidth="6" strokeLinejoin="round" />
      <line x1={f.c} y1={f.sy + 4} x2={f.c} y2={f.sy - 4} stroke={C.body} strokeWidth="8" />
      {sides.map((s, k) => <g key={'a' + k}><Taper a={s.shoulder} b={s.elbow} ra={4.8} rb={3.6} c={C.body} /><Taper a={s.elbow} b={s.wrist} ra={3.6} rb={2.8} c={C.body} /><circle cx={s.wrist[0]} cy={s.wrist[1]} r="3.6" fill={C.body} /></g>)}
      {scene.back && <line x1={f.c} y1={f.sy + 6} x2={f.c} y2={f.hy - 2} stroke="#be185d" strokeWidth="2" strokeDasharray="2 3" />}
      {!scene.noHead && (scene.back ? <circle cx={f.headC[0]} cy={f.headC[1]} r="10" fill="#7c3a5a" /> : <g><circle cx={f.headC[0]} cy={f.headC[1]} r="10" fill={C.head} /><path d={`M${f.headC[0] - 9.4} ${f.headC[1] - 3} A10 10 0 0 1 ${f.headC[0] + 9.4} ${f.headC[1] - 3} Q${f.headC[0]} ${f.headC[1] - 6.5} ${f.headC[0] - 9.4} ${f.headC[1] - 3} Z`} fill="#7c3a5a" /><circle cx={f.headC[0] - 3.6} cy={f.headC[1] + 1} r="1.3" fill="#4a1d3a" /><circle cx={f.headC[0] + 3.6} cy={f.headC[1] + 1} r="1.3" fill="#4a1d3a" /></g>)}
      {frontMuscles(f, muscles)}
      {sides.map((s, k) => <Pt key={'e' + k} p={s.elbow} r={2.4} fill="#831843" />)}
      {(scene.follow || []).filter(e => e.k === 'hbar').map((e, i) => { const y = Math.min(f.L[e.at || 'wrist'][1], f.R[e.at || 'wrist'][1]) + (e.dy || 0); const x1 = f.L[e.at || 'wrist'][0] - (e.ext || 16); const x2 = f.R[e.at || 'wrist'][0] + (e.ext || 16); return <g key={'hb' + i}><line x1={x1} y1={y} x2={x2} y2={y} stroke={C.plate} strokeWidth="3" />{e.plates !== false && [x1, x2].map((x, q) => <rect key={q} x={x - 3} y={y - (e.r || 12)} width="6" height={(e.r || 12) * 2} rx="2" fill={C.plate} stroke={C.plateIn} strokeWidth="1" />)}</g>; })}
      {(scene.follow || []).filter(e => e.k !== 'hbar').map((e, i) => sides.map((s, k) => {
        if (e.side === 'R' && k === 0) return null;
        const m = x => (k === 0 ? 2 * f.c - x : x); // la gauche est le miroir de la droite
        const ee = e.k === 'cable' ? { ...e, from: [m(e.from[0]), e.from[1]] } : e.k === 'lever' ? { ...e, pivot: [m(e.pivot[0]), e.pivot[1]] } : e;
        return <Follow key={i + '-' + k} e={ee} j={s} i={i} />;
      }))}
    </svg>
  );
}

export function Figure({ scene, pose, showTrace = true, muscleText = '' }) {
  const muscles = muscleText ? musclesOf(muscleText) : [];
  if (scene.view === 'front') return <FrontFigure scene={scene} pose={pose} showTrace={showTrace} muscles={muscles} />;
  const j = solvePose(pose);
  const far = { dx: -5, dy: 0 };
  const sh = p => [p[0] + far.dx, p[1] + far.dy];
  const trace = showTrace && scene.trace !== false ? tracePath(scene.keys, scene.trace || 'wrist') : null;
  const tp = trace && trace.length > 2 ? trace : null;
  const last = tp ? tp[tp.length - 1] : null;
  const prev = tp ? tp[tp.length - 4] : null;
  const ang = tp ? Math.atan2(last[1] - prev[1], last[0] - prev[0]) : 0;
  return (
    <svg viewBox={(scene.box || [0, -24, 320, 244]).join(" ")} className="w-full h-auto select-none" role="img" aria-label={scene.title || 'Animation du mouvement'}>
      <rect x="-200" y="-200" width="800" height="800" fill="#0b1220" />
      <line x1="0" y1="200" x2="320" y2="200" stroke={C.ground} strokeWidth="3" />
      <ellipse cx={Math.max(36, Math.min(284, (j.hip[0] + j.ankle[0]) / 2))} cy="201" rx="52" ry="3.2" fill="#000" opacity="0.28" />
      {(scene.equip || []).map((e, i) => <Fixed key={i} e={e} i={i} />)}
      {/* membres du côté éloigné (plus sombres) */}
      {j.farKnee ? <Limb pts={[j.hip, j.farKnee, j.farAnkle, [j.farAnkle[0] + 10, j.farAnkle[1] + 2]]} w="5" c={C.bodyFar} /> : <g><Taper a={sh(j.hip)} b={sh(j.knee)} ra={5.2} rb={3.8} c={C.bodyFar} /><Taper a={sh(j.knee)} b={sh(j.ankle)} ra={3.8} rb={2.6} c={C.bodyFar} /><Taper a={sh(j.ankle)} b={sh(j.toe)} ra={2.8} rb={2.2} c={C.bodyFar} /></g>}
      {j.farElbow ? <Limb pts={[j.shoulder, j.farElbow, j.farWrist]} w="5" c={C.bodyFar} /> : scene.farHand ? <Limb pts={[sh(j.shoulder), sh(ik(j.shoulder, scene.farHand, SEG.uarm, SEG.farm, 1).mid), scene.farHand]} w="5" c={C.bodyFar} /> : <Limb pts={[sh(j.shoulder), sh(j.elbow), sh(j.wrist)]} w="5" c={C.bodyFar} />}
      {/* trajet moteur */}
      {tp && (
        <g>
          <polyline points={tp.map(p => p.join(',')).join(' ')} fill="none" stroke={C.trace} strokeWidth="2" strokeDasharray="4 4" opacity="0.9" />
          <polygon points="0,0 -8,-4 -8,4" fill={C.trace} transform={`translate(${last[0]},${last[1]}) rotate(${(ang * 180) / Math.PI})`} />
          <circle cx={tp[0][0]} cy={tp[0][1]} r="3" fill="none" stroke={C.trace} strokeWidth="1.5" />
        </g>
      )}
      {/* corps */}
      <Taper a={j.hip} b={j.knee} ra={6.6} rb={4.8} c={C.body} />
      <Taper a={j.knee} b={j.ankle} ra={4.8} rb={3.3} c={C.body} />
      <Taper a={j.ankle} b={j.toe} ra={3.4} rb={2.6} c={C.body} />
      <Taper a={j.hip} b={j.shoulder} ra={6.4} rb={7.4} c={C.body} />
      <Taper a={j.shoulder} b={j.elbow} ra={4.6} rb={3.6} c={C.body} />
      <Taper a={j.elbow} b={j.wrist} ra={3.6} rb={2.8} c={C.body} />
      <Taper a={j.wrist} b={j.fist} ra={3.4} rb={3} c={C.body} />
      <Head c={j.headC} up={[j.shoulder[0] - j.hip[0], j.shoulder[1] - j.hip[1]]} />
      {sideMuscles(j, muscles)}
      <Pt p={j.knee} r={2.6} fill="#831843" />
      <Pt p={j.elbow} r={2.4} fill="#831843" />
      <Pt p={j.hip} r={3} fill="#831843" />
      {(scene.follow || []).map((e, i) => <Follow key={i} e={e} j={j} i={i} />)}
    </svg>
  );
}
