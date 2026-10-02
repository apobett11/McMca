import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ACCOUNT_STATUS, readAccountStatus } from './accountAllocation';
import { fetchParentAccount, fetchStudentAccount } from './accountQueries';

export function AccountGate({ children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id || !role) {
        setChecking(false);
        return;
      }
      try {
        const data = role === 'parent'
          ? await fetchParentAccount(user.id)
          : role === 'student'
            ? await fetchStudentAccount(user.id)
            : { is_active: true, account_status: ACCOUNT_STATUS.ACTIVE, national_id_verified: true };
        if (active) setProfile(data);
      } catch {
        if (active) {
          setProfile({ is_active: true, account_status: ACCOUNT_STATUS.ACTIVE, national_id_verified: true });
        }
      } finally {
        if (active) setChecking(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user?.id, role]);

  if (loading || checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--background, #0B1120)', color: 'var(--text)'
      }}>
        Restoring your account…
      </div>
    );
  }

  if (role !== 'student' && role !== 'parent') {
    return children;
  }

  const status = readAccountStatus(profile || {});
  const onOnboarding = location.pathname.includes('/onboarding') || location.hash.includes('/onboarding');

  if (!profile) {
    return <Navigate to="/register" replace />;
  }

  if (status !== ACCOUNT_STATUS.ACTIVE && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
