import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { hasSupabaseConfig } from './lib/supabase.js';
import { ProtectedRoute } from './lib/ProtectedRoute.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { AccountGate } from './lib/AccountGate.jsx';

// Dashboard Routers
import { StudentRoutes } from './dashboards/student/routes/StudentRoutes.jsx';
import { ParentRoutes } from './dashboards/parent/routes/ParentRoutes.jsx';
import { ChiefRoutes } from './dashboards/chief/routes/ChiefRoutes.jsx';
import { MCARoutes } from './dashboards/mca/routes/MCARoutes.jsx';
import { HelpDeskRoutes } from './dashboards/helpdesk/routes/HelpDeskRoutes.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1120',
          color: '#E2E8F0',
          padding: 24,
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>
            {isChunkError ? 'New update available' : 'Something went wrong'}
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: 420, marginBottom: 20, lineHeight: 1.5 }}>
            {isChunkError
              ? 'A newer version of the dashboard is available. Reload the page to load it.'
              : 'An unexpected error occurred while loading this view.'}
          </p>
          <button
            type="button"
            onClick={() => {
              window.sessionStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouterLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background, #0B1120)',
      color: 'var(--text, #E2E8F0)'
    }}>
      Loading...
    </div>
  );
}

function RoleBasedRouter() {
  const { role, loading } = useAuth();

  if (loading) {
    return <RouterLoadingFallback />;
  }

  if (!role) return <LoginPage />;

  return (
    <Suspense fallback={<RouterLoadingFallback />}>
      {(() => {
        switch (role) {
          case 'student':
            return <StudentRoutes />;
          case 'parent':
            return <ParentRoutes />;
          case 'chief':
            return <ChiefRoutes />;
          case 'mca':
            return <MCARoutes />;
          case 'helpdesk':
          case 'help_desk':
            return <HelpDeskRoutes />;
          default:
            return <Navigate to="/login" replace />;
        }
      })()}
    </Suspense>
  );
}

function MissingSupabaseConfig() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#0B1120',
      color: '#E2E8F0',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>Database connection is not configured</h1>
        <p style={{ lineHeight: 1.5, color: '#94A3B8' }}>
          This build has no browser-safe Supabase key. In Vercel → Settings → Environment Variables,
          set the <strong>publishable / anon</strong> key (starts with <code>sb_publishable_</code> or a JWT whose role is <code>anon</code>).
          Never put <code>sb_secret_</code> or the service role key in the frontend variables. Then Redeploy.
        </p>
        <ul style={{ lineHeight: 1.7, color: '#E2E8F0' }}>
          <li><code>VITE_SUPABASE_URL</code> — your project URL</li>
          <li><code>VITE_SUPABASE_ANON_KEY</code> — the anon / publishable key</li>
        </ul>
        <p style={{ lineHeight: 1.5, color: '#94A3B8' }}>
          Do not add the service role key. After saving, trigger a new deployment so Vite can bake the keys into the build.
        </p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {!hasSupabaseConfig ? (
          <MissingSupabaseConfig />
        ) : (
          <AuthProvider>
            <HashRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/onboarding" element={<Navigate to="/" replace />} />
                <Route path="/helpdesk/*" element={<HelpDeskRoutes />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AccountGate>
                      <RoleBasedRouter />
                    </AccountGate>
                  </ProtectedRoute>
                } />
              </Routes>
            </HashRouter>
          </AuthProvider>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
