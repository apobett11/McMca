import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './lib/ProtectedRoute.jsx';

import { DashboardPage } from './pages/DashboardPage.jsx';
import { ApplicationsPage } from './pages/ApplicationsPage.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { SupportPage } from './pages/SupportPage.jsx';

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
import { StudentMessagesPage } from './pages/student/StudentMessagesPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<SupportPage />} />

            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboardPage /></ProtectedRoute>} />
            <Route path="/student/applications" element={<ProtectedRoute requiredRole="student"><StudentApplicationsPage /></ProtectedRoute>} />
            <Route path="/student/documents" element={<ProtectedRoute requiredRole="student"><StudentDocumentsPage /></ProtectedRoute>} />
            <Route path="/student/new-application" element={<ProtectedRoute requiredRole="student"><StudentWizardPage /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute requiredRole="student"><StudentNotificationsPage /></ProtectedRoute>} />
            <Route path="/student/appeals" element={<ProtectedRoute requiredRole="student"><StudentAppealsPage /></ProtectedRoute>} />
            <Route path="/student/support" element={<ProtectedRoute requiredRole="student"><StudentSupportPage /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfilePage /></ProtectedRoute>} />
            <Route path="/student/messages" element={<ProtectedRoute requiredRole="student"><StudentMessagesPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />

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
      </AuthProvider>
    </ThemeProvider>
  );
}
