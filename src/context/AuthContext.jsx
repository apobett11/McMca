import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  async function fetchUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('auth_user_id', userId)
        .single();
      if (!error && data) {
        setRole(data.role);
        return data.role;
      } else {
        setRole(null);
        return null;
      }
    } catch {
      setRole(null);
      return null;
    }
  }

  useEffect(() => {
    let active = true;

    async function initAuth() {
      try {
        setLoading(true);
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!active) return;

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await fetchUserRole(s.user.id);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Error during auth initialization', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return;
      setLoading(true);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchUserRole(s.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
  }, []);

  const value = {
    session,
    user,
    role,
    loading,
    signOut,
    isAuthenticated: !!session,
    isStudent: role === 'student',
    userId: user?.id
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
