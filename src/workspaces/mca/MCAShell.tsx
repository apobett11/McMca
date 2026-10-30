import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MCALayout } from '../../dashboards/mca/components/MCALayout.jsx';
import { ToastProvider } from '../lib/toast.tsx';

export function MCAShell() {
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/applications')) return 'Applications';
    if (p.includes('/documents')) return 'Documents';
    if (p.includes('/disbursements')) return 'Disbursements';
    if (p.includes('/messages')) return 'Messages';
    if (p.includes('/profile')) return 'Profile';
    return 'Home';
  }, [location.pathname]);

  return (
    <ToastProvider>
      <MCALayout pageTitle={pageTitle} mcaName="Hon. Hillary Kiprotich Bett" layout="dashboard">
        <Outlet />
      </MCALayout>
    </ToastProvider>
  );
}
