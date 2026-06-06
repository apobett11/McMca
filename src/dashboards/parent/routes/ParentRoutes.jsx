import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ParentDashboardPage } from '../pages/ParentDashboardPage.jsx';
import { ParentApplicationsPage } from '../pages/ParentApplicationsPage.jsx';
import { ParentDocumentsPage } from '../pages/ParentDocumentsPage.jsx';
import { ParentNotificationsPage } from '../pages/ParentNotificationsPage.jsx';
import { ParentProfilePage } from '../pages/ParentProfilePage.jsx';

export function ParentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/parent/dashboard" replace />} />
      <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
      <Route path="/parent/applications" element={<ParentApplicationsPage />} />
      <Route path="/parent/documents" element={<ParentDocumentsPage />} />
      <Route path="/parent/notifications" element={<ParentNotificationsPage />} />
      <Route path="/parent/profile" element={<ParentProfilePage />} />
      <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
    </Routes>
  );
}
