import React from 'react';
import { useCacheStats } from '../../hooks/useCacheStats';
import { Database, Zap } from 'lucide-react';

interface CacheStatsWidgetProps {
  onOpenInspector: () => void;
}

export const CacheStatsWidget: React.FC<CacheStatsWidgetProps> = ({ onOpenInspector }) => {
  const { stats } = useCacheStats();

  return (
    <button
      onClick={onOpenInspector}
      title={`Cache Hit Rate: ${stats.hitRate}% | ${stats.hits} Hits / ${stats.totalRequests} Requests. Click to inspect.`}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-semibold shadow-inner transition-all hover:border-indigo-500/50 hover:scale-105 cursor-pointer"
    >
      <div className="flex items-center gap-1 text-emerald-400">
        <Zap className="w-3.5 h-3.5 fill-emerald-400/20" />
        <span>{stats.hitRate}%</span>
      </div>
      <div className="h-3 w-px bg-slate-700" />
      <div className="flex items-center gap-1 text-slate-300">
        <Database className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-mono">{stats.memoryEntriesCount + stats.storageEntriesCount} keys</span>
      </div>
    </button>
  );
};
