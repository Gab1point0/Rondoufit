import { useEffect, useState } from 'react';

// ===== Souvenirs photo (stockés dans IndexedDB, hors sauvegarde principale) =====
export const PhotoDB = {
  _db: null,
  _mem: [],
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('rondoufit_photos', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
        r.onsuccess = () => { this._db = r.result; res(r.result); };
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  },
  async all() {
    try {
      const db = await this.open();
      return await new Promise((res, rej) => {
        const q = db.transaction('photos').objectStore('photos').getAll();
        q.onsuccess = () => res(q.result || []);
        q.onerror = () => rej(q.error);
      });
    } catch (e) { return this._mem.slice(); }
  },
  async put(p) {
    try {
      const db = await this.open();
      await new Promise((res, rej) => {
        const t = db.transaction('photos', 'readwrite');
        t.objectStore('photos').put(p);
        t.oncomplete = res; t.onerror = () => rej(t.error);
      });
    } catch (e) { this._mem = this._mem.filter(x => x.id !== p.id).concat(p); }
    window.dispatchEvent(new Event('rondoufit-photos'));
  },
  async del(id) {
    try {
      const db = await this.open();
      await new Promise((res, rej) => {
        const t = db.transaction('photos', 'readwrite');
        t.objectStore('photos').delete(id);
        t.oncomplete = res; t.onerror = () => rej(t.error);
      });
    } catch (e) { this._mem = this._mem.filter(x => x.id !== id); }
    window.dispatchEvent(new Event('rondoufit-photos'));
  }
};

export function usePhotos() {
  const [list, setList] = useState([]);
  useEffect(() => {
    let ok = true;
    const load = () => PhotoDB.all().then(a => { if (ok) setList(a); });
    load();
    window.addEventListener('rondoufit-photos', load);
    return () => { ok = false; window.removeEventListener('rondoufit-photos', load); };
  }, []);
  return list;
}

// Réduit la photo (≈ 900 px, JPEG) pour qu'elle reste légère.
function compressImage(file, maxSide = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}

export async function addPhotoFile(file, date, label) {
  const img = await compressImage(file);
  const p = { id: 'ph_' + Date.now() + '_' + Math.floor(Math.random() * 1000), date, label: label || '', note: '', img, createdAt: Date.now() };
  await PhotoDB.put(p);
  return p;
}
