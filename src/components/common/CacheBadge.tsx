import React from 'react';
import { Database, Zap, Globe, HardDrive } from 'lucide-react';

interface CacheBadgeProps {
  source?: 'memory' | 'localStorage' | 'network' | 'simulated' | 'cache' | string;
  isCached?: boolean;
  ttlRemainingMs?: number;
  sizeBytes?: number;
  className?: string;
  onInspect?: () => void;
}

export const CacheBadge: React.FC<CacheBadgeProps> = ({
  source = 'cache',
  isCached = true,
  ttlRemainingMs,
  sizeBytes,
  className = '',
  onInspect,
}) => {
  const getBadgeDetails = () => {
    if (source === 'memory') {
      return {
        icon: Zap,
        label: 'RAM Cache',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
      };
    }
    if (source === 'localStorage') {
      return {
        icon: HardDrive,
        label: 'Disk Cache',
        color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        dotColor: 'bg-cyan-400',
      };
    }
    if (source === 'network' || source === 'alpha_vantage') {
      return {
        icon: Globe,
        label: 'Live API',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dotColor: 'bg-amber-400 animate-pulse',
      };
    }
    return {
      icon: Database,
      label: 'Cached',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      dotColor: 'bg-indigo-400',
    };
  };

  const details = getBadgeDetails();
  const Icon = details.icon;

  const ttlSeconds = ttlRemainingMs ? Math.max(0, Math.round(ttlRemainingMs / 1000)) : null;

  return (
    <div
      onClick={onInspect}
      title={`Cache Source: ${source}${ttlSeconds !== null ? ` | TTL: ${ttlSeconds}s remaining` : ''}${sizeBytes ? ` | Size: ${(sizeBytes / 1024).toFixed(1)} KB` : ''}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all hover:scale-105 select-none ${details.color} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${details.dotColor}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{details.label}</span>
      {ttlSeconds !== null && (
        <span className="text-[10px] opacity-75 font-mono">({ttlSeconds}s)</span>
      )}
    </div>
  );
};
