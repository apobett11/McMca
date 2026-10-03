import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ChiefDashboardPage = lazy(() => import('../pages/ChiefDashboardPage.jsx').then(m => ({ default: m.ChiefDashboardPage })));
const ChiefApplicationsPage = lazy(() => import('../pages/ChiefApplicationsPage.jsx').then(m => ({ default: m.ChiefApplicationsPage })));
const ChiefApplicationReviewPage = lazy(() => import('../pages/ChiefApplicationReviewPage.jsx').then(m => ({ default: m.ChiefApplicationReviewPage })));
const ChiefAppealsPage = lazy(() => import('../pages/ChiefAppealsPage.jsx').then(m => ({ default: m.ChiefAppealsPage })));
const ChiefAppealReviewPage = lazy(() => import('../pages/ChiefAppealReviewPage.jsx').then(m => ({ default: m.ChiefAppealReviewPage })));
const ChiefProfilePage = lazy(() => import('../pages/ChiefProfilePage.jsx').then(m => ({ default: m.ChiefProfilePage })));

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

export function ChiefRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/chief/dashboard" replace />} />
        <Route path="/chief/dashboard" element={<ChiefDashboardPage />} />
        <Route path="/chief/applications" element={<ChiefApplicationsPage />} />
        <Route path="/chief/application-review" element={<ChiefApplicationReviewPage />} />
        <Route path="/chief/appeals" element={<ChiefAppealsPage />} />
        <Route path="/chief/appeal-review" element={<ChiefAppealReviewPage />} />
        <Route path="/chief/profile" element={<ChiefProfilePage />} />
        <Route path="*" element={<Navigate to="/chief/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
