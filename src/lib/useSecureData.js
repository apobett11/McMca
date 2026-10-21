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

export function useRealtimeSubscription() {
  // Realtime subscriptions disabled: system operates via standard DB queries and user-initiated refreshes.
}

