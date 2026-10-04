import { useState, useEffect, useCallback } from 'react';
import { cacheManager } from '../services/cacheManager';
import { CacheEntry, CacheStats } from '../types/cache';

export function useCacheStats() {
  const [stats, setStats] = useState<CacheStats>(cacheManager.getStats());
  const [entries, setEntries] = useState<CacheEntry[]>(cacheManager.getAllEntries());

  const refresh = useCallback(() => {
    setStats(cacheManager.getStats());
    setEntries(cacheManager.getAllEntries());
  }, []);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Subscribe to cache mutations
    const unsubscribe = cacheManager.subscribe(() => {
      refresh();
    });

    // Also periodic update for TTL countdowns
    const interval = setInterval(refresh, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refresh]);

  const purgeAll = useCallback(() => {
    cacheManager.purgeAll();
    refresh();
  }, [refresh]);

  const invalidateStale = useCallback(() => {
    const count = cacheManager.invalidateStale();
    refresh();
    return count;
  }, [refresh]);

  const deleteKey = useCallback((key: string) => {
    cacheManager.delete(key);
    refresh();
  }, [refresh]);

  return {
    stats,
    entries,
    refresh,
    purgeAll,
    invalidateStale,
    deleteKey,
  };
}
