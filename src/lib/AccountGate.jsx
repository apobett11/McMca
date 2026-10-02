import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canStudentLogin } from './accountAllocation';
import { fetchStudentAccount } from './accountQueries';

export function AccountGate({ children }) {
  const { user, role, signOut } = useAuth();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      if (role !== 'student' || !user?.id) {
        if (active) setBlocked(false);
        return;
      }
      try {
        const profile = await fetchStudentAccount(user.id);
        if (!active) return;
        if (profile && !canStudentLogin(profile.account_class)) {
          await signOut();
          if (active) setBlocked(true);
        }
      } catch {
        if (active) setBlocked(false);
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [user?.id, role, signOut]);

  if (blocked) return <Navigate to="/login" replace />;
  return children;
}
