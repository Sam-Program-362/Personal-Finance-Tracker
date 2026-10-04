import { useState, useEffect, useCallback, useMemo } from 'react';
import { Budget, FinancialHealthMetrics, PortfolioHolding, SavingsGoal, Transaction } from '../types/finance';
import { storageService } from '../services/storageService';
import { calculateBudgetStatus, calculateTotals, computeFinancialHealth } from '../utils/calculations';

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    setTransactions(storageService.getTransactions());
    setBudgets(storageService.getBudgets());
    setSavingsGoals(storageService.getSavingsGoals());
    setHoldings(storageService.getHoldings());
    setIsLoading(false);
  }, []);

  // --- Transaction actions ---
  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = storageService.addTransaction(tx);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const updated = storageService.updateTransaction(id, updates);
    if (updated) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    const success = storageService.deleteTransaction(id);
    if (success) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
    return success;
  }, []);

  const bulkAddTransactions = useCallback((newTxs: Partial<Transaction>[]) => {
    const current = storageService.getTransactions();
    const formatted: Transaction[] = newTxs.map((t, idx) => ({
      id: `tx-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      type: t.type || 'expense',
      title: t.title || 'Imported Transaction',
      amount: t.amount || 0,
      category: t.category || 'Other Expense',
      date: t.date || new Date().toISOString().split('T')[0],
      paymentMethod: t.paymentMethod || 'Credit Card',
      notes: t.notes || '',
      tags: t.tags || [],
      isRecurring: t.isRecurring || false,
      recurringFrequency: t.recurringFrequency || 'none',
      status: t.status || 'cleared',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const combined = [...formatted, ...current];
    storageService.saveTransactions(combined);
    setTransactions(combined);
    return formatted.length;
  }, []);

  // --- Budget actions ---
  const addBudget = useCallback((budget: Omit<Budget, 'id'>) => {
    const created = storageService.addBudget(budget);
    setBudgets((prev) => [...prev, created]);
    return created;
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    const updated = storageService.updateBudget(id, updates);
    if (updated) {
      setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    }
    return updated;
  }, []);

  const deleteBudget = useCallback((id: string) => {
    const success = storageService.deleteBudget(id);
    if (success) {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    }
    return success;
  }, []);

  // --- Savings Goal actions ---
  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id'>) => {
    const created = storageService.addSavingsGoal(goal);
    setSavingsGoals((prev) => [...prev, created]);
    return created;
  }, []);

  const updateSavingsGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    const updated = storageService.updateSavingsGoal(id, updates);
    if (updated) {
      setSavingsGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    }
    return updated;
  }, []);

  const deleteSavingsGoal = useCallback((id: string) => {
    const success = storageService.deleteSavingsGoal(id);
    if (success) {
      setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
    }
    return success;
  }, []);

  const depositToGoal = useCallback((id: string, amount: number) => {
    const goal = savingsGoals.find((g) => g.id === id);
    if (!goal) return null;
    const newAmount = Math.max(0, goal.currentAmount + amount);
    return updateSavingsGoal(id, { currentAmount: newAmount });
  }, [savingsGoals, updateSavingsGoal]);

  // --- Holdings actions ---
  const addHolding = useCallback((holding: Omit<PortfolioHolding, 'id'>) => {
    const created = storageService.addHolding(holding);
    setHoldings((prev) => [...prev, created]);
    return created;
  }, []);

  const deleteHolding = useCallback((id: string) => {
    const success = storageService.deleteHolding(id);
    if (success) {
      setHoldings((prev) => prev.filter((h) => h.id !== id));
    }
    return success;
  }, []);

  // --- Reset to Demo Data ---
  const resetToDemoData = useCallback(() => {
    storageService.resetToDemo();
    setTransactions(storageService.getTransactions());
    setBudgets(storageService.getBudgets());
    setSavingsGoals(storageService.getSavingsGoals());
    setHoldings(storageService.getHoldings());
  }, []);

  // Computed metrics
  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const budgetStatus = useMemo(() => calculateBudgetStatus(budgets, transactions), [budgets, transactions]);
  const financialHealth: FinancialHealthMetrics = useMemo(
    () => computeFinancialHealth(transactions, totals.netSavings),
    [transactions, totals.netSavings]
  );

  return {
    transactions,
    budgets,
    savingsGoals,
    holdings,
    isLoading,
    totals,
    budgetStatus,
    financialHealth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    bulkAddTransactions,
    addBudget,
    updateBudget,
    deleteBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
    addHolding,
    deleteHolding,
    resetToDemoData,
  };
}
