import { HeaderProfile } from './HeaderProfile';

// En-tête compact : profil, jauge d'EXP et pastilles. Les actions (course, exercice, dictée, minuteur) sont dans le
// bouton « + » flottant ; les données et réglages dans le menu ⚙️ / « Plus ».
export function AppHeader(props) {
  return (
    <header className="relative overflow-hidden border-b border-pink-500/20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <HeaderProfile {...props} />
      </div>
    </header>
  );
}
