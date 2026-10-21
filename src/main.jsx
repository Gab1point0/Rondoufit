import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);

// Mode hors ligne : l'application reste utilisable sans réseau (salle de sport) une fois ouverte une première fois.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('Service worker indisponible', err));
  });
}
