// Petite boîte à outils pour décrire les scènes : poses, décor (bancs, sièges, poulies…), charges.
import { GROUND, SEG } from './skeleton';

export const G = GROUND; // sol (y = 200)
export const ANKLE_Y = G - 6;

/** Pose : hanche [x,y], angle du buste, + options (hand/arm, foot/leg, handBend, footBend, toe, neck). */
export const P = (hip, torso, o = {}) => ({ hip, torso, ...o });

// ---- décor fixe ----
export const pad = (a, b, w = 9, dark = false) => ({ k: 'pad', a, b, w, dark });
export const line = (a, b, w = 3, c, dash) => ({ k: 'line', a, b, w, c, dash });
export const rect = (x, y, w, h, c, r, o) => ({ k: 'rect', x, y, w, h, c, r, o });
export const pulley = (c, r) => ({ k: 'pulley', c, r });
export const stack = (x, y, w, h, sel, n) => ({ k: 'stack', x, y, w, h, sel, n });
export const txt = (p, t, s, c, anchor) => ({ k: 'text', p, t, s, c, anchor });

/** Banc plat : plateau de x1 à x2 à la hauteur y, avec deux pieds. */
export const flatBench = (x1, x2, y = 148) => [pad([x1, y], [x2, y], 9), line([x1 + 10, y + 5], [x1 + 10, G], 3), line([x2 - 10, y + 5], [x2 - 10, G], 3)];

/** Banc incliné : assise + dossier relevé d'un angle (degrés), le bas du dossier part de `seatBack`. */
export function inclineBench(seatBack, angle, len = 70, seatLen = 40, y) {
  const sy = y === undefined ? seatBack[1] : y;
  const a = (angle * Math.PI) / 180;
  const top = [seatBack[0] - Math.cos(a) * len, sy - Math.sin(a) * len];
  return [
    pad([seatBack[0], sy], [seatBack[0] + seatLen, sy], 9),
    pad([seatBack[0], sy], top, 9),
    line([seatBack[0] + 8, sy + 5], [seatBack[0] + 8, G], 3),
    line([seatBack[0] + seatLen - 4, sy + 5], [seatBack[0] + seatLen - 4, G], 3),
  ];
}

/** Siège de machine : assise horizontale + dossier vertical (ou incliné) + socle. */
export function seat(x, y, backAngle = 90, backLen = 62, seatLen = 34) {
  const a = (backAngle * Math.PI) / 180;
  return [
    pad([x, y], [x + seatLen, y], 10),
    pad([x, y], [x + Math.cos(a) * backLen, y - Math.sin(a) * backLen], 10),
    line([x + 12, y + 6], [x + 12, G - 2], 4, '#334155'),
    rect(x - 14, G - 6, seatLen + 28, 6, '#334155', 2),
  ];
}

/** Machine à plaques : bloc de plaques avec la plaque choisie en bleu. */
export const plates = (x, y = 60, w = 20, h = 110, sel) => stack(x, y, w, h, sel, 8);

/** Montants d'un rack (barre posée sur crochets). */
export const rack = (x, top = 70, hookY = 90) => [line([x, top], [x, G], 4), line([x, hookY], [x + 12, hookY], 3, '#94a3b8')];

// ---- charges liées au corps ----
export const plate = (at = 'wrist', r = 13) => ({ k: 'plate', at, r });
export const db = (at = 'wrist', r = 7) => ({ k: 'db', at, r });
export const handle = (at = 'wrist') => ({ k: 'handle', at });
export const ball = (at = 'wrist', r = 10) => ({ k: 'ball', at, r });
export const cable = (from, at = 'wrist', dash) => ({ k: 'cable', from, at, dash });
export const lever = (pivot, at = 'wrist', w = 7) => ({ k: 'lever', pivot, at, w });

/** Épaule d'une pose (hanche + buste), pour viser les mains par rapport à elle. */
export const shoulderOf = (hip, torso) => [hip[0] + SEG.torso * Math.cos((torso * Math.PI) / 180), hip[1] + SEG.torso * Math.sin((torso * Math.PI) / 180)];
export const pt = (p, dx = 0, dy = 0) => [p[0] + dx, p[1] + dy];
