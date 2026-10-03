import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const MCADashboardPage = lazy(() => import('../pages/MCADashboardPage.jsx').then(m => ({ default: m.MCADashboardPage })));
const MCAApplicationsPage = lazy(() => import('../pages/MCAApplicationsPage.jsx').then(m => ({ default: m.MCAApplicationsPage })));
const MCADocumentsPage = lazy(() => import('../pages/MCADocumentsPage.jsx').then(m => ({ default: m.MCADocumentsPage })));
const MCANotificationsPage = lazy(() => import('../pages/MCANotificationsPage.jsx').then(m => ({ default: m.MCANotificationsPage })));
const MCAProfilePage = lazy(() => import('../pages/MCAProfilePage.jsx').then(m => ({ default: m.MCAProfilePage })));

function RouteFallback() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#94A3B8'
    }}>
      Loading…
    </div>
  );
}

export function MCARoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/mca/dashboard" replace />} />
        <Route path="/mca/dashboard" element={<MCADashboardPage />} />
        <Route path="/mca/applications" element={<MCAApplicationsPage />} />
        <Route path="/mca/documents" element={<MCADocumentsPage />} />
        <Route path="/mca/notifications" element={<MCANotificationsPage />} />
        <Route path="/mca/profile" element={<MCAProfilePage />} />
        <Route path="*" element={<Navigate to="/mca/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
