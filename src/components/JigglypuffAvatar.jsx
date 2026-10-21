// ==========================================
// AVATAR RONDOUDOU ÉVOLUTIF (10 STADES CACHÉS SELON L'ÉCART DE POIDS)
// ==========================================
function computeRondoudouStage(currentWeightKg, targetWeightKg) {
  const curr = Number(currentWeightKg) || 85;
  const targ = Number(targetWeightKg) || 75;
  const diff = Math.max(0, Math.abs(curr - targ));
  if (diff <= 0.4) return 10;
  return Math.max(1, Math.min(9, 11 - Math.min(10, Math.ceil(diff))));
}

export function JigglypuffAvatar({ currentWeightKg, targetWeightKg, size = 68 }) {
  const stage = computeRondoudouStage(currentWeightKg, targetWeightKg);
  const t = (stage - 1) / 9;
  const bodyRx = Math.round(45 - t * 12);
  const bodyRy = Math.round(42 - t * 10);

  const isVeryChubby = stage <= 3;
  const hasHeadband = stage >= 4;
  const hasMic = stage >= 5;
  const hasDumbbell = stage >= 3;
  const hasTone = stage >= 7;
  const hasSixPack = stage >= 8;
  const isChampion = stage >= 9;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible select-none drop-shadow-md">
      <defs>
        <radialGradient id="jpBodyGrad" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#ffd6e8" />
          <stop offset="55%" stopColor="#ff9ebb" />
          <stop offset="100%" stopColor="#e66b96" />
        </radialGradient>
        <radialGradient id="jpEyeGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="60%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#115e59" />
        </radialGradient>
        <radialGradient id="jpAuraGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {isChampion && <circle cx="60" cy="62" r="54" fill="url(#jpAuraGrad)" />}

      <ellipse cx="60" cy="108" rx={bodyRx * 0.85} ry="6" fill="rgba(0,0,0,0.35)" />

      <ellipse cx={60 - bodyRx * 0.45} cy="102" rx={isVeryChubby ? 14 : 11} ry="6.5" transform="rotate(-12 42 102)" fill="#e66b96" stroke="#831843" strokeWidth="2" />
      <ellipse cx={60 + bodyRx * 0.45} cy="102" rx={isVeryChubby ? 14 : 11} ry="6.5" transform="rotate(12 78 102)" fill="#e66b96" stroke="#831843" strokeWidth="2" />

      <polygon points={`${60 - bodyRx * 0.75},42 ${60 - bodyRx * 0.92},15 ${60 - bodyRx * 0.32},26`} fill="url(#jpBodyGrad)" stroke="#831843" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points={`${60 - bodyRx * 0.7},36 ${60 - bodyRx * 0.84},20 ${60 - bodyRx * 0.42},28`} fill="#4c1d95" />

      <polygon points={`${60 + bodyRx * 0.75},42 ${60 + bodyRx * 0.92},15 ${60 + bodyRx * 0.32},26`} fill="url(#jpBodyGrad)" stroke="#831843" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points={`${60 + bodyRx * 0.7},36 ${60 + bodyRx * 0.84},20 ${60 + bodyRx * 0.42},28`} fill="#4c1d95" />

      <ellipse cx="60" cy="63" rx={bodyRx} ry={bodyRy} fill="url(#jpBodyGrad)" stroke="#831843" strokeWidth="2.6" />

      {stage === 1 && (
        <>
          <path d="M 24 72 Q 16 84 29 90" fill="#ff9ebb" stroke="#9d174d" strokeWidth="2" />
          <path d="M 96 72 Q 104 84 91 90" fill="#ff9ebb" stroke="#9d174d" strokeWidth="2" />
          <path d="M 42 84 Q 60 92 78 84" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" />
          <path d="M 36 91 Q 60 100 84 91" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {stage === 2 && (
        <>
          <path d="M 44 85 Q 60 92 76 85" fill="none" stroke="#be185d" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 40 91 Q 60 98 80 91" fill="none" stroke="#be185d" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {(stage === 3 || stage === 4) && (
        <path d="M 46 87 Q 60 93 74 87" fill="none" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      )}

      {hasTone && (
        <g stroke="#be185d" strokeLinecap="round" fill="none" opacity={stage >= 9 ? 0.85 : 0.55}>
          <path d="M 45 71 Q 52 75 59 71" strokeWidth="1.8" />
          <path d="M 61 71 Q 68 75 75 71" strokeWidth="1.8" />
          {hasSixPack && (
            <>
              <line x1="60" y1="73" x2="60" y2="91" strokeWidth="1.8" />
              <rect x="50" y="75" width="8.5" height="6" rx="2" strokeWidth="1.5" />
              <rect x="61.5" y="75" width="8.5" height="6" rx="2" strokeWidth="1.5" />
              <rect x="50" y="83" width="8.5" height="6" rx="2" strokeWidth="1.5" />
              <rect x="61.5" y="83" width="8.5" height="6" rx="2" strokeWidth="1.5" />
            </>
          )}
        </g>
      )}

      {stage === 10 && (
        <g>
          <path d="M 31 90 Q 60 96 89 90" fill="none" stroke="#fbbf24" strokeWidth="4" />
          <circle cx="60" cy="92" r="5" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
        </g>
      )}

      {hasHeadband && (
        <path d={`M ${60 - bodyRx * 0.88} 38 Q 60 45 ${60 + bodyRx * 0.88} 38`} fill="none" stroke={stage >= 9 ? '#f59e0b' : '#ef4444'} strokeWidth="5" strokeLinecap="round" />
      )}

      <path d="M 55 24 C 44 12, 74 10, 69 27 C 66 36, 53 35, 56 27 C 58 23, 64 25, 62 29" fill="url(#jpBodyGrad)" stroke="#831843" strokeWidth="2.4" strokeLinecap="round" />

      {stage === 10 && (
        <polygon points="48,18 53,8 60,14 67,8 72,18" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" strokeLinejoin="round" />
      )}

      <g>
        <circle cx="45" cy="54" r={isVeryChubby ? 9.5 : 11} fill="#ffffff" stroke="#831843" strokeWidth="2" />
        <circle cx="46" cy="54" r={isVeryChubby ? 6.8 : 8} fill="url(#jpEyeGrad)" />
        <circle cx="43.5" cy="51" r="2.8" fill="#ffffff" />
        <circle cx="48" cy="56.5" r="1.3" fill="#ffffff" />

        <circle cx="75" cy="54" r={isVeryChubby ? 9.5 : 11} fill="#ffffff" stroke="#831843" strokeWidth="2" />
        <circle cx="74" cy="54" r={isVeryChubby ? 6.8 : 8} fill="url(#jpEyeGrad)" />
        <circle cx="71.5" cy="51" r="2.8" fill="#ffffff" />
        <circle cx="76" cy="56.5" r="1.3" fill="#ffffff" />

        {stage <= 2 && (
          <>
            <path d="M 35 49 Q 45 53 55 49" fill="#ff9ebb" stroke="#831843" strokeWidth="1.8" />
            <path d="M 65 49 Q 75 53 85 49" fill="#ff9ebb" stroke="#831843" strokeWidth="1.8" />
          </>
        )}
        {stage >= 6 && (
          <>
            <line x1="36" y1="42" x2="53" y2="46" stroke="#831843" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="84" y1="42" x2="67" y2="46" stroke="#831843" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
      </g>

      <ellipse cx={isVeryChubby ? 30 : 33} cy="64" rx={isVeryChubby ? 7.5 : 5} ry={isVeryChubby ? 4.5 : 3} fill="#f43f5e" opacity="0.55" />
      <ellipse cx={isVeryChubby ? 90 : 87} cy="64" rx={isVeryChubby ? 7.5 : 5} ry={isVeryChubby ? 4.5 : 3} fill="#f43f5e" opacity="0.55" />

      {stage <= 2 && (
        <path d="M 95 36 C 95 36, 99 43, 95 46 C 91 43, 95 36, 95 36 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
      )}

      {stage <= 2 ? (
        <ellipse cx="60" cy="66" rx="4.5" ry="3.5" fill="#9d174d" />
      ) : stage >= 7 ? (
        <path d="M 52 63 Q 60 72 68 63 Z" fill="#be185d" stroke="#831843" strokeWidth="1.8" />
      ) : (
        <path d="M 54 64 Q 60 70 66 64" fill="none" stroke="#831843" strokeWidth="2.2" strokeLinecap="round" />
      )}

      {hasTone ? (
        <path d={`M ${60 - bodyRx + 3} 62 Q 12 48 22 36 Q 28 32 31 44`} fill="url(#jpBodyGrad)" stroke="#831843" strokeWidth="2.4" />
      ) : (
        <ellipse cx={60 - bodyRx + 2} cy="67" rx="9" ry="5.5" transform="rotate(20 22 67)" fill="url(#jpBodyGrad)" stroke="#831843" strokeWidth="2" />
      )}

      {hasMic && (
        <g transform={hasTone ? 'translate(12, 24) rotate(-20)' : 'translate(8, 52) rotate(-25)'}>
          <rect x="4" y="8" width="4.5" height="13" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="6.2" cy="6" r="5.5" fill="#10b981" stroke="#064e3b" strokeWidth="1.5" />
        </g>
      )}

      {hasTone ? (
        <path d={`M ${60 + bodyRx - 3} 62 Q 108 48 98 36 Q 92 32 89 44`} fill="url(#jpBodyGrad)" stroke="#831843" strokeWidth="2.4" />
      ) : (
        <ellipse cx={60 + bodyRx - 2} cy="67" rx="9" ry="5.5" transform="rotate(-20 98 67)" fill="url(#jpBodyGrad)" stroke="#831843" strokeWidth="2" />
      )}

      {hasDumbbell && (
        <g transform={hasTone ? 'translate(88, 22) rotate(18)' : 'translate(88, 56) rotate(15)'}>
          <line x1="0" y1="8" x2="20" y2="8" stroke="#94a3b8" strokeWidth="3" />
          <rect x="-2" y="1" width="5" height="14" rx="1.5" fill={isChampion ? '#fbbf24' : '#475569'} stroke="#0f172a" strokeWidth="1.2" />
          <rect x="17" y="1" width="5" height="14" rx="1.5" fill={isChampion ? '#fbbf24' : '#475569'} stroke="#0f172a" strokeWidth="1.2" />
        </g>
      )}
    </svg>
  );
}
