import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Transaction } from '../../types/finance';
import { aggregateMonthlyTrends } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface IncomeExpenseBarChartProps {
  transactions: Transaction[];
  baseCurrency?: string;
}

export const IncomeExpenseBarChart: React.FC<IncomeExpenseBarChartProps> = ({
  transactions,
  baseCurrency = 'USD',
}) => {
  const data = aggregateMonthlyTrends(transactions);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">Monthly Savings Margin</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Income, expenses, and retained surplus by month
        </p>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No transaction data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(val: any, name: any) => [
                  formatCurrency(Number(val) || 0, baseCurrency),
                  name === 'income' ? 'Income' : name === 'expense' ? 'Expense' : 'Net Saved',
                ]}
              />
              <Legend
                verticalAlign="top"
                height={32}
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(val) => (
                  <span className="text-slate-300 font-medium">
                    {val === 'income' ? 'Income' : val === 'expense' ? 'Expenses' : 'Net Saved'}
                  </span>
                )}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
