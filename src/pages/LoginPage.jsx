import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { assertPortalLoginAllowed } from '../lib/accountQueries';

export function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!supabase) {
        throw new Error('This site is not connected to the database yet.');
      }
      let loginEmail = identifier.trim();
      const isEmail = loginEmail.includes('@');
      if (!isEmail) {
        const cleanId = loginEmail.replace(/\D/g, '');
        // Check local id map first
        try {
          const map = JSON.parse(localStorage.getItem('mcmca_id_map') || '{}');
          if (map[cleanId]) {
            loginEmail = map[cleanId];
          }
        } catch {}

        if (!loginEmail.includes('@')) {
          try {
            const { data: student } = await supabase
              .from('student_profiles')
              .select('email')
              .eq('national_id', cleanId)
              .maybeSingle();
            if (student?.email) {
              loginEmail = student.email;
            } else {
              const { data: parent } = await supabase
                .from('parent_profiles')
                .select('email')
                .eq('national_id', cleanId)
                .maybeSingle();
              if (parent?.email) {
                loginEmail = parent.email;
              }
            }
          } catch {}
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signInError) throw signInError;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('No user found');

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();
      if (roleError || !roleData) {
        throw roleError || new Error('No role associated with this user');
      }

      const role = roleData.role;
      await assertPortalLoginAllowed(user.id, role);

      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'parent') navigate('/parent/dashboard');
      else if (role === 'chief') navigate('/chief/dashboard');
      else if (role === 'mca') navigate('/mca/dashboard');
      else throw new Error('Invalid user role');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 8,
    border: '1px solid var(--border, #334155)', background: 'var(--surface, #162032)',
    color: 'var(--text, #E2E8F0)', fontFamily: 'inherit', outline: 'none'
  };

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
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'var(--text, #E2E8F0)' }}>Sign in</h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-2, #94A3B8)' }}>Use the ID number and password you registered with.</p>
        {error && (
          <div style={{
            padding: '12px 16px', marginBottom: 16, borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 13, color: '#F87171'
          }}>{error}</div>
        )}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text, #E2E8F0)' }}>
              National ID number or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 40112233 or you@email.com"
              required
              style={fieldStyle}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text, #E2E8F0)' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={fieldStyle} />
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
          New here? <Link to="/register" style={{ color: 'var(--primary-fixed, #60A5FA)' }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
