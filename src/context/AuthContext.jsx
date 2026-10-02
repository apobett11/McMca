import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { clearQueryCache } from '../lib/queryCache';

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
    let booting = true;
    let roleFor = null;
    let rolePromise = null;

    function applySession(nextSession) {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      return nextSession?.user ?? null;
    }

    function ensureRole(userId) {
      if (!userId) {
        roleFor = null;
        rolePromise = null;
        setRole(null);
        return Promise.resolve(null);
      }
      if (roleFor === userId && rolePromise) return rolePromise;
      roleFor = userId;
      rolePromise = fetchUserRole(userId);
      return rolePromise;
    }

    async function initAuth() {
      try {
        if (!supabase) return;
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!active) return;
        const current = applySession(s);
        if (current) await ensureRole(current.id);
        else setRole(null);
      } catch (err) {
        console.error('Error during auth initialization', err);
      } finally {
        booting = false;
        if (active) setLoading(false);
      }
    }

    initAuth();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;

      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        applySession(s);
        return;
      }

      if (event === 'SIGNED_OUT') {
        clearQueryCache();
        applySession(null);
        roleFor = null;
        rolePromise = null;
        setRole(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN') {
        const current = applySession(s);
        if (booting || !current || roleFor === current.id) return;
        setTimeout(() => {
          if (!active) return;
          ensureRole(current.id).finally(() => {
            if (active) setLoading(false);
          });
        }, 0);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    clearQueryCache();
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
  }, []);

  const refreshRole = useCallback(async () => {
    if (!supabase) return null;
    const { data: { user: current } } = await supabase.auth.getUser();
    if (!current) {
      setRole(null);
      return null;
    }
    return fetchUserRole(current.id);
  }, []);

  const value = {
    session,
    user,
    role,
    loading,
    signOut,
    refreshRole,
    isAuthenticated: !!session,
    isStudent: role === 'student',
    isParent: role === 'parent',
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
