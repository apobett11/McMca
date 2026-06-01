import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';

import { DashboardPage } from './pages/DashboardPage.jsx';
import { ApplicationsPage } from './pages/ApplicationsPage.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';

import { ChiefDashboardPage } from './pages/chief/ChiefDashboardPage.jsx';
import { ChiefApplicationsPage } from './pages/chief/ChiefApplicationsPage.jsx';
import { ChiefApplicationReviewPage } from './pages/chief/ChiefApplicationReviewPage.jsx';
import { ChiefAppealsPage } from './pages/chief/ChiefAppealsPage.jsx';
import { ChiefAppealReviewPage } from './pages/chief/ChiefAppealReviewPage.jsx';
import { ChiefProfilePage } from './pages/chief/ChiefProfilePage.jsx';

import { StudentDashboardPage } from './pages/student/StudentDashboardPage.jsx';
import { StudentApplicationsPage } from './pages/student/StudentApplicationsPage.jsx';
import { StudentDocumentsPage } from './pages/student/StudentDocumentsPage.jsx';
import { StudentWizardPage } from './pages/student/StudentWizardPage.jsx';
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage.jsx';
import { StudentAppealsPage } from './pages/student/StudentAppealsPage.jsx';
import { StudentSupportPage } from './pages/student/StudentSupportPage.jsx';
import { StudentProfilePage } from './pages/student/StudentProfilePage.jsx';
import { MessagesPage } from './pages/MessagesPage.jsx';

export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/applications" element={<StudentApplicationsPage />} />
          <Route path="/student/documents" element={<StudentDocumentsPage />} />
          <Route path="/student/new-application" element={<StudentWizardPage />} />
          <Route path="/student/notifications" element={<StudentNotificationsPage />} />
          <Route path="/student/appeals" element={<StudentAppealsPage />} />
          <Route path="/student/support" element={<StudentSupportPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student/messages" element={<MessagesPage />} />

          <Route path="/chief" element={<Navigate to="/chief/dashboard" replace />} />
          <Route path="/chief/dashboard" element={<ChiefDashboardPage />} />
          <Route path="/chief/applications" element={<ChiefApplicationsPage />} />
          <Route path="/chief/applications/:applicationId" element={<ChiefApplicationReviewPage />} />
          <Route path="/chief/appeals" element={<ChiefAppealsPage />} />
          <Route path="/chief/appeals/:appealId" element={<ChiefAppealReviewPage />} />
          <Route path="/chief/profile" element={<ChiefProfilePage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
