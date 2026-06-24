import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { migrateEmbeddedAnswers } from './data/migrations/migrateEmbeddedAnswers';
import App from './App.tsx';

/* ═══════════════════════════════════════════════════════════════════════════
   Mount Point
   ───────────────────────────────────────────────────────────────────────────
   The top-level ErrorBoundary catches any synchronous throw that occurs
   during the initial render — including module-level import crashes from
   Dexie or other dependencies — ensuring a styled fallback screen appears
   instead of a completely blank white page.
   ═══════════════════════════════════════════════════════════════════════════ */

// Run one-time migration before mounting React
migrateEmbeddedAnswers().catch(() => {
  // Migration failures are non-fatal — the app will gracefully handle
  // missing answers via empty arrays from getSessionAnswers.
});

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:monospace;background:#080b14;color:#e8edf5;">
      <p>Fatal: #root element not found.</p>
    </div>`;
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary
        fallbackTitle="Critical Error"
        fallbackMessage="CISSP Edge failed to initialize. This is usually caused by a browser compatibility issue with the local database (IndexedDB)."
      >
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
