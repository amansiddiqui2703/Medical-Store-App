import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthGate } from './AuthGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AuthGate>
    <App />
  </AuthGate>
);

// Installable PWA support only. This worker does not cache data or enable offline billing.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('App install support could not be registered:', error);
    });
  });
}
