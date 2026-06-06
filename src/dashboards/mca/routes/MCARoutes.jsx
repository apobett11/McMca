import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MCADashboardPage } from '../pages/MCADashboardPage.jsx';
import { MCAApplicationsPage } from '../pages/MCAApplicationsPage.jsx';
import { MCADocumentsPage } from '../pages/MCADocumentsPage.jsx';
import { MCANotificationsPage } from '../pages/MCANotificationsPage.jsx';
import { MCAProfilePage } from '../pages/MCAProfilePage.jsx';

export function MCARoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/mca/dashboard" replace />} />
      <Route path="/mca/dashboard" element={<MCADashboardPage />} />
      <Route path="/mca/applications" element={<MCAApplicationsPage />} />
      <Route path="/mca/documents" element={<MCADocumentsPage />} />
      <Route path="/mca/notifications" element={<MCANotificationsPage />} />
      <Route path="/mca/profile" element={<MCAProfilePage />} />
      <Route path="*" element={<Navigate to="/mca/dashboard" replace />} />
    </Routes>
  );
}
