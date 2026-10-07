import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelpDeskDashboardPage } from '../pages/HelpDeskDashboardPage.jsx';
import { HelpDeskDocumentsPage } from '../pages/HelpDeskDocumentsPage.jsx';
import { HelpDeskApplicationsPage } from '../pages/HelpDeskApplicationsPage.jsx';
import { HelpDeskMessagesPage } from '../pages/HelpDeskMessagesPage.jsx';
import { HelpDeskProfilePage } from '../pages/HelpDeskProfilePage.jsx';

export function HelpDeskRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/helpdesk/dashboard" replace />} />
      <Route path="dashboard" element={<HelpDeskDashboardPage />} />
      <Route path="documents" element={<HelpDeskDocumentsPage />} />
      <Route path="applications" element={<HelpDeskApplicationsPage />} />
      <Route path="messages" element={<HelpDeskMessagesPage />} />
      <Route path="profile" element={<HelpDeskProfilePage />} />
      <Route path="/helpdesk/dashboard" element={<HelpDeskDashboardPage />} />
      <Route path="/helpdesk/documents" element={<HelpDeskDocumentsPage />} />
      <Route path="/helpdesk/applications" element={<HelpDeskApplicationsPage />} />
      <Route path="/helpdesk/messages" element={<HelpDeskMessagesPage />} />
      <Route path="/helpdesk/profile" element={<HelpDeskProfilePage />} />
      <Route path="*" element={<Navigate to="/helpdesk/dashboard" replace />} />
    </Routes>
  );
}
