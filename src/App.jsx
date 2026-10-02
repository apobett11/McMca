import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { hasSupabaseConfig } from './lib/supabase.js';
import { ProtectedRoute } from './lib/ProtectedRoute.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { AccountGate } from './lib/AccountGate.jsx';

// Import Dashboard Routers
import { StudentRoutes } from './dashboards/student/routes/StudentRoutes.jsx';
import { ParentRoutes } from './dashboards/parent/routes/ParentRoutes.jsx';
import { ChiefRoutes } from './dashboards/chief/routes/ChiefRoutes.jsx';
import { MCARoutes } from './dashboards/mca/routes/MCARoutes.jsx';

function RoleBasedRouter() {
  const { role, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!role) return <LoginPage />;

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
  if (!hasSupabaseConfig) {
    return <MissingSupabaseConfig />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            } />
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
    </ThemeProvider>
  );
}
