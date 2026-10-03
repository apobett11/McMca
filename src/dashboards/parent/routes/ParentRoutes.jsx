import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ParentDashboardPage = lazy(() => import('../pages/ParentDashboardPage.jsx').then(m => ({ default: m.ParentDashboardPage })));
const ParentApplicationsPage = lazy(() => import('../pages/ParentApplicationsPage.jsx').then(m => ({ default: m.ParentApplicationsPage })));
const ParentDocumentsPage = lazy(() => import('../pages/ParentDocumentsPage.jsx').then(m => ({ default: m.ParentDocumentsPage })));
const ParentNotificationsPage = lazy(() => import('../pages/ParentNotificationsPage.jsx').then(m => ({ default: m.ParentNotificationsPage })));
const ParentProfilePage = lazy(() => import('../pages/ParentProfilePage.jsx').then(m => ({ default: m.ParentProfilePage })));
const ParentAddChildPage = lazy(() => import('../pages/ParentAddChildPage.jsx').then(m => ({ default: m.ParentAddChildPage })));
const ParentChildWizardPage = lazy(() => import('../pages/ParentChildWizardPage.jsx').then(m => ({ default: m.ParentChildWizardPage })));

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

export function ParentRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/parent/dashboard" replace />} />
        <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
        <Route path="/parent/applications" element={<ParentApplicationsPage />} />
        <Route path="/parent/documents" element={<ParentDocumentsPage />} />
        <Route path="/parent/notifications" element={<ParentNotificationsPage />} />
        <Route path="/parent/profile" element={<ParentProfilePage />} />
        <Route path="/parent/children/new" element={<ParentAddChildPage />} />
        <Route path="/parent/children/:childId" element={<ParentChildWizardPage />} />
        <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
