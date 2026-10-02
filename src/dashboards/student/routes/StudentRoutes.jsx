import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StudentDashboardPage } from '../pages/StudentDashboardPage.jsx';
import { StudentApplicationsPage } from '../pages/StudentApplicationsPage.jsx';
import { StudentDocumentsPage } from '../pages/StudentDocumentsPage.jsx';
import { StudentFormsPage } from '../pages/StudentFormsPage.jsx';
import { StudentNotificationsPage } from '../pages/StudentNotificationsPage.jsx';
import { StudentAppealsPage } from '../pages/StudentAppealsPage.jsx';
import { StudentSupportPage } from '../pages/StudentSupportPage.jsx';
import { StudentProfilePage } from '../pages/StudentProfilePage.jsx';
import { StudentMessagesPage } from '../pages/StudentMessagesPage.jsx';
import { StudentLinkParentsPage } from '../pages/StudentLinkParentsPage.jsx';

export function StudentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/student/dashboard" element={<StudentDashboardPage />} />
      <Route path="/student/forms" element={<StudentFormsPage />} />
      <Route path="/student/applications" element={<StudentApplicationsPage />} />
      <Route path="/student/documents" element={<StudentDocumentsPage />} />
      <Route path="/student/new-application" element={<Navigate to="/student/forms" replace />} />
      <Route path="/student/notifications" element={<StudentNotificationsPage />} />
      <Route path="/student/appeals" element={<StudentAppealsPage />} />
      <Route path="/student/support" element={<StudentSupportPage />} />
      <Route path="/student/profile" element={<StudentProfilePage />} />
      <Route path="/student/messages" element={<StudentMessagesPage />} />
      <Route path="/student/link-parents" element={<StudentLinkParentsPage />} />
      <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
    </Routes>
  );
}
