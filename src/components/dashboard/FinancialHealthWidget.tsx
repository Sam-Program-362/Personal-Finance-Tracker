import React from 'react';
import { FinancialHealthMetrics } from '../../types/finance';
import { ShieldCheck, Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface FinancialHealthWidgetProps {
  metrics: FinancialHealthMetrics;
}

export const FinancialHealthWidget: React.FC<FinancialHealthWidgetProps> = ({ metrics }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { ring: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' };
    if (score >= 60) return { ring: 'text-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' };
    if (score >= 40) return { ring: 'text-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' };
    return { ring: 'text-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' };
  };

  const colors = getScoreColor(metrics.score);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Financial Health & Insights</h3>
            <p className="text-xs text-slate-400">Holistic financial health assessment</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border border-current/20 ${colors.badge}`}>
          {metrics.scoreLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-4">
        {/* Score Ring */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={colors.ring}
                strokeDasharray={`${metrics.score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-white">{metrics.score}</span>
              <span className="text-[9px] text-slate-400 font-medium">/ 100</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">Health Index</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Based on savings rate, runway & cashflow</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 col-span-2">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Savings Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white">{metrics.savingsRate}%</p>
            <p className="text-[10px] text-slate-500">Benchmark: &gt; 20%</p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Runway</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-lg font-bold text-white">{metrics.emergencyFundMonths} mo</p>
            <p className="text-[10px] text-slate-500">Benchmark: 3 - 6 mo</p>
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Smart Advisory Tips
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {metrics.tips.map((tip, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 text-xs text-slate-300"
            >
              {tip.includes('!') ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
