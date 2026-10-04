import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Transaction } from '../../types/finance';
import { aggregateMonthlyTrends } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface CashFlowChartProps {
  transactions: Transaction[];
  baseCurrency?: string;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ transactions, baseCurrency = 'USD' }) => {
  const [chartType, setChartType] = useState<'flow' | 'net'>('flow');
  const data = aggregateMonthlyTrends(transactions);

  // Compute cumulative balance for net view
  let runningBalance = 0;
  const enrichedData = data.map((d) => {
    runningBalance += d.net;
    return {
      ...d,
      cumulative: runningBalance,
    };
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Cash Flow Trends</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {enrichedData.length} Months
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Income vs Expenses & Accumulated Net Savings</p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setChartType('flow')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              chartType === 'flow'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Income vs Expense
          </button>
          <button
            onClick={() => setChartType('net')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              chartType === 'net'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Net Accumulation
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        {enrichedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            No transaction data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enrichedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(val: any, name: any) => [
                  formatCurrency(Number(val) || 0, baseCurrency),
                  name === 'income' ? 'Income' : name === 'expense' ? 'Expenses' : name === 'cumulative' ? 'Total Saved' : 'Net Cashflow',
                ]}
                labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                formatter={(val) => (
                  <span className="text-slate-300 font-medium">
                    {val === 'income' ? 'Income' : val === 'expense' ? 'Expenses' : val === 'cumulative' ? 'Cumulative Net' : 'Net Flow'}
                  </span>
                )}
              />

              {chartType === 'flow' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#netGrad)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
