import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import './index.css';

// Dopo un nuovo deploy il telefono può avere in cache file vecchi: si ricarica una volta sola.
const hadController = !!navigator.serviceWorker?.controller;
let reloaded = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (hadController && !reloaded) {
    reloaded = true;
    window.location.reload();
  }
});
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('irontrack:preload-reload')) return;
  sessionStorage.setItem('irontrack:preload-reload', '1');
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);
