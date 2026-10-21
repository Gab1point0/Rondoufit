import { coachIsCompound } from './settings';
import { normalizeArenaGroup } from '../data/arenas';
import { EXERCISE_CATALOG } from '../data/catalog';
import { stripAccents } from '../lib/text';

// Suggestions d'exercices du catalogue pour une arène en retard
export function coachSuggestExercises(state, arena, count = 3) {
  const owned = new Set((state.quests || []).map(q => q.catalogId));
  const ownedNames = new Set((state.quests || []).map(q => stripAccents(q.name || '')));
  const pref = ['Machine guidée', 'Hammer Strength', 'Poulie', 'Smith', 'Haltères', 'Barre', 'Poids du corps'];
  return EXERCISE_CATALOG
    .filter(c => c.type === 'strength' && normalizeArenaGroup(c.category, c.type) === arena && !owned.has(c.id) && !ownedNames.has(stripAccents(c.name)))
    .sort((a, b) => {
      const ca = coachIsCompound(a.name) ? 0 : 1, cb = coachIsCompound(b.name) ? 0 : 1;
      if (ca !== cb) return ca - cb;
      const pa = pref.indexOf(a.equip || ''), pb = pref.indexOf(b.equip || '');
      return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
    })
    .slice(0, count);
}
