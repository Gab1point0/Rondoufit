import { useState } from 'react';
import { X } from '../icons';
import { EMPTY_CONFIG, isConfigured, readCarnetConfig } from '../sync/storage';

const inputClass = 'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder:text-slate-600';
const labelClass = 'block text-[11px] font-bold text-slate-400 mb-1';

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export function SyncModal({ sync, onClose, triggerToast }) {
  const { config, configured, status, error, lastSync, setConfig, syncNow, importLegacy } = sync;
  const [draft, setDraft] = useState(config);
  const [showToken, setShowToken] = useState(false);
  const [legacyBusy, setLegacyBusy] = useState(false);
  const patch = p => setDraft(d => ({ ...d, ...p }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(config);
  const carnet = !configured ? readCarnetConfig() : null;

  const save = () => {
    setConfig({ ...draft, owner: draft.owner.trim(), repo: draft.repo.trim(), path: draft.path.trim(), branch: draft.branch.trim(), token: draft.token.trim() });
    triggerToast('Réglages enregistrés', 'Première synchronisation avec GitHub…', 0, '☁️');
  };

  const useCarnet = () => {
    patch({ owner: carnet.owner, token: carnet.token, repo: carnet.repo || draft.repo });
  };

  const disconnect = () => {
    setConfig({ ...EMPTY_CONFIG });
    setDraft({ ...EMPTY_CONFIG });
    triggerToast('Sauvegarde GitHub désactivée', 'Les données restent sur cet appareil.', 0, '☁️');
  };

  const recoverLegacy = async () => {
    if (!window.confirm("Reprendre les données de l'ancien Google Sheets et les fusionner avec celles de cet appareil ?")) return;
    setLegacyBusy(true);
    try {
      const r = await importLegacy();
      triggerToast('Anciennes données reprises', `${r.quests} exercice(s) au total après fusion.`, 0, '📥');
    } catch (err) {
      triggerToast('Récupération impossible', err instanceof Error ? err.message : 'Google Sheets injoignable.', 0, '⚠️');
    } finally {
      setLegacyBusy(false);
    }
  };

  const statusText =
    status === 'error'
      ? `❌ ${error}`
      : status === 'loading' || status === 'saving'
        ? 'Synchronisation en cours…'
        : status === 'off'
          ? 'Sauvegarde GitHub non réglée : vos données ne sont que sur cet appareil.'
          : lastSync
            ? `✅ Dernière synchronisation à ${new Date(lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
            : '✅ À jour.';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-pink-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white">☁️ Sauvegarde GitHub</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Vos données sont enregistrées dans <strong className="text-slate-200">un fichier d’un dépôt GitHub privé</strong> à vous. Chaque appareil le lit et le met à jour : ce que vous notez sur le téléphone arrive sur l’ordinateur, et inversement. Si deux appareils modifient en même temps, tout est fusionné.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!configured && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1.5">
            <p className="font-black text-pink-300">Mise en place (une seule fois)</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Sur GitHub, créez un dépôt <strong>privé</strong> (par exemple <code className="text-pink-300">rondoufit-donnees</code>), ou réutilisez celui de Carnet EPS.</li>
              <li>
                Créez un <em>jeton d’accès « fine-grained »</em> limité à ce seul dépôt, avec la permission <strong>Contents : Read and write</strong>{' '}
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="text-pink-300 underline">
                  (créer un jeton)
                </a>
                .
              </li>
              <li>Saisissez ci-dessous votre compte, le dépôt et le jeton, sur chaque appareil.</li>
            </ol>
            {carnet && (
              <button type="button" onClick={useCarnet} className="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-600">
                Reprendre le compte et le jeton déjà saisis dans Carnet EPS
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Compte GitHub">
            <input value={draft.owner} onChange={e => patch({ owner: e.target.value })} placeholder="mon-compte" autoCapitalize="none" autoCorrect="off" className={inputClass} />
          </Field>
          <Field label="Dépôt de données">
            <input value={draft.repo} onChange={e => patch({ repo: e.target.value })} placeholder="rondoufit-donnees" autoCapitalize="none" autoCorrect="off" className={inputClass} />
          </Field>
          <Field label="Fichier">
            <input value={draft.path} onChange={e => patch({ path: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Branche">
            <input value={draft.branch} onChange={e => patch({ branch: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <Field label="Jeton d’accès (gardé uniquement sur cet appareil)">
          <div className="flex gap-2">
            <input
              type={showToken ? 'text' : 'password'}
              value={draft.token}
              onChange={e => patch({ token: e.target.value })}
              placeholder="github_pat_…"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              className={inputClass}
            />
            <button type="button" onClick={() => setShowToken(s => !s)} className="px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold shrink-0">
              {showToken ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </Field>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!dirty || !isConfigured(draft)}
            onClick={save}
            className="px-4 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-pink-600 to-purple-600 text-white disabled:opacity-40"
          >
            Enregistrer et synchroniser
          </button>
          {configured && (
            <button
              type="button"
              disabled={status === 'loading' || status === 'saving'}
              onClick={() => void syncNow()}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 disabled:opacity-40"
            >
              🔄 Synchroniser maintenant
            </button>
          )}
          {configured && (
            <button type="button" onClick={disconnect} className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-slate-400 hover:text-rose-300 border border-slate-700">
              Déconnecter cet appareil
            </button>
          )}
        </div>

        <p className={`text-xs ${status === 'error' ? 'text-rose-300' : 'text-slate-400'}`}>{statusText}</p>

        <div className="border-t border-slate-800 pt-3 space-y-2">
          <p className="text-[11px] text-slate-500">
            <strong className="text-slate-400">Ancienne sauvegarde Google Sheets :</strong> elle n’est plus utilisée. Si ce téléphone ou cet ordinateur n’a pas encore repris ses données, vous pouvez les récupérer une dernière fois ici.
          </p>
          <button
            type="button"
            disabled={legacyBusy}
            onClick={recoverLegacy}
            className="px-3 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40"
          >
            📥 Récupérer mes données de Google Sheets
          </button>
        </div>
      </div>
    </div>
  );
}
