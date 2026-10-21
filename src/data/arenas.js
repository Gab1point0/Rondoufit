// ==========================================
// LES 6 ARÈNES / GROUPES MUSCULAIRES
// ==========================================
export const ARENA_GROUPS = [
  { id: 'Dos', label: 'Dos', icon: '🦅', badgeName: 'Badge Aile', color: 'from-violet-500 to-indigo-600' },
  { id: 'Pectoraux', label: 'Pectoraux', icon: '🛡️', badgeName: 'Badge Armure', color: 'from-pink-500 to-rose-600' },
  { id: 'Jambes', label: 'Jambes', icon: '🦵', badgeName: 'Badge Séisme', color: 'from-amber-500 to-orange-600' },
  { id: 'Épaules & Bras', label: 'Épaules & Bras', icon: '💪', badgeName: 'Badge Poing', color: 'from-cyan-500 to-blue-600' },
  { id: 'Abdominaux', label: 'Abdominaux', icon: '🍫', badgeName: 'Badge Gainage', color: 'from-fuchsia-500 to-purple-600' },
 { id: 'Course & Cardio', label: 'Course & Cardio', icon: '🏃', badgeName: 'Badge Zéphyr', color: 'from-emerald-500 to-teal-600' },
{ id: 'Volley-ball', label: 'Volley-ball', icon: '🏐', badgeName: 'Badge Smash', color: 'from-sky-400 to-blue-600' }
];

export function normalizeArenaGroup(category = '', type = 'strength') {
if (category.toLowerCase().includes('volley')) return 'Volley-ball';
  if (type === 'cardio' || category.toLowerCase().includes('course') || category.toLowerCase().includes('cardio')) {
    return 'Course & Cardio';
  }
  const c = category.toLowerCase();
  if (c.includes('abdo') || c.includes('gainage')) return 'Abdominaux';
  if (c.includes('dos')) return 'Dos';
  if (c.includes('pec')) return 'Pectoraux';
  if (c.includes('jambe') || c.includes('cuisse') || c.includes('mollet')) return 'Jambes';
  if (c.includes('épaule') || c.includes('epaule') || c.includes('bras') || c.includes('biceps') || c.includes('triceps')) {
    return 'Épaules & Bras';
  }
  return 'Pectoraux';
}
