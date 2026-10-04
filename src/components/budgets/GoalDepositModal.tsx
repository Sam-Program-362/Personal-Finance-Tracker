import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { SavingsGoal } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, PlusCircle, MinusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onDeposit: (goalId: string, amount: number) => void;
  baseCurrency?: string;
}

export const GoalDepositModal: React.FC<GoalDepositModalProps> = ({
  isOpen,
  onClose,
  goal,
  onDeposit,
  baseCurrency = 'USD',
}) => {
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountStr, setAmountStr] = useState('');
  const [error, setError] = useState('');

  if (!goal) return null;

  const current = goal.currentAmount;
  const target = goal.targetAmount;
  const numAmount = parseFloat(amountStr) || 0;
  const projectedAmount = actionType === 'deposit' ? current + numAmount : Math.max(0, current - numAmount);
  const projectedPercent = Math.min(100, Math.round((projectedAmount / target) * 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a positive amount');
      return;
    }

    if (actionType === 'withdraw' && numAmount > current) {
      setError('Withdrawal amount cannot exceed current balance');
      return;
    }

    const delta = actionType === 'deposit' ? numAmount : -numAmount;
    onDeposit(goal.id, delta);

    if (actionType === 'deposit' && projectedAmount >= target && current < target) {
      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }

    setAmountStr('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Goal: ${goal.name}`}
      subtitle={`Target: ${formatCurrency(target, baseCurrency)} | Current: ${formatCurrency(current, baseCurrency)}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Deposit vs Withdraw tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActionType('deposit')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              actionType === 'deposit'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Deposit Funds</span>
          </button>
          <button
            type="button"
            onClick={() => setActionType('withdraw')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              actionType === 'withdraw'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MinusCircle className="w-4 h-4" />
            <span>Withdraw Funds</span>
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Amount ({baseCurrency}) *
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 250"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setError('');
              }}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-base font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
          {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
        </div>

        {/* Quick Amount Pills */}
        <div className="flex items-center gap-2">
          {[50, 100, 250, 500].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmountStr(amt.toString())}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              +{formatCurrency(amt, baseCurrency, 0)}
            </button>
          ))}
        </div>

        {/* Live Progress Preview */}
        {numAmount > 0 && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Projected Balance:</span>
              <span className="font-bold text-white">{formatCurrency(projectedAmount, baseCurrency)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${projectedPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Progress: {projectedPercent}%</span>
              <span>{projectedAmount >= target ? '🎉 Target will be reached!' : `${formatCurrency(Math.max(0, target - projectedAmount), baseCurrency)} to goal`}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-lg transition-all ${
              actionType === 'deposit'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            Confirm {actionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
