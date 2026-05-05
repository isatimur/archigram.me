import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { init as initPlausible } from '@plausible-analytics/tracker';
import './app/globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import EditorWithProviders from '@/app/_components/EditorWithProviders';
import { initFirebaseAnalytics } from '@/lib/firebase/client';

Sentry.init({
  dsn:
    (import.meta.env.VITE_SENTRY_DSN as string | undefined) ||
    'https://6df6ce65adf446ef0199ed32eb46db69@o4509755805466624.ingest.de.sentry.io/4510818400862288',
  environment: import.meta.env.MODE || 'development',
  sendDefaultPii: import.meta.env.PROD === true,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED === 'true',
});

initPlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'archigram.me',
  endpoint: 'https://plausible.io/api/event',
});

initFirebaseAnalytics();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div
          style={{
            minHeight: '100vh',
            background: '#09090b',
            color: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            gap: 16,
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: '#a1a1aa', maxWidth: 480, textAlign: 'center' }}>
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={resetError}
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      )}
    >
      <AuthProvider>
        <EditorWithProviders />
      </AuthProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
