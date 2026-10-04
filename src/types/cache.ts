export type CacheTier = 'memory' | 'localStorage' | 'none';

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttlMs: number;
  expiresAt: number;
  hitCount: number;
  sizeBytes: number;
  metadata?: {
    apiEndpoint?: string;
    symbol?: string;
    source?: string;
    isFallback?: boolean;
  };
}

export interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number; // 0 - 100%
  memoryEntriesCount: number;
  storageEntriesCount: number;
  estimatedMemoryBytes: number;
  estimatedStorageBytes: number;
  lastPurgedAt: number | null;
}

export interface CacheOptions {
  ttlMs?: number;
  useStorage?: boolean;
  forceFresh?: boolean;
  staleWhileRevalidate?: boolean;
  metadata?: Record<string, unknown>;
}
