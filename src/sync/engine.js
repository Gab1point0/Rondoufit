// Moteur de synchronisation : lit le fichier GitHub, le fusionne avec les données de cet appareil, puis l'écrit.
// Aucune dépendance à React ni au navigateur : tout passe par `ports` (voir les tests).
//
// Règles de sécurité héritées de l'ancienne sauvegarde Google Sheets :
//  - on n'écrase jamais GitHub si on n'a pas pu le lire (fichier illisible ou invalide → on s'arrête) ;
//  - un appareil neuf (données de départ jamais modifiées) ne peut pas écraser une sauvegarde existante ;
//  - rien n'est perdu quand deux appareils ont modifié les données : elles sont fusionnées (voir merge.js).
import { GithubError } from './github';
import { deepEqual, mergeStates } from './merge';

const MAX_TRIES = 5;

/**
 * @param cfg   { owner, repo, path, branch, token }
 * @param ports {
 *   api:        { getFile(cfg) -> {content, sha}, putFile(cfg, content, sha, message) -> sha },
 *   getLocal(): état de cet appareil,
 *   isPristine(state): true si c'est encore l'état de départ (jamais modifié),
 *   normalize(obj): complète une sauvegarde avec les valeurs par défaut,
 *   getLocalTs(): date (ms) de la dernière modification faite sur cet appareil,
 *   isDirty(), version(), markDirty(), clearDirty(version): suivi des modifications non envoyées,
 *   getSynced() -> { sha, base } | null, setSynced({ sha, base }),
 *   applyRemote(state, ts): remplace l'état de l'application (ce n'est pas une modification locale),
 *   now(): date courante (ms),
 * }
 * @returns {Promise<{ action: 'none'|'created'|'pushed'|'pulled'|'merged', ts?: number }>}
 */
export async function syncOnce(cfg, ports) {
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const remote = await ports.api.getFile(cfg);
    const local = ports.getLocal();
    const version = ports.version();
    const synced = ports.getSynced();
    // Première synchronisation de cet appareil : s'il contient déjà des données à lui, on les considère comme à envoyer.
    const dirty = ports.isDirty() || (!synced && !ports.isPristine(local));

    let remoteState = null;
    let remoteTs = 0;
    if (remote.content) {
      let parsed;
      try {
        parsed = JSON.parse(remote.content);
      } catch {
        throw new Error("Le fichier distant n'est pas un JSON valide : synchronisation interrompue pour ne rien écraser.");
      }
      if (!parsed || !Array.isArray(parsed.quests)) {
        throw new Error("Le fichier distant n'a pas le format d'une sauvegarde RondouFit : synchronisation interrompue pour ne rien écraser.");
      }
      const { _savedAt, ...rest } = parsed;
      remoteTs = Number(_savedAt) || 0;
      remoteState = ports.normalize(rest);
    }
    const remoteChanged = remote.sha !== (synced ? synced.sha : null);

    let next;
    let action;
    if (!remoteState) {
      // Fichier absent : on le crée, sauf depuis un appareil neuf qui n'a rien à sauvegarder.
      if (!dirty && !synced) return { action: 'none' };
      next = local;
      action = 'created';
    } else if (!remoteChanged && !dirty) {
      return { action: 'none' };
    } else if (!remoteChanged) {
      next = local;
      action = 'pushed';
    } else if (!dirty) {
      // Rien de neuf ici, du neuf sur GitHub : on le reprend.
      if (ports.version() !== version) continue;
      if (!deepEqual(local, remoteState)) ports.applyRemote(remoteState, remoteTs);
      ports.setSynced({ sha: remote.sha, base: remoteState });
      return { action: 'pulled', ts: remoteTs };
    } else {
      next = mergeStates(synced ? synced.base : null, local, remoteState, { preferLocal: ports.getLocalTs() >= remoteTs });
      action = 'merged';
    }

    // L'utilisateur a modifié ses données pendant l'aller-retour réseau : on recommence avec l'état à jour.
    if (ports.version() !== version) continue;

    // Après fusion, il n'y a parfois rien de plus à envoyer : GitHub contient déjà exactement ce résultat.
    if (remoteState && deepEqual(next, remoteState)) {
      if (!deepEqual(local, next)) ports.applyRemote(next, remoteTs);
      ports.setSynced({ sha: remote.sha, base: next });
      ports.clearDirty(version);
      return { action: 'none' };
    }

    let pushVersion = version;
    if (action === 'merged') {
      ports.applyRemote(next, remoteTs);
      ports.markDirty(); // tant que le résultat n'est pas envoyé, il reste « à envoyer »
      pushVersion = ports.version();
    }

    const ts = ports.now();
    const content = JSON.stringify({ ...next, _savedAt: ts }, null, 2);
    let sha;
    try {
      sha = await ports.api.putFile(cfg, content, remote.sha, 'RondouFit : sauvegarde automatique');
    } catch (err) {
      if (err instanceof GithubError && (err.status === 409 || err.status === 422) && attempt < MAX_TRIES - 1) continue;
      throw err;
    }
    ports.setSynced({ sha, base: next });
    ports.clearDirty(pushVersion);
    return { action, ts };
  }
  throw new Error('Synchronisation interrompue : les données changent trop vite, nouvel essai plus tard.');
}
