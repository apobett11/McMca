import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { hasSupabaseConfig } from './lib/supabase.js';
import { ProtectedRoute } from './lib/ProtectedRoute.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { AccountGate } from './lib/AccountGate.jsx';

// Lazy-loaded Dashboard Routers — load on command and cached by browser
const StudentRoutes = lazy(() => import('./dashboards/student/routes/StudentRoutes.jsx').then(m => ({ default: m.StudentRoutes })));
const ParentRoutes = lazy(() => import('./dashboards/parent/routes/ParentRoutes.jsx').then(m => ({ default: m.ParentRoutes })));
const ChiefRoutes = lazy(() => import('./dashboards/chief/routes/ChiefRoutes.jsx').then(m => ({ default: m.ChiefRoutes })));
const MCARoutes = lazy(() => import('./dashboards/mca/routes/MCARoutes.jsx').then(m => ({ default: m.MCARoutes })));

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
  );
}
