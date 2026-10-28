// Bouton « Fermer » flottant en bas de l'écran : la croix du haut peut être cachée par la barre d'adresse du navigateur
export function ModalCloseBar({ onClose }) {
  return (
    <div className="fixed bottom-4 inset-x-0 z-[60] flex justify-center pointer-events-none">
      <button type="button" onClick={onClose} className="pointer-events-auto px-6 py-3 rounded-full bg-slate-800 border border-slate-500 text-white text-sm font-black shadow-2xl">
        ✕ Fermer
      </button>
    </div>
  );
}
