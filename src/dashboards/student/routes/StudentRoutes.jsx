import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const StudentDashboardPage = lazy(() => import('../pages/StudentDashboardPage.jsx').then(m => ({ default: m.StudentDashboardPage })));
const StudentApplicationsPage = lazy(() => import('../pages/StudentApplicationsPage.jsx').then(m => ({ default: m.StudentApplicationsPage })));
const StudentFormsPage = lazy(() => import('../pages/StudentFormsPage.jsx').then(m => ({ default: m.StudentFormsPage })));
const StudentNotificationsPage = lazy(() => import('../pages/StudentNotificationsPage.jsx').then(m => ({ default: m.StudentNotificationsPage })));
const StudentAppealsPage = lazy(() => import('../pages/StudentAppealsPage.jsx').then(m => ({ default: m.StudentAppealsPage })));
const StudentSupportPage = lazy(() => import('../pages/StudentSupportPage.jsx').then(m => ({ default: m.StudentSupportPage })));
const StudentProfilePage = lazy(() => import('../pages/StudentProfilePage.jsx').then(m => ({ default: m.StudentProfilePage })));
const StudentMessagesPage = lazy(() => import('../pages/StudentMessagesPage.jsx').then(m => ({ default: m.StudentMessagesPage })));
const StudentLinkParentsPage = lazy(() => import('../pages/StudentLinkParentsPage.jsx').then(m => ({ default: m.StudentLinkParentsPage })));

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

export function StudentRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/forms" element={<StudentFormsPage />} />
        <Route path="/student/applications" element={<StudentApplicationsPage />} />
        <Route path="/student/documents" element={<StudentFormsPage />} />
        <Route path="/student/new-application" element={<Navigate to="/student/forms" replace />} />
        <Route path="/student/notifications" element={<StudentNotificationsPage />} />
        <Route path="/student/appeals" element={<StudentAppealsPage />} />
        <Route path="/student/support" element={<StudentSupportPage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
        <Route path="/student/messages" element={<StudentMessagesPage />} />
        <Route path="/student/link-parents" element={<StudentLinkParentsPage />} />
        <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
