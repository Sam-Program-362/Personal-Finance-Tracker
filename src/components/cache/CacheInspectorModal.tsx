import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCacheStats } from '../../hooks/useCacheStats';
import { formatBytes } from '../../utils/formatters';
import { CacheEntry } from '../../types/cache';
import {
  Database,
  Zap,
  HardDrive,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

interface CacheInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CacheInspectorModal: React.FC<CacheInspectorModalProps> = ({ isOpen, onClose }) => {
  const { stats, entries, purgeAll, invalidateStale, deleteKey, refresh } = useCacheStats();
  const [viewingEntry, setViewingEntry] = useState<CacheEntry | null>(null);

  const now = Date.now();

  const handlePurge = () => {
    if (confirm('Are you sure you want to purge all in-memory and local storage cache?')) {
      purgeAll();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Multi-Tier Cache Inspector & Monitor"
      subtitle="Inspect L1 Memory, L2 Storage, Hit Rate %, TTL countdowns, and Alpha Vantage API cache state."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Hit Rate */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase text-[10px]">Hit Ratio</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.hitRate}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.hits} hits / {stats.totalRequests} reqs
            </p>
          </div>

          {/* Memory L1 Cache */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase text-[10px]">L1 RAM Cache</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300">{stats.memoryEntriesCount} items</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ~{formatBytes(stats.estimatedMemoryBytes)} RAM
            </p>
          </div>

          {/* Storage L2 Cache */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase text-[10px]">L2 Disk Storage</span>
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-300">{stats.storageEntriesCount} items</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ~{formatBytes(stats.estimatedStorageBytes)} Disk
            </p>
          </div>

          {/* Misses & Fetches */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase text-[10px]">API Network Calls</span>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-indigo-300">{stats.misses}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Alpha Vantage API saves</p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Active Cached Keys ({entries.length})</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => invalidateStale()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clean Expired</span>
            </button>

            <button
              onClick={handlePurge}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              <span>Purge All</span>
            </button>
          </div>
        </div>

        {/* Entries Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-3">Cache Key</th>
                  <th className="p-3">TTL Remaining</th>
                  <th className="p-3">Hits</th>
                  <th className="p-3">Size</th>
                  <th className="p-3 text-center">Inspect</th>
                  <th className="p-3 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      Cache is currently empty. Make API queries or browse markets to populate.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const ttlSec = Math.max(0, Math.round((entry.expiresAt - now) / 1000));
                    const isExpired = ttlSec === 0;

                    return (
                      <tr key={entry.key} className="hover:bg-slate-800/40">
                        <td className="p-3 font-medium text-white truncate max-w-[200px]">
                          <span className="text-indigo-400 mr-1.5">⚡</span>
                          {entry.key}
                        </td>
                        <td className="p-3">
                          {isExpired ? (
                            <span className="text-rose-400 text-[11px]">Expired (stale)</span>
                          ) : (
                            <span className="text-emerald-400 text-[11px] font-semibold">{ttlSec}s left</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-300">{entry.hitCount}</td>
                        <td className="p-3 text-slate-400">{formatBytes(entry.sizeBytes)}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setViewingEntry(entry)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            title="View JSON Payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => deleteKey(entry.key)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Purge Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* JSON Payload Viewer */}
        {viewingEntry && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 font-mono">
                Key: {viewingEntry.key}
              </span>
              <button
                onClick={() => setViewingEntry(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Viewer
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto overflow-x-auto border border-slate-800">
              {JSON.stringify(viewingEntry.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>SWR (Stale-While-Revalidate) & TTL Invalidation Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
