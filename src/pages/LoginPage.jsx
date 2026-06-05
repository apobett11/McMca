import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background, #0B1120)', fontFamily: 'var(--font-body, sans-serif)',
      padding: 24
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: 'var(--surface-elevated, #1E293B)',
        borderRadius: 24, padding: 32, border: '1px solid var(--glass-border)'
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'var(--text, #E2E8F0)' }}>Student Login</h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-2, #94A3B8)' }}>Sign in to access the student portal</p>
        {error && (
          <div style={{
            padding: '12px 16px', marginBottom: 16, borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 13, color: '#F87171'
          }}>{error}</div>
        )}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text, #E2E8F0)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@school.mail"
              required
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', fontFamily: 'inherit', outline: 'none'
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text, #E2E8F0)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', fontFamily: 'inherit', outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, border: 'none',
              background: 'var(--primary-fixed-dim, #1D4ED8)', color: 'white',
              fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3, #64748B)', textAlign: 'center' }}>
          Secure student portal. Use your registered email and password.
        </p>
      </div>
    </div>
  );
}