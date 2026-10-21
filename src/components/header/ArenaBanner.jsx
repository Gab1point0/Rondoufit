import { Award } from '../../icons';

export function ArenaBanner({ arenaLevels, questFilter, setActiveTab, setQuestFilter }) {
  return (
    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-black uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-400" /> Arènes & Niveaux par Groupe Musculaire (Validez vos objectifs pour monter de niveau)
        </span>
        {questFilter !== 'all' && (
          <button
            onClick={() => setQuestFilter('all')}
            className="text-[11px] font-bold text-pink-400 hover:underline"
          >
            Afficher toutes les Arènes
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {arenaLevels.map(arena => {
          const isSelected = questFilter === arena.id;
          return (
            <button
              key={arena.id}
              type="button"
              onClick={() => {
                setActiveTab('quests');
                setQuestFilter(isSelected ? 'all' : arena.id);
              }}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-pink-950/40 border-pink-400 shadow-md shadow-pink-500/10'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-lg">{arena.icon}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r ${arena.color} text-white`}
                >
                  Niv. {arena.groupLevel}
                </span>
              </div>
              <div className="mt-1.5">
                <p className="text-xs font-extrabold text-white truncate">
                  {arena.label}
                </p>
                <p className="text-[10px] text-slate-400">
                  {arena.questsCount} quête(s) active(s)
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
