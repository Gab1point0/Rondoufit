// Accès minimal à l'API GitHub « Contents » pour lire / écrire le fichier de sauvegarde.
// Le jeton (fine-grained token) n'est jamais écrit dans le fichier de données :
// il reste uniquement dans le navigateur de chaque appareil.

export class GithubError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const API = 'https://api.github.com';

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function headers(cfg) {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function fileUrl(cfg) {
  const path = cfg.path.split('/').map(encodeURIComponent).join('/');
  return `${API}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}`;
}

async function explain(res) {
  let detail = '';
  try {
    detail = (await res.json()).message ?? '';
  } catch {
    /* ignore */
  }
  const hint =
    res.status === 401
      ? 'Jeton invalide ou expiré.'
      : res.status === 403
        ? "Accès refusé : le jeton n'a pas le droit « Contents : lecture et écriture » sur ce dépôt."
        : res.status === 404
          ? 'Dépôt ou fichier introuvable (vérifiez le nom du dépôt et les droits du jeton).'
          : res.status === 409 || res.status === 422
            ? 'Conflit : le fichier a été modifié ailleurs.'
            : 'Erreur GitHub.';
  return new GithubError(`${hint}${detail ? ` (${detail})` : ''}`, res.status);
}

/** Lit le fichier. `content` et `sha` valent `null` si le fichier n'existe pas encore. */
export async function getFile(cfg) {
  const ref = `?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(fileUrl(cfg) + ref, { headers: headers(cfg), cache: 'no-store' });
  if (res.status === 404) {
    // On distingue « fichier absent » de « dépôt introuvable ».
    const repoRes = await fetch(`${API}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`, {
      headers: headers(cfg),
    });
    if (!repoRes.ok) throw await explain(repoRes);
    return { content: null, sha: null };
  }
  if (!res.ok) throw await explain(res);
  const json = await res.json();
  if (json.content && json.encoding === 'base64') {
    return { content: fromBase64(json.content), sha: json.sha };
  }
  // Fichier > 1 Mo : l'API ne renvoie pas le contenu en base64, on passe par le format brut.
  const raw = await fetch(fileUrl(cfg) + ref, {
    headers: { ...headers(cfg), Accept: 'application/vnd.github.raw+json' },
    cache: 'no-store',
  });
  if (!raw.ok) throw await explain(raw);
  return { content: await raw.text(), sha: json.sha };
}

/** Écrit le fichier (création si `sha` est null). Renvoie le nouveau sha. */
export async function putFile(cfg, content, sha, message) {
  const res = await fetch(fileUrl(cfg), {
    method: 'PUT',
    headers: { ...headers(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw await explain(res);
  const json = await res.json();
  return json.content.sha;
}

/** Liste les fichiers d'un dossier du dépôt : [{ name, sha }]. Dossier absent = liste vide. */
export async function listDir(cfg, dir) {
  const path = dir.split('/').map(encodeURIComponent).join('/');
  const url = `${API}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, { headers: headers(cfg), cache: 'no-store' });
  if (res.status === 404) return [];
  if (!res.ok) throw await explain(res);
  const json = await res.json();
  return Array.isArray(json) ? json.filter(f => f.type === 'file').map(f => ({ name: f.name, sha: f.sha })) : [];
}

/** Supprime un fichier du dépôt (il faut son sha actuel). */
export async function deleteFile(cfg, sha, message) {
  const res = await fetch(fileUrl(cfg), {
    method: 'DELETE',
    headers: { ...headers(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: cfg.branch }),
  });
  if (!res.ok && res.status !== 404) throw await explain(res);
}
