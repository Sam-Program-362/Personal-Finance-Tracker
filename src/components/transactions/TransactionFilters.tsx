import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { ExpenseCategory, IncomeCategory, PaymentMethod, TransactionType } from '../../types/finance';

export interface FilterState {
  search: string;
  type: 'all' | TransactionType;
  category: string;
  paymentMethod: string;
  status: 'all' | 'cleared' | 'pending';
  datePreset: 'all' | 'this-month' | 'last-30-days' | 'this-year' | 'custom';
  startDate: string;
  endDate: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'title-asc';
}

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  categories: (ExpenseCategory | IncomeCategory)[];
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Cash',
  'Crypto',
  'PayPal / Venmo',
  'Other',
];

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onChange,
  onReset,
  categories,
}) => {
  const updateField = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.paymentMethod !== 'all' ||
    filters.status !== 'all' ||
    filters.datePreset !== 'all';

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3">
      {/* Top Row: Search + Type Selector + Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions by title, notes, tags..."
            value={filters.search}
            onChange={(e) => updateField('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => updateField('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateField('type', t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filters.type === t
                  ? t === 'income'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : t === 'expense'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="shrink-0">
          <select
            value={filters.sortBy}
            onChange={(e) => updateField('sortBy', e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="title-asc">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Secondary Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Payment Method
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => updateField('paymentMethod', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Date Preset */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Date Range
          </label>
          <select
            value={filters.datePreset}
            onChange={(e) => updateField('datePreset', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="this-month">This Month</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="this-year">This Year (2026)</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Status
          </label>
          <div className="flex items-center justify-between">
            <select
              value={filters.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="cleared">Cleared</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-indigo-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters applied
          </span>
          <button
            onClick={onReset}
            className="text-slate-400 hover:text-white transition-colors underline text-[11px]"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};
