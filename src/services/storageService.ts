import { Budget, PortfolioHolding, SavingsGoal, Transaction } from '../types/finance';
import { generateDemoTransactions, INITIAL_BUDGETS, INITIAL_HOLDINGS, INITIAL_SAVINGS_GOALS } from './demoData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'pft_transactions_v1',
  BUDGETS: 'pft_budgets_v1',
  SAVINGS_GOALS: 'pft_savings_goals_v1',
  HOLDINGS: 'pft_holdings_v1',
  CURRENCY: 'pft_base_currency_v1',
  THEME: 'pft_theme_v1',
};

export const storageService = {
  // --- Transactions ---
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        const demo = generateDemoTransactions();
        this.saveTransactions(demo);
        return demo;
      }
      return JSON.parse(data);
    } catch {
      return generateDemoTransactions();
    }
  },

  saveTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions:', e);
    }
  },

  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);
    return newTx;
  },

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transactions = this.getTransactions();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;

    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveTransactions(transactions);
    return transactions[index];
  },

  deleteTransaction(id: string): boolean {
    const transactions = this.getTransactions();
    const filtered = transactions.filter((t) => t.id !== id);
    if (filtered.length !== transactions.length) {
      this.saveTransactions(filtered);
      return true;
    }
    return false;
  },

  // --- Budgets ---
  getBudgets(): Budget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!data) {
        this.saveBudgets(INITIAL_BUDGETS);
        return INITIAL_BUDGETS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_BUDGETS;
    }
  },

  saveBudgets(budgets: Budget[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error('Failed to save budgets:', e);
    }
  },

  updateBudget(id: string, updates: Partial<Budget>): Budget | null {
    const budgets = this.getBudgets();
    const index = budgets.findIndex((b) => b.id === id);
    if (index === -1) return null;
    budgets[index] = { ...budgets[index], ...updates };
    this.saveBudgets(budgets);
    return budgets[index];
  },

  addBudget(budget: Omit<Budget, 'id'>): Budget {
    const budgets = this.getBudgets();
    const newBudget: Budget = {
      ...budget,
      id: `b-${Date.now()}`,
    };
    budgets.push(newBudget);
    this.saveBudgets(budgets);
    return newBudget;
  },

  deleteBudget(id: string): boolean {
    const budgets = this.getBudgets();
    const filtered = budgets.filter((b) => b.id !== id);
    if (filtered.length !== budgets.length) {
      this.saveBudgets(filtered);
      return true;
    }
    return false;
  },

  // --- Savings Goals ---
  getSavingsGoals(): SavingsGoal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
      if (!data) {
        this.saveSavingsGoals(INITIAL_SAVINGS_GOALS);
        return INITIAL_SAVINGS_GOALS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SAVINGS_GOALS;
    }
  },

  saveSavingsGoals(goals: SavingsGoal[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Failed to save savings goals:', e);
    }
  },

  addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): SavingsGoal {
    const goals = this.getSavingsGoals();
    const newGoal: SavingsGoal = {
      ...goal,
      id: `g-${Date.now()}`,
    };
    goals.push(newGoal);
    this.saveSavingsGoals(goals);
    return newGoal;
  },

  updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): SavingsGoal | null {
    const goals = this.getSavingsGoals();
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) return null;
    goals[index] = { ...goals[index], ...updates };
    this.saveSavingsGoals(goals);
    return goals[index];
  },

  deleteSavingsGoal(id: string): boolean {
    const goals = this.getSavingsGoals();
    const filtered = goals.filter((g) => g.id !== id);
    if (filtered.length !== goals.length) {
      this.saveSavingsGoals(filtered);
      return true;
    }
    return false;
  },

  // --- Portfolio Holdings ---
  getHoldings(): PortfolioHolding[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      if (!data) {
        this.saveHoldings(INITIAL_HOLDINGS);
        return INITIAL_HOLDINGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_HOLDINGS;
    }
  },

  saveHoldings(holdings: PortfolioHolding[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
    } catch (e) {
      console.error('Failed to save holdings:', e);
    }
  },

  addHolding(holding: Omit<PortfolioHolding, 'id'>): PortfolioHolding {
    const holdings = this.getHoldings();
    const newHolding: PortfolioHolding = {
      ...holding,
      id: `h-${Date.now()}`,
    };
    holdings.push(newHolding);
    this.saveHoldings(holdings);
    return newHolding;
  },

  deleteHolding(id: string): boolean {
    const holdings = this.getHoldings();
    const filtered = holdings.filter((h) => h.id !== id);
    if (filtered.length !== holdings.length) {
      this.saveHoldings(filtered);
      return true;
    }
    return false;
  },

  // --- Base Currency ---
  getBaseCurrency(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'USD';
  },

  setBaseCurrency(code: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, code.toUpperCase());
  },

  // Reset to Demo Factory State
  resetToDemo(): void {
    const demo = generateDemoTransactions();
    this.saveTransactions(demo);
    this.saveBudgets(INITIAL_BUDGETS);
    this.saveSavingsGoals(INITIAL_SAVINGS_GOALS);
    this.saveHoldings(INITIAL_HOLDINGS);
  },
};
