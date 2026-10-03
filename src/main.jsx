import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';
import './styles.css';

// Automatically reload if a dynamic import fails due to chunk hash mismatch after a new deployment
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

const rootEl = document.getElementById('app');
if (!rootEl) {
  throw new Error("Root element '#app' not found");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


