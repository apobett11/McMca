import React from 'react';
import { ParentLayout } from '../components/ParentLayout.jsx';

export function ParentDashboardPage() {
  return (
    <ParentLayout pageTitle="Dashboard" layout="dashboard">
      <h1>Parent Dashboard</h1>
      <p>Welcome to the parent dashboard.</p>
    </ParentLayout>
  );
}
