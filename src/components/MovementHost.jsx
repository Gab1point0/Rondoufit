import { lazy, Suspense, useEffect, useState } from 'react';

// Les animations (une centaine de scènes + textes) pèsent lourd : on ne les charge qu'à la première ouverture
// (ou quand le navigateur est au repos, pour que l'ouverture soit ensuite instantanée).
const loadPreview = () => import('./MovementPreview');
const Preview = lazy(() => loadPreview().then(m => ({ default: m.MovementPreview })));

export function MovementHost() {
  const [first, setFirst] = useState(null);

  useEffect(() => {
    const h = e => setFirst(prev => prev || { detail: e.detail || {} });
    window.addEventListener('rondoufit-movement', h);
    let t;
    const idle = window.requestIdleCallback ? window.requestIdleCallback(() => loadPreview().catch(() => {}), { timeout: 8000 }) : (t = setTimeout(() => loadPreview().catch(() => {}), 4000));
    return () => {
      window.removeEventListener('rondoufit-movement', h);
      if (window.cancelIdleCallback && idle) window.cancelIdleCallback(idle);
      clearTimeout(t);
    };
  }, []);

  if (!first) return null;
  return <Suspense fallback={null}><Preview initial={first.detail} /></Suspense>;
}
