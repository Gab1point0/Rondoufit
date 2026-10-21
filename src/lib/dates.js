export function addDaysISO(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalISODate(d);
}

export function getWeekStart(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toLocalISODate(d);
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
export const toLocalISODate = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const getTodayISODate = () => toLocalISODate(new Date());

export function getYesterdayISODate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalISODate(d);
}
