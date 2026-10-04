import React, { useState, useMemo } from 'react';
import { Transaction, ExpenseCategory, IncomeCategory } from '../../types/finance';
import { FilterState, TransactionFilters } from './TransactionFilters';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getCategoryColor } from '../../utils/calculations';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Download,
  Upload,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Repeat,
  CheckCircle2,
  Clock,
  Printer,
} from 'lucide-react';
import { exportImportService } from '../../services/exportImportService';

interface TransactionListProps {
  transactions: Transaction[];
  baseCurrency?: string;
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBulkImport: () => void;
  onBulkDelete?: (ids: string[]) => void;
}

const INITIAL_FILTERS: FilterState = {
  search: '',
  type: 'all',
  category: 'all',
  paymentMethod: 'all',
  status: 'all',
  datePreset: 'all',
  startDate: '',
  endDate: '',
  sortBy: 'date-desc',
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  baseCurrency = 'USD',
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onBulkImport,
}) => {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Distinct categories from data
  const allCategories = useMemo(() => {
    const set = new Set<ExpenseCategory | IncomeCategory>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesNotes = t.notes?.toLowerCase().includes(q) || false;
          const matchesTags = t.tags?.some((tag) => tag.toLowerCase().includes(q)) || false;
          const matchesCategory = t.category.toLowerCase().includes(q);
          if (!matchesTitle && !matchesNotes && !matchesTags && !matchesCategory) return false;
        }

        // Type
        if (filters.type !== 'all' && t.type !== filters.type) return false;

        // Category
        if (filters.category !== 'all' && t.category !== filters.category) return false;

        // Payment Method
        if (filters.paymentMethod !== 'all' && t.paymentMethod !== filters.paymentMethod) return false;

        // Status
        if (filters.status !== 'all' && t.status !== filters.status) return false;

        // Date Preset
        if (filters.datePreset !== 'all') {
          const txDate = new Date(t.date + 'T00:00:00');
          const now = new Date('2026-10-04T00:00:00');

          if (filters.datePreset === 'this-month') {
            if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
          } else if (filters.datePreset === 'last-30-days') {
            const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
            if (diffDays < 0 || diffDays > 30) return false;
          } else if (filters.datePreset === 'this-year') {
            if (txDate.getFullYear() !== now.getFullYear()) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (filters.sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (filters.sortBy === 'amount-desc') return b.amount - a.amount;
        if (filters.sortBy === 'amount-asc') return a.amount - b.amount;
        if (filters.sortBy === 'title-asc') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [transactions, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedTransactions.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) {
      selectedIds.forEach((id) => onDeleteTransaction(id));
      setSelectedIds(new Set());
    }
  };

  const handleExportCsv = () => {
    exportImportService.exportToCsv(filteredTransactions, `finance_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Transactions</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
              {filteredTransactions.length} items
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage, filter, import, and export all personal finance transactions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={onBulkImport}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            title="Import from CSV"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            title="Print / Save PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={onAddTransaction}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <TransactionFilters
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        onReset={() => {
          setFilters(INITIAL_FILTERS);
          setCurrentPage(1);
        }}
        categories={allCategories}
      />

      {/* Transactions Table Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedTransactions.length > 0 &&
                      paginatedTransactions.every((t) => selectedIds.has(t.id))
                    }
                    onChange={handleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Transaction</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">No transactions found matching your filters.</p>
                    <button
                      onClick={() => setFilters(INITIAL_FILTERS)}
                      className="mt-2 text-xs text-indigo-400 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const catColor = getCategoryColor(tx.category);
                  const isSelected = selectedIds.has(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      className={`group hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Transaction Title & Icon */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              isIncome
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {tx.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {tx.isRecurring && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded font-medium">
                                  <Repeat className="w-2.5 h-2.5" /> {tx.recurringFrequency}
                                </span>
                              )}
                              {tx.tags?.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {tx.notes && (
                                <span className="text-[11px] text-slate-500 italic max-w-[200px] truncate">
                                  {tx.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700/60">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                          {tx.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3.5 whitespace-nowrap text-slate-300 font-mono text-xs">
                        {formatDate(tx.date)}
                      </td>

                      {/* Payment Method */}
                      <td className="p-3.5 whitespace-nowrap text-slate-400 text-xs">
                        {tx.paymentMethod}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {tx.status === 'cleared' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 whitespace-nowrap text-right">
                        <span
                          className={`font-bold ${
                            isIncome ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(tx.amount, baseCurrency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit Transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Delete Transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>of {filteredTransactions.length} items</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
