import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isCustodyStudent,
  isDelegatedStudent,
  isIndependentStudent,
  isDelegatedSetupComplete
} from './accountAllocation';
import { fetchStudentAccount } from './accountQueries';

export function AccountGate({ children }) {
  const { user, role, signOut } = useAuth();
  const [checking, setChecking] = useState(true);
  const [gateState, setGateState] = useState({
    status: 'allowed', // 'allowed' | 'custody_blocked' | 'delegated_pending' | 'profile_missing'
    message: ''
  });

  const evaluateAccess = useCallback(async () => {
    if (role !== 'student' || !user?.id) {
      setGateState({ status: 'allowed', message: '' });
      setChecking(false);
      return;
    }

    try {
      setChecking(true);
      const profile = await fetchStudentAccount(user.id);

      if (!profile) {
        // If student profile not yet created, allow independent onboarding flow or show setup
        setGateState({ status: 'allowed', message: '' });
        setChecking(false);
        return;
      }

      const studentClass = profile.account_class || profile.student_type;

      // 1. Custody: NEVER render student portal
      if (isCustodyStudent(studentClass)) {
        await signOut().catch(() => {});
        setGateState({
          status: 'custody_blocked',
          message: 'Custody student accounts are managed directly by parents or legal guardians and cannot access the student portal. Please sign in using your parent credentials.'
        });
        setChecking(false);
        return;
      }

      // 2. Delegated: render ONLY when details are correct and set up
      if (isDelegatedStudent(studentClass) || profile.delegated_access) {
        const setupReady = isDelegatedSetupComplete(profile);
        if (setupReady) {
          setGateState({ status: 'allowed', message: '' });
        } else {
          setGateState({
            status: 'delegated_pending',
            message: 'Your delegated student account has been registered, but required profile details (institution and contact records) have not been finalized by your parent or guardian yet.'
          });
        }
        setChecking(false);
        return;
      }

      // 3. Independent: ALWAYS render
      if (isIndependentStudent(studentClass) || !studentClass) {
        setGateState({ status: 'allowed', message: '' });
        setChecking(false);
        return;
      }

      // Default safe fallback
      setGateState({ status: 'allowed', message: '' });
    } catch (err) {
      console.warn('AccountGate check error:', err);
      // Graceful fallback: do not lock out independent students on network hiccups
      setGateState({ status: 'allowed', message: '' });
    } finally {
      setChecking(false);
    }
  }, [user?.id, role, signOut]);

  useEffect(() => {
    evaluateAccess();
  }, [evaluateAccess]);

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background, #0B1120)',
        color: 'var(--text, #E2E8F0)',
        fontFamily: 'var(--font-body, sans-serif)'
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

  // Custody students: never render
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

  // Delegated students with incomplete details: do not render until set up
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

  // Independent students render always; Delegated render once set up
  return children;
}
