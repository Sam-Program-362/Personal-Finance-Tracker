import React from 'react';
import { Budget, FinancialHealthMetrics, Transaction } from '../../types/finance';
import { SpendingHeatmap } from './SpendingHeatmap';
import { BudgetVsActualChart } from './BudgetVsActualChart';
import { IncomeExpenseBarChart } from './IncomeExpenseBarChart';
import { CategoryPieChart } from '../dashboard/CategoryPieChart';
import { CashFlowChart } from '../dashboard/CashFlowChart';
import { FinancialHealthWidget } from '../dashboard/FinancialHealthWidget';
import { BarChart3 } from 'lucide-react';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  financialHealth: FinancialHealthMetrics;
  baseCurrency?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  transactions,
  budgets,
  financialHealth,
  baseCurrency = 'USD',
}) => {
  return (
    <div className="space-y-6">
      {/* Analytics Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <span>Advanced Financial Analytics & Visualizations</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Deep-dive insights, spending seasonality, category allocations, and budget variance.
        </p>
      </div>

      {/* Grid: Cashflow + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart transactions={transactions} baseCurrency={baseCurrency} />
        <SpendingHeatmap transactions={transactions} baseCurrency={baseCurrency} />
      </div>

      {/* Grid: Budget vs Actual + Savings Margin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetVsActualChart budgets={budgets} transactions={transactions} baseCurrency={baseCurrency} />
        <IncomeExpenseBarChart transactions={transactions} baseCurrency={baseCurrency} />
      </div>

      {/* Grid: Category Breakdown + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <CategoryPieChart transactions={transactions} baseCurrency={baseCurrency} />
        </div>
        <div className="lg:col-span-6">
          <FinancialHealthWidget metrics={financialHealth} />
        </div>
      </div>
    </div>
  );
};
