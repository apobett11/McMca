import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { HelpDeskLayout } from '../../dashboards/helpdesk/components/HelpDeskLayout.jsx';
import { ToastProvider } from '../lib/toast.tsx';

export function HelpDeskShell() {
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/applications')) return 'Applications';
    if (p.includes('/documents')) return 'Documents';
    if (p.includes('/messages')) return 'Messages';
    if (p.includes('/profile')) return 'Profile';
    return 'Home';
  }, [location.pathname]);

  return (
    <ToastProvider>
      <HelpDeskLayout pageTitle={pageTitle} officerName="Clara Chelangat" layout="dashboard">
        <Outlet />
      </HelpDeskLayout>
    </ToastProvider>
  );
}
