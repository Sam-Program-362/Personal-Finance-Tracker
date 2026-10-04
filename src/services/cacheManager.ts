import { CacheEntry, CacheOptions, CacheStats, CacheTier } from '../types/cache';

const STORAGE_PREFIX = 'pft_cache_v1_';
const STATS_STORAGE_KEY = 'pft_cache_stats_v1';

class MultiTierCacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
    memoryEntriesCount: 0,
    storageEntriesCount: 0,
    estimatedMemoryBytes: 0,
    estimatedStorageBytes: 0,
    lastPurgedAt: null,
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadStats();
    this.hydrateFromStorage();
    this.cleanExpired();
  }

  // Subscribe to cache change events
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.updateStatsCounters();
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Cache listener error:', err);
      }
    });
  }

  private loadStats() {
    try {
      const stored = localStorage.getItem(STATS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.stats = { ...this.stats, ...parsed };
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveStats() {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // Ignore storage errors
    }
  }

  private hydrateFromStorage() {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      for (const k of keys) {
        if (k.startsWith(STORAGE_PREFIX)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const entry: CacheEntry = JSON.parse(raw);
            if (entry.expiresAt > now) {
              this.memoryCache.set(entry.key, entry);
            } else {
              localStorage.removeItem(k);
            }
          }
        }
      }
      this.updateStatsCounters();
    } catch (e) {
      console.warn('Failed to hydrate cache from storage', e);
    }
  }

  public get<T>(key: string): { data: T | null; tier: CacheTier; isStale: boolean; entry: CacheEntry<T> | null } {
    this.stats.totalRequests++;
    const now = Date.now();

    // 1. Check L1 Memory Cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key) as CacheEntry<T>;
      const isStale = now > entry.expiresAt;

      entry.hitCount++;
      this.stats.hits++;
      this.calculateHitRate();
      this.notify();

      return {
        data: entry.data,
        tier: 'memory',
        isStale,
        entry,
      };
    }

    // 2. Check L2 LocalStorage Cache
    try {
      const storageKey = STORAGE_PREFIX + key;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const entry: CacheEntry<T> = JSON.parse(raw);
        const isStale = now > entry.expiresAt;

        entry.hitCount++;
        this.memoryCache.set(key, entry);
        this.stats.hits++;
        this.calculateHitRate();
        this.notify();

        return {
          data: entry.data,
          tier: 'localStorage',
          isStale,
          entry,
        };
      }
    } catch {
      // localStorage error fallback
    }

    // Cache Miss
    this.stats.misses++;
    this.calculateHitRate();
    this.notify();

    return {
      data: null,
      tier: 'none',
      isStale: true,
      entry: null,
    };
  }

  public set<T>(key: string, data: T, options?: CacheOptions): CacheEntry<T> {
    const ttlMs = options?.ttlMs ?? 5 * 60 * 1000; // default 5 minutes
    const useStorage = options?.useStorage ?? true;
    const now = Date.now();
    const serialized = JSON.stringify(data);
    const sizeBytes = new Blob([serialized]).size;

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttlMs,
      expiresAt: now + ttlMs,
      hitCount: 0,
      sizeBytes,
      metadata: options?.metadata,
    };

    // Save to L1 Memory
    this.memoryCache.set(key, entry);

    // Save to L2 Storage if enabled
    if (useStorage) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
      } catch (err) {
        console.warn('LocalStorage quota exceeded or disabled, pruning stale cache...', err);
        this.cleanExpired();
      }
    }

    this.notify();
    return entry;
  }

  public async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<{ data: T; source: 'memory' | 'localStorage' | 'network' | 'swr_network'; isFromCache: boolean; cacheEntry?: CacheEntry<T> }> {
    const { data: cachedData, tier, isStale, entry } = this.get<T>(key);

    if (options?.forceFresh) {
      const freshData = await fetcher();
      const newEntry = this.set(key, freshData, options);
      return { data: freshData, source: 'network', isFromCache: false, cacheEntry: newEntry };
    }

    // Cache Hit and fresh
    if (cachedData !== null && !isStale) {
      return {
        data: cachedData,
        source: tier === 'memory' ? 'memory' : 'localStorage',
        isFromCache: true,
        cacheEntry: entry || undefined,
      };
    }

    // Stale-While-Revalidate (SWR): Return stale data immediately, fetch in background
    if (cachedData !== null && isStale && options?.staleWhileRevalidate) {
      fetcher()
        .then((fresh) => {
          this.set(key, fresh, options);
        })
        .catch((err) => {
          console.warn(`SWR Background refresh failed for ${key}`, err);
        });

      return {
        data: cachedData,
        source: 'memory',
        isFromCache: true,
        cacheEntry: entry || undefined,
      };
    }

    // Cache Miss or expired without SWR: Fetch fresh
    try {
      const freshData = await fetcher();
      const newEntry = this.set(key, freshData, options);
      return {
        data: freshData,
        source: 'network',
        isFromCache: false,
        cacheEntry: newEntry,
      };
    } catch (error) {
      // If network fails but we had stale data, return stale as fallback
      if (cachedData !== null) {
        console.warn(`Fetch failed for ${key}, falling back to stale cache:`, error);
        return {
          data: cachedData,
          source: 'memory',
          isFromCache: true,
          cacheEntry: entry || undefined,
        };
      }
      throw error;
    }
  }

  public delete(key: string): boolean {
    const deletedMemory = this.memoryCache.delete(key);
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // Ignore
    }
    this.notify();
    return deletedMemory;
  }

  public invalidateStale(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.delete(key);
        count++;
      }
    }
    this.notify();
    return count;
  }

  public purgeAll(): void {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.totalRequests = 0;
    this.stats.hitRate = 0;
    this.stats.lastPurgedAt = Date.now();
    this.saveStats();
    this.notify();
  }

  public getAllEntries(): CacheEntry[] {
    return Array.from(this.memoryCache.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  public cleanExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
        try {
          localStorage.removeItem(STORAGE_PREFIX + key);
        } catch {
          // Ignore
        }
        removed++;
      }
    }

    this.updateStatsCounters();
    return removed;
  }

  private calculateHitRate() {
    if (this.stats.totalRequests === 0) {
      this.stats.hitRate = 0;
    } else {
      this.stats.hitRate = Math.round((this.stats.hits / this.stats.totalRequests) * 100);
    }
    this.saveStats();
  }

  private updateStatsCounters() {
    this.stats.memoryEntriesCount = this.memoryCache.size;
    let storageCount = 0;
    let storageBytes = 0;
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(STORAGE_PREFIX)) {
          storageCount++;
          const val = localStorage.getItem(k);
          if (val) storageBytes += val.length * 2;
        }
      }
    } catch {
      // Ignore
    }
    this.stats.storageEntriesCount = storageCount;
    this.stats.estimatedStorageBytes = storageBytes;

    let memBytes = 0;
    this.memoryCache.forEach((e) => {
      memBytes += e.sizeBytes;
    });
    this.stats.estimatedMemoryBytes = memBytes;
  }

  public getStats(): CacheStats {
    this.updateStatsCounters();
    return { ...this.stats };
  }
}

export const cacheManager = new MultiTierCacheManager();
