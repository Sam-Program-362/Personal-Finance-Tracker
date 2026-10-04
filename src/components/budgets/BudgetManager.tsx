import React, { useState } from 'react';
import { Budget, ExpenseCategory, Transaction } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { calculateBudgetStatus } from '../../utils/calculations';
import { Modal } from '../common/Modal';
import {
  PieChart as BudgetIcon,
  AlertTriangle,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  baseCurrency?: string;
  onAddBudget: (budget: Omit<Budget, 'id'>) => void;
  onUpdateBudget: (id: string, updates: Partial<Budget>) => void;
  onDeleteBudget: (id: string) => void;
}

const AVAILABLE_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Housing & Rent',
  'Food & Dining',
  'Transportation',
  'Utilities & Bills',
  'Entertainment',
  'Healthcare & Fitness',
  'Shopping & Goods',
  'Travel & Vacation',
  'Education & Learning',
  'Personal Care',
  'Investments & Savings',
  'Other Expense',
];

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  transactions,
  baseCurrency = 'USD',
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
}) => {
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Food & Dining');
  const [formLimit, setFormLimit] = useState('');
  const [formThreshold, setFormThreshold] = useState('80');
  const [formColor, setFormColor] = useState('#6366f1');

  const budgetStatuses = calculateBudgetStatus(budgets, transactions);

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalActualSpent = budgetStatuses.reduce((sum, s) => sum + s.spent, 0);
  const totalRemaining = totalBudgetLimit - totalActualSpent;
  const overallSpentPercent = totalBudgetLimit > 0 ? Math.round((totalActualSpent / totalBudgetLimit) * 100) : 0;

  const handleOpenEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormCategory(budget.category);
    setFormLimit(budget.monthlyLimit.toString());
    setFormThreshold(budget.alertThreshold.toString());
    setFormColor(budget.color);
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingBudget(null);
    // Find first unused category
    const usedCategories = new Set(budgets.map((b) => b.category));
    const firstUnused = AVAILABLE_EXPENSE_CATEGORIES.find((c) => !usedCategories.has(c)) || 'Other Expense';
    setFormCategory(firstUnused);
    setFormLimit('500');
    setFormThreshold('80');
    setFormColor('#6366f1');
    setIsAddModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(formLimit) || 100;
    const thresholdNum = parseInt(formThreshold, 10) || 80;

    if (editingBudget) {
      onUpdateBudget(editingBudget.id, {
        monthlyLimit: limitNum,
        alertThreshold: thresholdNum,
        color: formColor,
      });
    } else {
      onAddBudget({
        category: formCategory,
        monthlyLimit: limitNum,
        alertThreshold: thresholdNum,
        color: formColor,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BudgetIcon className="w-5 h-5 text-indigo-400" />
              <span>Monthly Category Budgets</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Set spending thresholds to avoid overspending and enforce financial discipline.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Category Budget</span>
          </button>
        </div>

        {/* Global Budget Progress */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Monthly Budget</span>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBudgetLimit, baseCurrency)}</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Current Month Spent</span>
            <p className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalActualSpent, baseCurrency)}</p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Budget Remaining</span>
            <p className={`text-2xl font-bold mt-1 ${totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {formatCurrency(totalRemaining, baseCurrency)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
            <span>Overall Monthly Budget Utilization</span>
            <span>{overallSpentPercent}% Spent</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallSpentPercent > 100
                  ? 'bg-rose-500'
                  : overallSpentPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, overallSpentPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetStatuses.map(({ budget, spent, remaining, percentUsed, isOver, isWarning }) => {
          return (
            <div
              key={budget.id}
              className={`bg-slate-900/80 border rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all hover:border-slate-600 ${
                isOver
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: budget.color }} />
                    <h4 className="font-bold text-white text-base">{budget.category}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(budget)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Edit Limit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(budget.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-3 text-xs text-slate-400">
                  <span>Spent: <strong className="text-white font-semibold">{formatCurrency(spent, baseCurrency)}</strong></span>
                  <span>Limit: <strong className="text-slate-200">{formatCurrency(budget.monthlyLimit, baseCurrency)}</strong></span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                  />
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {isOver ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Over by {formatCurrency(Math.abs(remaining), baseCurrency)}
                  </span>
                ) : isWarning ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {remaining > 0 ? `${formatCurrency(remaining, baseCurrency)} left (${percentUsed}%)` : 'At limit'}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {formatCurrency(remaining, baseCurrency)} left
                  </span>
                )}
                <span className="text-[11px] text-slate-500 font-mono">{percentUsed}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingBudget ? `Edit Budget: ${editingBudget.category}` : 'Set New Category Budget'}
        subtitle="Define monthly spending cap and alert threshold."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {!editingBudget && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {AVAILABLE_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Monthly Limit ({baseCurrency}) *
            </label>
            <input
              type="number"
              step="10"
              min="10"
              placeholder="e.g. 500"
              value={formLimit}
              onChange={(e) => setFormLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Warning Alert Threshold ({formThreshold}%)
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={formThreshold}
              onChange={(e) => setFormThreshold(e.target.value)}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>50%</span>
              <span>75%</span>
              <span>90%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-2">
              {['#6366f1', '#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setFormColor(hex)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    formColor === hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
            >
              {editingBudget ? 'Save Changes' : 'Create Budget'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
