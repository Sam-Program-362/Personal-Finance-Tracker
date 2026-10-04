export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Housing & Rent'
  | 'Food & Dining'
  | 'Transportation'
  | 'Utilities & Bills'
  | 'Entertainment'
  | 'Healthcare & Fitness'
  | 'Shopping & Goods'
  | 'Travel & Vacation'
  | 'Education & Learning'
  | 'Personal Care'
  | 'Investments & Savings'
  | 'Other Expense';

export type IncomeCategory =
  | 'Salary & Wages'
  | 'Freelance & Consulting'
  | 'Investments & Dividends'
  | 'Business Profits'
  | 'Rental Income'
  | 'Gifts & Grants'
  | 'Crypto & Staking'
  | 'Side Hustle'
  | 'Other Income';

export type Category = ExpenseCategory | IncomeCategory;

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Cash'
  | 'Crypto'
  | 'PayPal / Venmo'
  | 'Other';

export type RecurringFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type TransactionStatus = 'cleared' | 'pending';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: Category;
  date: string; // ISO YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  status: TransactionStatus;
  currency?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  alertThreshold: number; // percentage e.g. 80
  color: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  category: string;
  icon: string;
  color: string;
  notes?: string;
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'etf';
  shares: number;
  avgBuyPrice: number;
  purchaseDate: string;
}

export interface FinancialHealthMetrics {
  savingsRate: number; // percentage
  expenseToIncomeRatio: number; // percentage
  emergencyFundMonths: number; // estimated months
  discretionarySpendingRate: number; // percentage
  score: number; // 0-100
  scoreLabel: 'Excellent' | 'Good' | 'Moderate' | 'Needs Attention' | 'Critical';
  tips: string[];
}
