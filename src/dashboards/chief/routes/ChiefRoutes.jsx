import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChiefDashboardPage } from '../pages/ChiefDashboardPage.jsx';
import { ChiefApplicationsPage } from '../pages/ChiefApplicationsPage.jsx';
import { ChiefApplicationReviewPage } from '../pages/ChiefApplicationReviewPage.jsx';
import { ChiefAppealsPage } from '../pages/ChiefAppealsPage.jsx';
import { ChiefAppealReviewPage } from '../pages/ChiefAppealReviewPage.jsx';
import { ChiefProfilePage } from '../pages/ChiefProfilePage.jsx';

export function ChiefRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chief/dashboard" replace />} />
      <Route path="/chief/dashboard" element={<ChiefDashboardPage />} />
      <Route path="/chief/applications" element={<ChiefApplicationsPage />} />
      <Route path="/chief/application-review" element={<ChiefApplicationReviewPage />} />
      <Route path="/chief/appeals" element={<ChiefAppealsPage />} />
      <Route path="/chief/appeal-review" element={<ChiefAppealReviewPage />} />
      <Route path="/chief/profile" element={<ChiefProfilePage />} />
      <Route path="*" element={<Navigate to="/chief/dashboard" replace />} />
    </Routes>
  );
}
