import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './lib/ProtectedRoute.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

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

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <RoleBasedRouter />
              </ProtectedRoute>
            } />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
