import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isCustodyStudent,
  isDelegatedStudent,
  isIndependentStudent,
  isDelegatedSetupComplete
} from './accountAllocation';
import { fetchStudentAccount } from './accountQueries';

/**
 * AccountGate enforces strict boundary gating on the student workspace.
 *
 * Operational & Security Rules:
 * 1. Fail-Closed Paradigm: Under no circumstances does AccountGate fail open on network error or null profile.
 * 2. Custody Students: Never permitted to mount or interact with the student dashboard. Their session
 *    is immediately terminated and they are instructed to sign in via their parent/guardian.
 * 3. Delegated Students: Permitted to access the portal ONLY after guardian setup is finalized.
 * 4. Independent Students: Permitted once verified 18+ with a valid profile.
 */
export function AccountGate({ children }) {
  const { user, role, signOut } = useAuth();
  const [checking, setChecking] = useState(true);
  const [gateState, setGateState] = useState({
    status: 'checking', // 'checking' | 'allowed' | 'custody_blocked' | 'delegated_pending' | 'profile_missing' | 'error' | 'unauthorized'
    message: ''
  });

  const evaluateAccess = useCallback(async () => {
    // Non-student roles (or unauthenticated sessions handled by ProtectedRoute) bypass this gate
    if (role !== 'student' || !user?.id) {
      setGateState({ status: 'allowed', message: '' });
      setChecking(false);
      return;
    }

    try {
      setChecking(true);
      const profile = await fetchStudentAccount(user.id);

      // Rule 1: Fail Closed on Missing Profile
      if (!profile) {
        setGateState({
          status: 'profile_missing',
          message: 'No active student profile was found for this user account. If you just registered, your record may still be provisioning.'
        });
        setChecking(false);
        return;
      }

      const studentClass = (profile.account_class || profile.student_type || '').toString().trim().toLowerCase();

      // Rule 2: Custody Students (CUS) MUST NEVER ACCESS STUDENT PORTAL
      if (isCustodyStudent(studentClass)) {
        await signOut().catch(() => {});
        setGateState({
          status: 'custody_blocked',
          message: 'Custody student accounts are managed directly by parents or legal guardians and cannot access the student portal. Please sign in using your parent or guardian credentials.'
        });
        setChecking(false);
        return;
      }

      // Rule 3: Delegated Students (DEL) Require Completed Guardian Setup
      if (isDelegatedStudent(studentClass) || profile.delegated_access) {
        const setupReady = isDelegatedSetupComplete(profile);
        if (setupReady) {
          setGateState({ status: 'allowed', message: '' });
        } else {
          setGateState({
            status: 'delegated_pending',
            message: 'Your delegated tertiary student account has been registered, but required institutional and contact details have not been finalized by your parent or guardian.'
          });
        }
        setChecking(false);
        return;
      }

      // Rule 4: Independent Students (IND) - Verified 18+
      if (isIndependentStudent(studentClass)) {
        setGateState({ status: 'allowed', message: '' });
        setChecking(false);
        return;
      }

      // Rule 5: Unclassified or Ambiguous Tier - Fail Closed
      setGateState({
        status: 'unauthorized',
        message: 'Your student account classification could not be verified. Please contact the Ward Bursary Help Desk for profile verification.'
      });
      setChecking(false);
    } catch (err) {
      console.error('[AccountGate] Security evaluation error:', err);
      // Fail closed: Do NOT allow access on network errors or PostgREST timeout
      setGateState({
        status: 'error',
        message: 'Unable to verify account authorization due to a network connection issue. Please check your connectivity and retry.'
      });
      setChecking(false);
    }
  }, [user?.id, role, signOut]);

  useEffect(() => {
    evaluateAccess();
  }, [evaluateAccess]);

  // Loading State
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1120',
        color: '#E2E8F0',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360, padding: 24 }}>
          <div style={{
            width: 44,
            height: 44,
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#94A3B8', fontSize: 14 }}>Verifying account authorization…</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Custody Students: Strictly Barred
  if (gateState.status === 'custody_blocked') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1120',
        color: '#E2E8F0',
        padding: 24,
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          maxWidth: 480,
          background: '#1E293B',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#EF4444',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            marginBottom: 16
          }}>
            ✕
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: '#F87171' }}>
            Portal Access Restricted
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {gateState.message}
          </p>
          <button
            type="button"
            onClick={() => {
              window.sessionStorage.clear();
              window.location.hash = '#/login';
              window.location.reload();
            }}
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Delegated Students: Incomplete Guardian Setup
  if (gateState.status === 'delegated_pending') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1120',
        color: '#E2E8F0',
        padding: 24,
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          maxWidth: 500,
          background: '#1E293B',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#F59E0B',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginBottom: 16
          }}>
            ⏳
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: '#FBBF24' }}>
            Delegated Account Setup Pending
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {gateState.message}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={evaluateAccess}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                background: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Check Setup Again
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut().catch(() => {});
                window.location.hash = '#/login';
              }}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#E2E8F0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile Missing or Fail-Closed Network Error
  if (gateState.status === 'profile_missing' || gateState.status === 'error' || gateState.status === 'unauthorized') {
    const isError = gateState.status === 'error';
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1120',
        color: '#E2E8F0',
        padding: 24,
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          maxWidth: 480,
          background: '#1E293B',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            color: isError ? '#EF4444' : '#F59E0B',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginBottom: 16
          }}>
            {isError ? '⚠️' : '🔒'}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: isError ? '#F87171' : '#FBBF24' }}>
            {isError ? 'Verification Failed' : 'Authorization Required'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {gateState.message}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={evaluateAccess}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                background: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Retry Check
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut().catch(() => {});
                window.location.hash = '#/login';
              }}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#E2E8F0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Allowed: Only verified independent or setup-complete delegated students render children
  return children;
}
