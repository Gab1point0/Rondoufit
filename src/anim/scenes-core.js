import { plank } from './scenes-pull';
import { ANKLE_Y, G, P, cable, handle, lever, line, pad, plates, pt, pulley, rect, shoulderOf } from './kit';

const FLOOR_HIP = [190, 186];

// ---------------- Crunchs et sit-ups au sol ----------------
export function crunch({ sitUp = false, decline = false, reverse = false, legRaise = false }) {
  if (reverse) {
    const mk = (hipY, leg) => P([190, hipY], 180, { leg, arm: [180, 180] });
    return { keys: [mk(186, [-95, 5]), mk(172, [-112, -30])], trace: 'knee', loop: 'pingpong', equip: [], follow: [] };
  }
  if (legRaise) {
    const mk = a => P(FLOOR_HIP, 180, { leg: [a, a], toe: 80, arm: [150, 150] });
    return { keys: [mk(-6), mk(-90)], trace: 'ankle', loop: 'pingpong', equip: [], follow: [] };
  }
  if (decline) {
    const hip = [196, 126];
    const mk = torso => P(hip, torso, { leg: [20, 30], hand: pt(shoulderOf(hip, torso), -10, -10), handBend: -1 });
    return {
      keys: [mk(150), mk(212)], trace: 'shoulder', loop: 'pingpong',
      equip: [pad([100, 90], [200, 134], 9), line([108, 96], [108, G], 3), line([188, 130], [188, G], 3), line([226, 160], [226, 150], 5, '#94a3b8')],
      follow: [],
    };
  }
  const mk = torso => {
    const sh = shoulderOf(FLOOR_HIP, torso);
    return P(FLOOR_HIP, torso, { foot: [222, ANKLE_Y], footBend: -1, hand: pt(sh, -12, -8), handBend: -1, neck: torso > 190 ? -10 : 0 });
  };
  return { keys: [mk(180), mk(sitUp ? 264 : 206)], trace: 'shoulder', loop: 'pingpong', equip: [], follow: [] };
}

// ---------------- Suspension : relevés de jambes / genoux ----------------
export function hangingRaise({ mode = 'legs' }) {
  const barY = 8;
  const hx = 152;
  const top = [hx - 4, barY + 54];
  const mk = (leg, torso) => {
    return P([top[0] + 9, top[1] + 51], torso, { hand: [hx, barY], handBend: -1, leg, toe: 40 });
  };
  const eq = [line([hx - 40, barY], [hx + 40, barY], 4), line([hx - 40, barY], [hx - 40, G], 4), line([hx + 40, barY], [hx + 40, G], 4)];
  const hang = mk([96, 96], -100);
  const keys = mode === 'knees' ? [hang, mk([20, 100], -100)] : mode === 'toes' ? [hang, mk([-62, -62], -118)] : [hang, mk([-4, -4], -104)];
  return { keys, trace: 'ankle', loop: 'pingpong', equip: eq, follow: [] };
}

export function captainChair() {
  const hip = [150, 106];
  const sh = shoulderOf(hip, -90);
  const mk = leg => P(hip, -90, { leg, toe: 40, hand: [sh[0] + 22, sh[1] + 30], handBend: 1 });
  return {
    keys: [mk([92, 92]), mk([6, 96])], trace: 'knee', loop: 'pingpong',
    equip: [pad([hip[0] - 14, hip[1] - 70], [hip[0] - 14, hip[1] + 6], 10), line([hip[0] - 18, hip[1] + 8], [hip[0] - 18, G], 4), pad([hip[0] + 8, sh[1] + 32], [hip[0] + 40, sh[1] + 32], 8), line([hip[0] + 24, sh[1] + 38], [hip[0] + 24, G], 4)],
    follow: [],
  };
}

// ---------------- Roue abdominale ----------------
export function abWheel() {
  const mk = (hip, torso, th, handX) => P(hip, torso, { leg: [th, 180], toe: -10, hand: [handX, 188], handBend: 1 });
  return {
    keys: [mk([116, 150], -28, 90, 166), mk([130, 170], -6, 146, 232)], trace: 'wrist', loop: 'pingpong',
    equip: [rect(60, G - 4, 220, 4, '#334155', 1)], follow: [{ k: 'db', at: 'wrist', r: 8 }],
  };
}

// ---------------- Crunch poulie haute ----------------
export function cableCrunch() {
  const hip = [150, 150];
  const mk = torso => {
    const sh = shoulderOf(hip, torso);
    return P(hip, torso, { leg: [90, 180], hand: pt(sh, 8, -2), handBend: 1, neck: torso > -60 ? 20 : 0 });
  };
  return {
    keys: [mk(-84), mk(-22)], trace: 'shoulder', loop: 'pingpong',
    equip: [pulley([176, -14], 6), line([176, -14], [176, -14], 2), line([110, -14], [190, -14], 3), plates(86, 0, 18, 140, 4), rect(60, G - 4, 200, 4, '#334155', 1)],
    follow: [cable([176, -14], 'wrist'), handle('wrist')],
  };
}

// ---------------- Machines abdominales ----------------
export function abMachine({ oblique = false, total = false }) {
  const hip = [168, 152];
  const mk = torso => P(hip, torso, { foot: [208, ANKLE_Y], footBend: -1, hand: pt(shoulderOf(hip, torso), 12, 16), handBend: 1 });
  return {
    keys: [mk(-98), mk(-62)], trace: 'shoulder', loop: 'pingpong',
    equip: [
      pad([hip[0] - 14, hip[1] + 6], [hip[0] + 34, hip[1] + 6], 10), pad([hip[0] - 14, hip[1] + 4], [hip[0] - 22, hip[1] - 50], 10),
      line([hip[0] + 4, hip[1] + 12], [hip[0] + 4, G - 4], 4, '#334155'), rect(hip[0] - 30, G - 6, 100, 6, '#334155', 2), plates(86, 40, 18, 100, 3),
    ],
    follow: [{ k: 'padAt', at: 'shoulder', dx: 6, dy: 2, w: 8, h: 26 }, lever([hip[0] + 40, hip[1] - 70], 'shoulder', 4)],
    note: oblique ? 'oblique' : total ? 'total' : 'crunch',
  };
}

// ---------------- Gainages (statiques) ----------------
export function plankHold({ side = false }) {
  const forearmY = 192;
  const shY = forearmY - 26;
  const ankle = [72, 190];
  const mk = dy => plank(ankle, [200, shY + dy], { arm: [90, 5], toe: 75 });
  const keys = [mk(0), mk(2)];
  if (side) {
    // de profil : appui sur un avant-bras, l'autre bras tendu vers le haut
    const m2 = dy => plank(ankle, [200, shY + dy], { arm: [90, 5], toe: 75, farHand: [204, shY - 56] });
    return { keys: [m2(0), m2(2)], trace: false, loop: 'pingpong', equip: [], follow: [], hold: true };
  }
  return { keys, trace: false, loop: 'pingpong', equip: [], follow: [], hold: true };
}

export function hollowHold() {
  const mk = (t, l) => P([176, 187], t, { leg: [l, l], toe: 70, arm: [t - 8, t - 8] });
  return { keys: [mk(206, -16), mk(209, -19)], trace: false, loop: 'pingpong', equip: [], follow: [], hold: true };
}
void ANKLE_Y;
