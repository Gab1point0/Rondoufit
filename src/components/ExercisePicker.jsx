import { useState } from 'react';
import { EXERCISE_CATALOG, normSearch } from '../data/catalog';

// Sélecteur d'exercice avec barre de recherche
export function ExercisePicker({ value, onSelect, accept, allowCustom = true }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const FILTERS = [['all', 'Tous'], ['Dos', '🦅 Dos'], ['Pectoraux', '🛡️ Pecs'], ['Jambes', '🦵 Jambes'], ['Épaules & Bras', '💪 Épaules/Bras'], ['Abdominaux', '🍫 Abdos'], ['cardio', '🏃 Cardio']];
  const ORDER = ['Dos', 'Pectoraux', 'Jambes', 'Épaules & Bras', 'Abdominaux', 'Course & Cardio', 'Volley-ball'];
  const tokens = normSearch(query).split(/\s+/).filter(Boolean);
  const results = EXERCISE_CATALOG
    .filter(c => {
      if (accept && !accept(c)) return false;
      const inFilter = filter === 'all' || (filter === 'cardio' ? c.type === 'cardio' : c.category === filter && c.type !== 'cardio');
      if (!inFilter) return false;
      const hay = normSearch(`${c.name} ${c.category} ${c.equip || ''} ${c.brands || ''}`);
      return tokens.every(t => hay.includes(t));
    })
    .sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  const selected = EXERCISE_CATALOG.find(c => c.id === value);
  return (
    <div className="space-y-2">
      <div className="text-xs text-pink-300 font-bold">
        Sélection : {selected ? `${selected.icon} ${selected.name}` : String(value).startsWith('custom') ? '✨ Exercice personnalisé' : '—'}
      </div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
        placeholder="🔍 Rechercher : pec deck, hammer, haltères, mollets, poulie…"
        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
      />
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`px-2.5 py-1 rounded-full text-[0.75rem] font-bold border ${
              filter === id ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="text-[0.75rem] text-slate-500">{results.length} exercice(s)</div>
      <div className="max-h-56 overflow-y-auto space-y-1 pr-1 border border-slate-800 rounded-xl p-1.5 bg-slate-950">
        {results.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-sm flex items-center justify-between gap-2 border ${
              c.id === value ? 'bg-pink-600/20 border-pink-500 text-white' : 'border-transparent hover:bg-slate-800 text-slate-200'
            }`}
          >
            <span className="font-semibold truncate">{c.icon} {c.name}</span>
            <span className="shrink-0 text-[0.7rem] font-bold text-slate-400 bg-slate-800 rounded-full px-2 py-0.5">{c.equip || (c.type === 'cardio' ? 'Cardio' : c.unit === 'kg' ? 'Charge' : 'Poids du corps')}</span>
          </button>
        ))}
        {results.length === 0 && <p className="text-xs text-slate-400 p-2">Aucun résultat{allowCustom ? '. Créez un exercice personnalisé ci-dessous.' : ' parmi les exercices de même type.'}</p>}
        {allowCustom && <button type="button" onClick={() => onSelect('custom_bodyweight')} className="w-full text-left px-2.5 py-2 rounded-lg text-sm text-pink-300 hover:bg-slate-800 font-bold">
          ✨ Autre exercice au poids du corps personnalisé…
        </button>}
        {allowCustom && <button type="button" onClick={() => onSelect('custom_strength')} className="w-full text-left px-2.5 py-2 rounded-lg text-sm text-pink-300 hover:bg-slate-800 font-bold">
          ✨ Autre exercice avec charge (kg) personnalisé…
        </button>}
      </div>
    </div>
  );
}
