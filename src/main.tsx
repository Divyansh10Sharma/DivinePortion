import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { initServiceWorker } from './lib/swUpdate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Only in production builds: the dev server doesn't serve a service worker.
if (import.meta.env.PROD) initServiceWorker();
