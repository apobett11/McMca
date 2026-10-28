import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { hasSupabaseConfig } from './lib/supabase.js';
import { ProtectedRoute } from './lib/ProtectedRoute.jsx';
import { AccountGate } from './lib/AccountGate.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { GuestPage } from './pages/GuestPage.jsx';

// Code-split dashboard routers for optimal load performance
const StudentRoutes = lazy(() =>
  import('./dashboards/student/routes/StudentRoutes.jsx').then((m) => ({ default: m.StudentRoutes }))
);
const ParentRoutes = lazy(() =>
  import('./dashboards/parent/routes/ParentRoutes.jsx').then((m) => ({ default: m.ParentRoutes }))
);
const ChiefRoutes = lazy(() =>
  import('./dashboards/chief/routes/ChiefRoutes.jsx').then((m) => ({ default: m.ChiefRoutes }))
);
const MCARoutes = lazy(() =>
  import('./dashboards/mca/routes/MCARoutes.jsx').then((m) => ({ default: m.MCARoutes }))
);
const HelpDeskRoutes = lazy(() =>
  import('./dashboards/helpdesk/routes/HelpDeskRoutes.jsx').then((m) => ({ default: m.HelpDeskRoutes }))
);

/**
 * Global Error Boundary catching unexpected runtime issues in UI trees.
 */
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

  handleReload = () => {
    window.sessionStorage.clear();
    window.location.reload();
  };

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
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: isChunkError ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isChunkError ? '#60A5FA' : '#F87171',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            marginBottom: 16
          }}>
            {isChunkError ? '⟳' : '!'}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {isChunkError ? 'New update available' : 'Something went wrong'}
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: 420, marginBottom: 20, lineHeight: 1.5, fontSize: 14 }}>
            {isChunkError
              ? 'A newer version of the dashboard is available. Reload the page to load it.'
              : 'An unexpected error occurred while loading this view. Try reloading or return to login.'}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                background: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Reload Page
            </button>
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.clear();
                window.location.hash = '#/login';
                window.location.reload();
              }}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#E2E8F0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Standard Loading Fallback for Suspense transitions
 */
function RouterLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background, #0B1120)',
      color: 'var(--text, #E2E8F0)',
      fontFamily: 'var(--font-body, sans-serif)'
    }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px'
        }} />
        <p style={{ color: '#94A3B8', fontSize: 13, letterSpacing: '0.02em' }}>Loading portal…</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/**
 * Helper to determine default home dashboard path by user role
 */
export function getRoleDashboardPath(role) {
  switch (role) {
    case 'student':
      return '/student/dashboard';
    case 'parent':
      return '/parent/dashboard';
    case 'chief':
      return '/chief/dashboard';
    case 'mca':
      return '/mca/dashboard';
    case 'helpdesk':
    case 'help_desk':
      return '/helpdesk/dashboard';
    default:
      return '/login';
  }
}

/**
 * Redirects authenticated users away from public pages (e.g. login, register)
 * to their respective role dashboard.
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <RouterLoadingFallback />;
  if (isAuthenticated && role) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }
  return children;
}

/**
 * Landing page handler: redirects authenticated users to their role portal,
 * and unauthenticated visitors to the public guest portal.
 */
function HomeRoute() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <RouterLoadingFallback />;
  if (isAuthenticated && role) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }
  return <GuestPage />;
}

/**
 * Catch-all route to handle 404s and redirect to the correct home
 */
function CatchAllRoute() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <RouterLoadingFallback />;
  if (isAuthenticated && role) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }
  return <Navigate to="/" replace />;
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
          This build has no browser-safe Supabase key. In your environment settings,
          set the publishable/anon key (starts with <code>sb_publishable_</code> or a JWT with role <code>anon</code>).
        </p>
        <ul style={{ lineHeight: 1.7, color: '#E2E8F0', paddingLeft: 20 }}>
          <li><code>VITE_SUPABASE_URL</code> — your project URL</li>
          <li><code>VITE_SUPABASE_ANON_KEY</code> — the anon / publishable key</li>
        </ul>
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
              <Suspense fallback={<RouterLoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/guest" element={<GuestPage />} />
                  <Route
                    path="/login"
                    element={
                      <PublicOnlyRoute>
                        <LoginPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicOnlyRoute>
                        <RegisterPage />
                      </PublicOnlyRoute>
                    }
                  />

                  {/*
                    Student portal:
                    1. Protected: only accessible to role='student'
                    2. AccountGate:
                       - Independent: renders always
                       - Delegated: renders when details are correct and set up
                       - Custody: never renders
                  */}
                  <Route
                    path="/student/*"
                    element={
                      <ProtectedRoute requiredRole="student">
                        <AccountGate>
                          <StudentRoutes />
                        </AccountGate>
                      </ProtectedRoute>
                    }
                  />

                  {/* Parent portal */}
                  <Route
                    path="/parent/*"
                    element={
                      <ProtectedRoute requiredRole="parent">
                        <ParentRoutes />
                      </ProtectedRoute>
                    }
                  />

                  {/* Chief portal */}
                  <Route
                    path="/chief/*"
                    element={
                      <ProtectedRoute requiredRole="chief">
                        <ChiefRoutes />
                      </ProtectedRoute>
                    }
                  />

                  {/* MCA portal */}
                  <Route
                    path="/mca/*"
                    element={
                      <ProtectedRoute requiredRole="mca">
                        <MCARoutes />
                      </ProtectedRoute>
                    }
                  />

                  {/* Help Desk portal */}
                  <Route
                    path="/helpdesk/*"
                    element={
                      <ProtectedRoute requiredRole={['helpdesk', 'help_desk']}>
                        <HelpDeskRoutes />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch-all fallback */}
                  <Route path="*" element={<CatchAllRoute />} />
                </Routes>
              </Suspense>
            </HashRouter>
          </AuthProvider>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
