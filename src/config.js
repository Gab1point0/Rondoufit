// Clé sous laquelle la progression est enregistrée dans le navigateur de l'appareil.
// (Ne pas la changer : elle contient déjà les données des appareils existants.)
export const STORAGE_KEY = "rondoudou_save_v1";

// Comptes dans l'application (édition « amis ») : projet Supabase. L'adresse et la clé « anon » (publique) viennent du tableau de bord
// Supabase → Project Settings → API. Ne JAMAIS mettre ici la clé secrète « service_role ».
// Tant que ces deux valeurs sont vides, l'assistant d'accueil propose la sauvegarde GitHub guidée à la place.
const SUPABASE_DEFAULT = { url: '', anonKey: '' };
function readSupabase() {
  // Réglage de test sur l'appareil (clé rondoufit:supabase) : permet d'essayer un autre projet sans republier l'appli.
  try {
    const o = JSON.parse(localStorage.getItem('rondoufit:supabase') || 'null');
    if (o && o.url && o.anonKey) return { url: String(o.url), anonKey: String(o.anonKey) };
  } catch (e) { /* rien */ }
  return SUPABASE_DEFAULT;
}
export const SUPABASE = readSupabase();
export const supabaseReady = c => !!(c && c.url && c.anonKey);
