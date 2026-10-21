// Ancienne sauvegarde sur Google Sheets (abandonnée au profit de GitHub).
// Ce module sert uniquement à RÉCUPÉRER une dernière fois les données qui s'y trouvent (Réglages → Synchronisation).
// Il peut être supprimé quand les données ont été reprises sur tous les appareils.

export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzngQF1KkFCme9qrgZ-p4cjJGWFAKm3WlFHaJoQwWdnCMUwmJtTdXHVsq2pKDkZt7SF/exec";

/** Lit la sauvegarde de l'ancien Google Sheets. Renvoie { data, savedAt }. */
export async function fetchLegacySave() {
  const res = await fetch(SCRIPT_URL + '?t=' + Date.now(), { redirect: 'follow' }).then(r => r.json());
  if (!res || !res.data || !Array.isArray(res.data.quests)) {
    throw new Error("Aucune sauvegarde trouvée dans l'ancien Google Sheets.");
  }
  const { _savedAt, ...data } = res.data;
  return { data, savedAt: Number(_savedAt) || 0 };
}
