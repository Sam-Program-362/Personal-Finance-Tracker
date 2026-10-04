import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  gradient?: string;
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon: Icon,
  iconColor = 'text-indigo-400',
  gradient = 'from-slate-900/90 to-slate-800/80',
  badge,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 border border-slate-700/60 shadow-xl backdrop-blur-md transition-all hover:border-slate-600 hover:shadow-2xl hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <h3 className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 ${iconColor} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {change && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
        {badge && <div>{badge}</div>}
      </div>
    </div>
  );
};
