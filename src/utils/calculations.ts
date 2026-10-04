import { Budget, FinancialHealthMetrics, Transaction } from '../types/finance';

export const CATEGORY_COLORS: Record<string, string> = {
  // Expenses
  'Housing & Rent': '#6366f1',
  'Food & Dining': '#f59e0b',
  'Transportation': '#10b981',
  'Utilities & Bills': '#06b6d4',
  'Entertainment': '#ec4899',
  'Healthcare & Fitness': '#14b8a6',
  'Shopping & Goods': '#8b5cf6',
  'Travel & Vacation': '#3b82f6',
  'Education & Learning': '#f97316',
  'Personal Care': '#d946ef',
  'Investments & Savings': '#84cc16',
  'Other Expense': '#64748b',

  // Incomes
  'Salary & Wages': '#10b981',
  'Freelance & Consulting': '#3b82f6',
  'Investments & Dividends': '#8b5cf6',
  'Business Profits': '#06b6d4',
  'Rental Income': '#eab308',
  'Gifts & Grants': '#ec4899',
  'Crypto & Staking': '#f97316',
  'Side Hustle': '#14b8a6',
  'Other Income': '#94a3b8',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#64748b';
}

export function calculateTotals(transactions: Transaction[]) {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate: Math.max(0, parseFloat(savingsRate.toFixed(1))),
  };
}

export function aggregateByCategory(transactions: Transaction[], type: 'expense' | 'income') {
  const map: Record<string, number> = {};
  let total = 0;

  transactions
    .filter((tx) => tx.type === type)
    .forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
      total += tx.amount;
    });

  return Object.entries(map)
    .map(([category, amount]) => ({
      name: category,
      value: parseFloat(amount.toFixed(2)),
      percentage: total > 0 ? parseFloat(((amount / total) * 100).toFixed(1)) : 0,
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateMonthlyTrends(transactions: Transaction[]) {
  const monthMap: Record<string, { month: string; income: number; expense: number; net: number; dateSort: string }> = {};

  transactions.forEach((tx) => {
    const d = new Date(tx.date + 'T00:00:00');
    const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const dateSort = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap[dateSort]) {
      monthMap[dateSort] = {
        month: monthKey,
        income: 0,
        expense: 0,
        net: 0,
        dateSort,
      };
    }

    if (tx.type === 'income') {
      monthMap[dateSort].income += tx.amount;
    } else {
      monthMap[dateSort].expense += tx.amount;
    }
  });

  const sorted = Object.values(monthMap).sort((a, b) => a.dateSort.localeCompare(b.dateSort));

  // Compute net
  sorted.forEach((item) => {
    item.income = parseFloat(item.income.toFixed(2));
    item.expense = parseFloat(item.expense.toFixed(2));
    item.net = parseFloat((item.income - item.expense).toFixed(2));
  });

  return sorted;
}

export function calculateBudgetStatus(budgets: Budget[], transactions: Transaction[], currentMonthStr?: string) {
  // Use current month or default to latest month in transactions
  const nowMonth = currentMonthStr || new Date().toISOString().substring(0, 7); // '2026-10'

  const currentMonthExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && tx.date.startsWith(nowMonth)
  );

  return budgets.map((b) => {
    const spent = currentMonthExpenses
      .filter((tx) => tx.category === b.category)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const remaining = b.monthlyLimit - spent;
    const percentUsed = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    const isOver = spent > b.monthlyLimit;
    const isWarning = percentUsed >= b.alertThreshold && !isOver;

    return {
      budget: b,
      spent: parseFloat(spent.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      percentUsed: parseFloat(percentUsed.toFixed(1)),
      isOver,
      isWarning,
    };
  });
}

export function computeFinancialHealth(transactions: Transaction[], currentBalance: number): FinancialHealthMetrics {
  const totals = calculateTotals(transactions);
  const totalIncome = totals.totalIncome;
  const totalExpense = totals.totalExpense;

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const expenseToIncomeRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 100;

  // Monthly average expense estimate
  const monthlyTrends = aggregateMonthlyTrends(transactions);
  const avgMonthlyExpense = monthlyTrends.length > 0
    ? monthlyTrends.reduce((sum, m) => sum + m.expense, 0) / monthlyTrends.length
    : 2500;

  const emergencyFundMonths = avgMonthlyExpense > 0 ? currentBalance / avgMonthlyExpense : 0;

  // Essential categories vs Discretionary
  const discretionaryCategories = ['Entertainment', 'Shopping & Goods', 'Travel & Vacation', 'Other Expense'];
  const discretionaryExpense = transactions
    .filter((tx) => tx.type === 'expense' && discretionaryCategories.includes(tx.category))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const discretionarySpendingRate = totalExpense > 0 ? (discretionaryExpense / totalExpense) * 100 : 0;

  // Calculate score 0 - 100
  let score = 50;

  // Savings rate points (up to 35 pts)
  if (savingsRate >= 30) score += 35;
  else if (savingsRate >= 20) score += 25;
  else if (savingsRate >= 10) score += 15;
  else if (savingsRate > 0) score += 5;
  else score -= 15;

  // Emergency runway points (up to 30 pts)
  if (emergencyFundMonths >= 6) score += 30;
  else if (emergencyFundMonths >= 3) score += 20;
  else if (emergencyFundMonths >= 1) score += 10;
  else score -= 10;

  // Discretionary control points (up to 20 pts)
  if (discretionarySpendingRate < 25) score += 20;
  else if (discretionarySpendingRate < 40) score += 10;
  else score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let scoreLabel: FinancialHealthMetrics['scoreLabel'] = 'Moderate';
  if (score >= 85) scoreLabel = 'Excellent';
  else if (score >= 70) scoreLabel = 'Good';
  else if (score >= 50) scoreLabel = 'Moderate';
  else if (score >= 30) scoreLabel = 'Needs Attention';
  else scoreLabel = 'Critical';

  const tips: string[] = [];
  if (savingsRate < 20) tips.push('Aim to boost your savings rate to at least 20% of net income.');
  if (emergencyFundMonths < 3) tips.push(`Build emergency fund runway toward at least 3-6 months (currently ~${emergencyFundMonths.toFixed(1)} mo).`);
  if (discretionarySpendingRate > 35) tips.push('Discretionary spending is high; check shopping and entertainment subscriptions.');
  if (savingsRate >= 30 && emergencyFundMonths >= 6) tips.push('Great job! Consider allocating surplus cash into diversified investments and index funds.');
  if (tips.length === 0) tips.push('Your financial health is on track. Keep sticking to your monthly category limits!');

  return {
    savingsRate: parseFloat(savingsRate.toFixed(1)),
    expenseToIncomeRatio: parseFloat(expenseToIncomeRatio.toFixed(1)),
    emergencyFundMonths: parseFloat(emergencyFundMonths.toFixed(1)),
    discretionarySpendingRate: parseFloat(discretionarySpendingRate.toFixed(1)),
    score,
    scoreLabel,
    tips,
  };
}
