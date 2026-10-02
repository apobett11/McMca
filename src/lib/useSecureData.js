import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from './supabase';
import { useCachedQuery } from './useCachedQuery';

export function useSecureData(fetchFn, deps = [], cacheName) {
  const { userId, isAuthenticated, loading: authLoading } = useAuth();
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;
  const name = cacheName || fetchFn.name || 'query';
  const depKey = deps.length ? JSON.stringify(deps) : '';
  const cacheKey = isAuthenticated && userId ? `${userId}:${name}${depKey ? `:${depKey}` : ''}` : null;
  const enabled = !authLoading && isAuthenticated && Boolean(userId);

  return useCachedQuery(
    cacheKey,
    () => fetchRef.current(userId),
    { enabled }
  );
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
