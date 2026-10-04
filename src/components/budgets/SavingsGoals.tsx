import React, { useState } from 'react';
import { SavingsGoal } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GoalDepositModal } from './GoalDepositModal';
import { Modal } from '../common/Modal';
import {
  Target,
  PlusCircle,
  ShieldCheck,
  Car,
  Plane,
  Laptop,
  Home,
  Heart,
  Briefcase,
  Gift,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  baseCurrency?: string;
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onDeposit: (goalId: string, amount: number) => void;
}

const GOAL_ICONS: Record<string, any> = {
  ShieldCheck,
  Car,
  Plane,
  Laptop,
  Home,
  Heart,
  Briefcase,
  Gift,
  Target,
};

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  goals,
  baseCurrency = 'USD',
  onAddGoal,
  onDeleteGoal,
  onDeposit,
}) => {
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingsGoal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New goal form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [category, setCategory] = useState('Safety Net');
  const [selectedIcon, setSelectedIcon] = useState('ShieldCheck');
  const [color, setColor] = useState('#10b981');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    onAddGoal({
      name: name.trim(),
      targetAmount: parseFloat(targetAmount) || 1000,
      currentAmount: parseFloat(currentAmount) || 0,
      deadline,
      category,
      icon: selectedIcon,
      color,
    });

    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setIsAddModalOpen(false);
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <span>Savings & Milestone Goals</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Track progress toward major life milestones, emergency reserves, and major purchases.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span className="font-semibold text-slate-200">Total Saved Across Goals</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(totalSaved, baseCurrency)} / {formatCurrency(totalTarget, baseCurrency)} ({overallPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const isComplete = goal.currentAmount >= goal.targetAmount;
          const IconComponent = GOAL_ICONS[goal.icon] || Target;

          return (
            <div
              key={goal.id}
              className={`relative overflow-hidden bg-slate-900/80 border rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all hover:border-slate-600 hover:-translate-y-0.5 ${
                isComplete ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
                    style={{
                      backgroundColor: `${goal.color}20`,
                      borderColor: `${goal.color}40`,
                      color: goal.color,
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1">
                    {isComplete && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Reached!
                      </span>
                    )}
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-white text-base tracking-tight">{goal.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Target: {formatDate(goal.deadline)}</span>
                </p>
                {goal.notes && <p className="text-[11px] text-slate-500 mt-1 italic">{goal.notes}</p>}
              </div>

              {/* Progress Bar & Amounts */}
              <div className="mt-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-white">
                    {formatCurrency(goal.currentAmount, baseCurrency)}
                  </span>
                  <span className="text-xs text-slate-400">
                    of {formatCurrency(goal.targetAmount, baseCurrency)}
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="font-semibold text-slate-300">{percent}% Complete</span>
                  <button
                    onClick={() => setSelectedGoalForDeposit(goal)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition-all"
                  >
                    Deposit / Withdraw
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      <GoalDepositModal
        isOpen={!!selectedGoalForDeposit}
        onClose={() => setSelectedGoalForDeposit(null)}
        goal={selectedGoalForDeposit}
        onDeposit={onDeposit}
        baseCurrency={baseCurrency}
      />

      {/* Add Goal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Savings Goal"
        subtitle="Set a milestone to save toward, with automated progress tracking."
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Dream Wedding, New Home Downpayment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Target Amount ({baseCurrency}) *
              </label>
              <input
                type="number"
                step="10"
                min="10"
                placeholder="5000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Initial Saved Amount
              </label>
              <input
                type="number"
                step="10"
                min="0"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Travel, Tech, Emergency"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Icon & Color
            </label>
            <div className="flex items-center gap-2 mb-3">
              {['ShieldCheck', 'Car', 'Plane', 'Laptop', 'Home', 'Heart', 'Briefcase', 'Gift'].map((iconKey) => {
                const IconComp = GOAL_ICONS[iconKey] || Target;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setSelectedIcon(iconKey)}
                    className={`p-2 rounded-xl border transition-all ${
                      selectedIcon === iconKey
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {['#10b981', '#6366f1', '#ec4899', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316'].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
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
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
            >
              Create Goal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
