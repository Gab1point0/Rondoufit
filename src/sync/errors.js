/** Erreur du service de sauvegarde (status HTTP : 409 = la version a changé ailleurs, le moteur relit et fusionne). */
export class SyncError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
