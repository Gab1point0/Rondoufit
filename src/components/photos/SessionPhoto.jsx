import { PhotoAddButton } from './PhotoAddButton';
import { PhotoDB, usePhotos } from '../../lib/photos';

// Souvenir proposé à la fin d'une séance
export function SessionPhoto({ date, label, highlight }) {
  const photos = usePhotos().filter(p => p.date === date);
  const todo = highlight && photos.length === 0;
  return (
    <div className={`rounded-xl p-3 space-y-2 ${todo ? 'bg-pink-950/60 border-2 border-pink-500 animate-pulse' : 'bg-slate-950 border border-slate-800'}`}>
      <p className="text-xs font-extrabold text-white">{todo ? '📸 Vas-y, prends ta photo de fin de séance !' : '📸 Souvenir de la séance'}</p>
      {todo && <p className="text-[11px] text-pink-200">Ne l’oublie pas : c’est le souvenir de la séance du jour pour ton calendrier.</p>}
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map(p => (
            <div key={p.id} className="relative">
              <img src={p.img} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
              <button onClick={() => PhotoDB.del(p.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black">✕</button>
            </div>
          ))}
        </div>
      )}
      <PhotoAddButton date={date} label={label} className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200">
        {photos.length ? '➕ Ajouter une autre photo' : '📷 Prendre / ajouter une photo'}
      </PhotoAddButton>
      <p className="text-[10px] text-slate-500">Elle sera placée dans ton calendrier 📸 Souvenirs.</p>
    </div>
  );
}
