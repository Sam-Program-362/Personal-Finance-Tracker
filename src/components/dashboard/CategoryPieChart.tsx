import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Transaction } from '../../types/finance';
import { aggregateByCategory } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface CategoryPieChartProps {
  transactions: Transaction[];
  baseCurrency?: string;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions, baseCurrency = 'USD' }) => {
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const data = aggregateByCategory(transactions, activeType);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Category Breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeType === 'expense' ? 'Spending distribution by category' : 'Income distribution by source'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveType('expense')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeType === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveType('income')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeType === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
        {/* Pie Donut Chart */}
        <div className="h-56 relative flex items-center justify-center">
          {data.length === 0 ? (
            <div className="text-slate-500 text-xs">No data for this category</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val) || 0, baseCurrency), 'Amount']}
                  />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Inner Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="text-sm font-bold text-white mt-0.5">
                  {formatCurrency(total, baseCurrency, 0)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Legend List */}
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
          {data.slice(0, 6).map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-white">{formatCurrency(item.value, baseCurrency)}</span>
                <span className="text-slate-400 text-[10px] w-9 text-right font-mono">{item.percentage}%</span>
              </div>
            </div>
          ))}
          {data.length > 6 && (
            <span className="text-[11px] text-slate-500 text-center mt-1">
              + {data.length - 6} other categories
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
