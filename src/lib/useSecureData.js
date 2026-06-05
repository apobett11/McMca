import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from './supabase';

export function useSecureData(fetchFn, deps = []) {
  const { userId, isAuthenticated, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(userId);
      if (mountedRef.current) {
        setData(result);
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        if (retryCountRef.current < 2) {
          retryCountRef.current += 1;
          setTimeout(fetchData, 1000 * retryCountRef.current);
          return;
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId, isAuthenticated, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    if (!authLoading) {
      fetchData();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [authLoading, fetchData]);

  const refresh = useCallback(() => {
    retryCountRef.current = 0;
    return fetchData();
  }, [fetchData]);

  return { data, error, loading, refresh };
}

export function useRealtimeSubscription(table, filterColumn, filterValue, onInsert) {
  const { isAuthenticated } = useAuth();
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !table) return;
    let query = supabase.channel(`${table}_changes`).on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table,
        filter: filterColumn && filterValue ? `${filterColumn}=eq.${filterValue}` : undefined
      },
      (payload) => {
        if (onInsert) onInsert(payload.new);
      }
    );
    subscriptionRef.current = query.subscribe();
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [table, filterColumn, filterValue, isAuthenticated]);
}
