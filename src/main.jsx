import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Registrar SW auto-eliminador para limpiar viejos SWs de vite-plugin-pwa
// que pueden servir index.html cacheado con chunks obsoletos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/dev-sw.js').catch(() => {});
}

// Auto-reload cuando un chunk dinámico no se puede cargar (stale deployment)
// Esto ocurre cuando el browser tiene el index.html viejo en caché y los chunks
// ya no existen en el servidor porque se hizo un nuevo deploy
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message ?? '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  ) {
    // Evitar loop infinito: solo recargar una vez
    const reloadKey = 'chunk_reload_ts';
    const lastReload = Number(sessionStorage.getItem(reloadKey) ?? 0);
    const now = Date.now();
    if (now - lastReload > 10_000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
    }
  }
});

// Aplicación principal del Dashboard Organizaci�n RDJ
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
