import { useCallback, useEffect, useRef, useState } from 'react';
import { readQueryCache, writeQueryCache } from './queryCache';

async function loadWithRetry(fetcher) {
  try {
    return await fetcher();
  } catch (err) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return fetcher();
  }
}

export function useCachedQuery(cacheKey, fetcher, { enabled = true } = {}) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [data, setData] = useState(() => (cacheKey ? readQueryCache(cacheKey) : undefined));
  const [loading, setLoading] = useState(() => {
    if (cacheKey && readQueryCache(cacheKey) !== undefined) return false;
    return true;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled || !cacheKey) return undefined;
    const hit = readQueryCache(cacheKey);
    if (hit !== undefined) {
      setData(hit);
      setLoading(false);
      setError('');
      return undefined;
    }

    let active = true;
    setLoading(true);
    loadWithRetry(() => fetcherRef.current())
      .then((result) => {
        if (!active) return;
        writeQueryCache(cacheKey, result);
        setData(result);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Could not load.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cacheKey, enabled]);

  const refresh = useCallback(async () => {
    if (!cacheKey) return undefined;
    const hadData = readQueryCache(cacheKey) !== undefined;
    if (hadData) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await fetcherRef.current();
      writeQueryCache(cacheKey, result);
      setData(result);
      return result;
    } catch (err) {
      setError(err?.message || 'Could not load.');
      throw err;
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [cacheKey]);

  const update = useCallback((valueOrFn) => {
    setData((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      if (cacheKey) writeQueryCache(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  return { data, loading, refreshing, error, refresh, update };
}
