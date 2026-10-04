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
import { Budget, Transaction } from '../../types/finance';
import { calculateBudgetStatus } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface BudgetVsActualChartProps {
  budgets: Budget[];
  transactions: Transaction[];
  baseCurrency?: string;
}

export const BudgetVsActualChart: React.FC<BudgetVsActualChartProps> = ({
  budgets,
  transactions,
  baseCurrency = 'USD',
}) => {
  const statuses = calculateBudgetStatus(budgets, transactions);

  const chartData = statuses.map((s) => ({
    category: s.budget.category,
    budget: s.budget.monthlyLimit,
    actual: s.spent,
    remaining: s.remaining,
  }));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">Budget vs. Actual Spending</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Side-by-side comparison of allocated limits against current month expenses
        </p>
      </div>

      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No budget categories configured.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `$${val}`}
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
                  name === 'budget' ? 'Budget Limit' : 'Actual Spent',
                ]}
              />
              <Legend
                verticalAlign="top"
                height={32}
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(val) => (
                  <span className="text-slate-300 font-medium">
                    {val === 'budget' ? 'Budget Limit' : 'Actual Spent'}
                  </span>
                )}
              />
              <Bar dataKey="budget" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="actual" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
