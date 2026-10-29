import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Redesigned Help Desk workspace (Tailwind + TypeScript) – see src/workspaces/helpdesk
import { HelpDeskShell } from '../../../workspaces/helpdesk/HelpDeskShell.tsx';
import { DashboardPage } from '../../../workspaces/helpdesk/pages/DashboardPage.tsx';
import { DocumentsPage } from '../../../workspaces/helpdesk/pages/DocumentsPage.tsx';
import { ApplicationsPage } from '../../../workspaces/helpdesk/pages/ApplicationsPage.tsx';
import { MessagesPage } from '../../../workspaces/helpdesk/pages/MessagesPage.tsx';
import { ProfilePage } from '../../../workspaces/helpdesk/pages/ProfilePage.tsx';

export function HelpDeskRoutes() {
  return (
    <Routes>
      <Route element={<HelpDeskShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="institutions" element={<Navigate to="/helpdesk/applications" replace />} />
        <Route path="*" element={<Navigate to="/helpdesk/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
