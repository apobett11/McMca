import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const MCA_FILTER_KEYS = ['cycle', 'ward', 'level', 'school', 'location', 'polling'];

/** Filters live in the URL so a view can be bookmarked, shared, and carried between pages. */
export function useMcaFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => Object.fromEntries(MCA_FILTER_KEYS.map((key) => [key, params.get(key) || ''])),
    [params]
  );

  const setParam = useCallback(
    (key, nextValue, { resetPage = true } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (nextValue === null || nextValue === undefined || nextValue === '') next.delete(key);
          else next.set(key, String(nextValue));
          if (resetPage && key !== 'page') next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const resetFilters = useCallback(() => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        MCA_FILTER_KEYS.forEach((key) => next.delete(key));
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  }, [setParams]);

  const activeCount = MCA_FILTER_KEYS.filter((key) => filters[key]).length;

  const linkWith = useCallback(
    (path, extra = {}) => {
      const next = new URLSearchParams();
      MCA_FILTER_KEYS.forEach((key) => {
        if (filters[key]) next.set(key, filters[key]);
      });
      Object.entries(extra).forEach(([key, extraValue]) => {
        if (extraValue) next.set(key, extraValue);
      });
      const query = next.toString();
      return query ? `${path}?${query}` : path;
    },
    [filters]
  );

  return { filters, params, setParam, resetFilters, activeCount, linkWith };
}
