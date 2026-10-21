import { useRef, useState } from 'react';
import { addPhotoFile } from '../../lib/photos';

export function PhotoAddButton({ date, label, className, children, onAdded }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const onPick = async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try { for (const f of files) { const p = await addPhotoFile(f, date, label); onAdded && onAdded(p); } }
    catch (err) { window.alert('Impossible de lire cette image.'); }
    setBusy(false);
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple onChange={onPick} className="hidden" data-testid="photo-input" />
      <button type="button" disabled={busy} onClick={() => ref.current && ref.current.click()} className={className}>
        {busy ? 'Enregistrement…' : children}
      </button>
    </>
  );
}
