import { useEffect, useRef, useState } from 'react';

export function useToast() {
  // Toast RPG Pokémon
  const [toast, setToast] = useState(null);

  const toastQueueRef = useRef([]);

  const triggerToast = (title, subtitle, xpGain = 0, badge = '🎵') => {
    const t = { title, subtitle, xpGain, badge, id: Date.now() + Math.random() };
    setToast(cur => {
      if (cur) { toastQueueRef.current.push(t); return cur; }
      return t;
    });
  };

  const dismissToast = () => setToast(toastQueueRef.current.shift() || null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 4500);
    return () => clearTimeout(t);
  }, [toast]);

  return { toast, triggerToast, dismissToast };
}
