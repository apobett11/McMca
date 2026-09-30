import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { McaProvider } from '../context/McaContext.jsx';
import { MCADashboardPage } from '../pages/MCADashboardPage.jsx';
import { MCAApplicationsPage } from '../pages/MCAApplicationsPage.jsx';
import { MCAProfilePage } from '../pages/MCAProfilePage.jsx';

export function MCARoutes() {
  return (
    <McaProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/mca/dashboard" replace />} />
        <Route path="/mca/dashboard" element={<MCADashboardPage />} />
        <Route path="/mca/applications" element={<MCAApplicationsPage />} />
        <Route path="/mca/profile" element={<MCAProfilePage />} />
        <Route path="*" element={<Navigate to="/mca/dashboard" replace />} />
      </Routes>
    </McaProvider>
  );
}
