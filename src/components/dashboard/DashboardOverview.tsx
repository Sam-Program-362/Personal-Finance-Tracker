import React from 'react';
import { StatCard } from '../common/StatCard';
import { CashFlowChart } from './CashFlowChart';
import { CategoryPieChart } from './CategoryPieChart';
import { FinancialHealthWidget } from './FinancialHealthWidget';
import { RecentTransactions } from './RecentTransactions';
import { FinancialHealthMetrics, Transaction } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';

interface DashboardOverviewProps {
  transactions: Transaction[];
  totals: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
  };
  financialHealth: FinancialHealthMetrics;
  baseCurrency?: string;
  onOpenAddModal: () => void;
  onViewAllTransactions: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  totals,
  financialHealth,
  baseCurrency = 'USD',
  onOpenAddModal,
  onViewAllTransactions,
  onEditTransaction,
  onNavigateToTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Financial Overview</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time tracking of cashflow, budgeting limits, investments, and health metrics.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateToTab('investments')}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Market Hub</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(totals.netSavings, baseCurrency)}
          subtitle="Net accumulated funds"
          icon={Wallet}
          iconColor="text-indigo-400"
          gradient="from-indigo-950/40 via-slate-900 to-slate-900"
          change={totals.netSavings >= 0 ? 'Surplus' : 'Deficit'}
          isPositive={totals.netSavings >= 0}
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(totals.totalIncome, baseCurrency)}
          subtitle="All recorded earnings"
          icon={ArrowDownLeft}
          iconColor="text-emerald-400"
          gradient="from-emerald-950/30 via-slate-900 to-slate-900"
          change={`+${totals.savingsRate}% saved`}
          isPositive={true}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totals.totalExpense, baseCurrency)}
          subtitle="All recorded outflows"
          icon={ArrowUpRight}
          iconColor="text-rose-400"
          gradient="from-rose-950/30 via-slate-900 to-slate-900"
          change={`${(100 - totals.savingsRate).toFixed(1)}% of income`}
          isPositive={totals.totalExpense <= totals.totalIncome}
        />
        <StatCard
          title="Savings Rate"
          value={`${totals.savingsRate}%`}
          subtitle="Target benchmark &gt;20%"
          icon={PiggyBank}
          iconColor="text-amber-400"
          gradient="from-amber-950/30 via-slate-900 to-slate-900"
          change={totals.savingsRate >= 20 ? 'Optimal' : 'Grow savings'}
          isPositive={totals.savingsRate >= 20}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowChart transactions={transactions} baseCurrency={baseCurrency} />
        </div>
        <div className="lg:col-span-1">
          <CategoryPieChart transactions={transactions} baseCurrency={baseCurrency} />
        </div>
      </div>

      {/* Bottom Grid: Financial Health & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <FinancialHealthWidget metrics={financialHealth} />
        </div>
        <div className="lg:col-span-6">
          <RecentTransactions
            transactions={transactions}
            baseCurrency={baseCurrency}
            onViewAll={onViewAllTransactions}
            onEdit={onEditTransaction}
          />
        </div>
      </div>
    </div>
  );
};
