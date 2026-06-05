import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requiredRole = 'student' }) {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--background, #0B1120)',
        color: 'var(--text, #E2E8F0)',
        fontFamily: 'var(--font-body, sans-serif)'
      }}>
        <div className="skeleton-wrap" style={{ width: 320 }}>
          <div className="skeleton skeleton--hero" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line-short" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
