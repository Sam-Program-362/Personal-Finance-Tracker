import React from 'react';
import { Transaction } from '../../types/finance';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { ArrowDownLeft, ArrowUpRight, Clock, ArrowRight } from 'lucide-react';
import { getCategoryColor } from '../../utils/calculations';

interface RecentTransactionsProps {
  transactions: Transaction[];
  baseCurrency?: string;
  onViewAll?: () => void;
  onEdit?: (tx: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  baseCurrency = 'USD',
  onViewAll,
  onEdit,
}) => {
  const recent = transactions.slice(0, 6);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Recent Transactions</h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest account inflows and outflows</p>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All ({transactions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-800/80">
        {recent.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">No transactions recorded yet.</div>
        ) : (
          recent.map((tx) => {
            const isIncome = tx.type === 'income';
            const catColor = getCategoryColor(tx.category);

            return (
              <div
                key={tx.id}
                onClick={() => onEdit && onEdit(tx)}
                className="py-3 flex items-center justify-between hover:bg-slate-800/30 rounded-xl px-2 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {tx.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 ml-3">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isIncome ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, baseCurrency)}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tx.status === 'pending' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-medium">
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">{tx.paymentMethod}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
