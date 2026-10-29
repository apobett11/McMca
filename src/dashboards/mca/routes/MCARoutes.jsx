import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Redesigned MCA Executive workspace (Tailwind + TypeScript) – see src/workspaces/mca
import { MCAShell } from '../../../workspaces/mca/MCAShell.tsx';
import { DashboardPage } from '../../../workspaces/mca/pages/DashboardPage.tsx';
import { ApplicationsPage } from '../../../workspaces/mca/pages/ApplicationsPage.tsx';
import { DisbursementsPage } from '../../../workspaces/mca/pages/DisbursementsPage.tsx';
import { AppealsPage } from '../../../workspaces/mca/pages/AppealsPage.tsx';
import { MessagesPage } from '../../../workspaces/mca/pages/MessagesPage.tsx';
import { ProfilePage } from '../../../workspaces/mca/pages/ProfilePage.tsx';

export function MCARoutes() {
  return (
    <Routes>
      <Route element={<MCAShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/anomalies" element={<Navigate to="/mca/applications?view=anomalies" replace />} />
        <Route path="disbursements" element={<DisbursementsPage />} />
        <Route path="appeals" element={<AppealsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        {/* Backward-compat redirects */}
        <Route path="institutes" element={<Navigate to="/mca/disbursements" replace />} />
        <Route path="issues" element={<Navigate to="/mca/appeals" replace />} />
        <Route path="developments" element={<Navigate to="/mca/applications" replace />} />
        <Route path="documents" element={<Navigate to="/mca/applications" replace />} />
        <Route path="notifications" element={<Navigate to="/mca/messages" replace />} />
        <Route path="*" element={<Navigate to="/mca/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
