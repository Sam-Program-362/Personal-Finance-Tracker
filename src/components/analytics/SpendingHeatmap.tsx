import React, { useMemo } from 'react';
import { Transaction } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Calendar, Flame } from 'lucide-react';

interface SpendingHeatmapProps {
  transactions: Transaction[];
  baseCurrency?: string;
}

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({ transactions, baseCurrency = 'USD' }) => {
  // Aggregate daily expenses for the last 12-14 weeks (approx 90-100 days)
  const { daysGrid, maxDailySpend, totalDaysCount, highestSpendDay } = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        expenseMap[t.date] = (expenseMap[t.date] || 0) + t.amount;
      });

    const now = new Date('2026-10-04T00:00:00');
    const days: { dateStr: string; amount: number; dayOfWeek: number; month: string }[] = [];
    let max = 1;
    let highest = { date: '', amount: 0 };

    // 12 weeks = 84 days
    const totalDays = 84;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const amount = expenseMap[dateStr] || 0;
      if (amount > max) max = amount;
      if (amount > highest.amount) highest = { date: dateStr, amount };

      days.push({
        dateStr,
        amount,
        dayOfWeek: d.getDay(),
        month: d.toLocaleString('en-US', { month: 'short' }),
      });
    }

    return {
      daysGrid: days,
      maxDailySpend: max,
      totalDaysCount: totalDays,
      highestSpendDay: highest,
    };
  }, [transactions]);

  // Heatmap intensity color calculation
  const getCellColor = (amount: number) => {
    if (amount === 0) return 'bg-slate-800/50 border-slate-700/30';
    const ratio = amount / maxDailySpend;
    if (ratio < 0.2) return 'bg-indigo-950 border-indigo-800/40 text-indigo-200';
    if (ratio < 0.45) return 'bg-indigo-800 border-indigo-700 text-indigo-100';
    if (ratio < 0.75) return 'bg-indigo-600 border-indigo-500 text-white';
    return 'bg-purple-500 border-purple-400 text-white shadow-sm shadow-purple-500/50';
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Daily Spending Activity Heatmap</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Past 12 weeks activity matrix ({totalDaysCount} days)
          </p>
        </div>

        {highestSpendDay.amount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs self-start sm:self-auto">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>Peak: {formatDate(highestSpendDay.date)} ({formatCurrency(highestSpendDay.amount, baseCurrency)})</span>
          </div>
        )}
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[600px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5">
            {daysGrid.map((day) => (
              <div
                key={day.dateStr}
                title={`${formatDate(day.dateStr)}: ${day.amount > 0 ? formatCurrency(day.amount, baseCurrency) : 'No expenses'}`}
                className={`w-3.5 h-3.5 rounded-sm border transition-all hover:scale-125 cursor-pointer ${getCellColor(
                  day.amount
                )}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <span>Day of Week:</span>
          {weekdays.map((d, i) => (
            <span key={d} className="text-[10px] text-slate-500">
              {i % 2 === 1 ? d : ''}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">Less</span>
          <div className="w-3 h-3 rounded-sm bg-slate-800/50 border border-slate-700/30" />
          <div className="w-3 h-3 rounded-sm bg-indigo-950 border border-indigo-800/40" />
          <div className="w-3 h-3 rounded-sm bg-indigo-800 border border-indigo-700" />
          <div className="w-3 h-3 rounded-sm bg-indigo-600 border border-indigo-500" />
          <div className="w-3 h-3 rounded-sm bg-purple-500 border border-purple-400" />
          <span className="text-[10px] text-slate-500">More</span>
        </div>
      </div>
    </div>
  );
};
