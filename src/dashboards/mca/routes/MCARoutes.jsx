import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MCADashboardPage } from '../pages/MCADashboardPage.jsx';
import { MCAApplicationsPage } from '../pages/MCAApplicationsPage.jsx';
import { MCAMessagesPage } from '../pages/MCAMessagesPage.jsx';
import { MCAProfilePage } from '../pages/MCAProfilePage.jsx';

export function MCARoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<MCADashboardPage />} />
      <Route path="applications" element={<MCAApplicationsPage />} />
      <Route path="messages" element={<MCAMessagesPage />} />
      <Route path="profile" element={<MCAProfilePage />} />
      {/* Root path variants */}
      <Route path="/mca" element={<Navigate to="dashboard" replace />} />
      <Route path="/mca/dashboard" element={<MCADashboardPage />} />
      <Route path="/mca/applications" element={<MCAApplicationsPage />} />
      <Route path="/mca/messages" element={<MCAMessagesPage />} />
      <Route path="/mca/profile" element={<MCAProfilePage />} />
      {/* Backward-compat & sanitized redirects */}
      <Route path="institutes" element={<Navigate to="/mca/applications" replace />} />
      <Route path="issues" element={<Navigate to="/mca/applications" replace />} />
      <Route path="developments" element={<Navigate to="/mca/applications" replace />} />
      <Route path="/mca/institutes" element={<Navigate to="/mca/applications" replace />} />
      <Route path="/mca/issues" element={<Navigate to="/mca/applications" replace />} />
      <Route path="/mca/developments" element={<Navigate to="/mca/applications" replace />} />
      <Route path="documents" element={<Navigate to="applications" replace />} />
      <Route path="notifications" element={<Navigate to="messages" replace />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
