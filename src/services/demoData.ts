import { Budget, PortfolioHolding, SavingsGoal, Transaction } from '../types/finance';

export const INITIAL_BUDGETS: Budget[] = [
  { id: 'b-1', category: 'Housing & Rent', monthlyLimit: 1800, alertThreshold: 90, color: '#6366f1' },
  { id: 'b-2', category: 'Food & Dining', monthlyLimit: 750, alertThreshold: 80, color: '#f59e0b' },
  { id: 'b-3', category: 'Transportation', monthlyLimit: 400, alertThreshold: 80, color: '#10b981' },
  { id: 'b-4', category: 'Utilities & Bills', monthlyLimit: 300, alertThreshold: 85, color: '#06b6d4' },
  { id: 'b-5', category: 'Entertainment', monthlyLimit: 250, alertThreshold: 75, color: '#ec4899' },
  { id: 'b-6', category: 'Shopping & Goods', monthlyLimit: 350, alertThreshold: 80, color: '#8b5cf6' },
  { id: 'b-7', category: 'Healthcare & Fitness', monthlyLimit: 200, alertThreshold: 80, color: '#14b8a6' },
  { id: 'b-8', category: 'Education & Learning', monthlyLimit: 150, alertThreshold: 80, color: '#f97316' },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'g-1',
    name: 'Emergency Fund (6 Months)',
    targetAmount: 20000,
    currentAmount: 14500,
    deadline: '2026-12-31',
    category: 'Safety Net',
    icon: 'ShieldCheck',
    color: '#10b981',
    notes: 'Safe liquid reserves in high-yield savings account',
  },
  {
    id: 'g-2',
    name: 'New Car Down Payment',
    targetAmount: 8000,
    currentAmount: 5200,
    deadline: '2026-11-15',
    category: 'Vehicle',
    icon: 'Car',
    color: '#6366f1',
    notes: 'Saving for electric vehicle transition',
  },
  {
    id: 'g-3',
    name: 'Japan Vacation Trip',
    targetAmount: 4500,
    currentAmount: 3800,
    deadline: '2027-04-01',
    category: 'Travel',
    icon: 'Plane',
    color: '#ec4899',
    notes: 'Tokyo & Kyoto cherry blossom tour',
  },
  {
    id: 'g-4',
    name: 'Tech Setup & Laptop Upgrade',
    targetAmount: 3000,
    currentAmount: 2400,
    deadline: '2026-10-30',
    category: 'Equipment',
    icon: 'Laptop',
    color: '#f59e0b',
    notes: 'M4 MacBook Pro & Studio Display',
  },
];

export const INITIAL_HOLDINGS: PortfolioHolding[] = [
  { id: 'h-1', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', shares: 25, avgBuyPrice: 195.50, purchaseDate: '2024-03-12' },
  { id: 'h-2', symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', shares: 40, avgBuyPrice: 92.40, purchaseDate: '2024-01-18' },
  { id: 'h-3', symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', shares: 15, avgBuyPrice: 380.00, purchaseDate: '2024-05-10' },
  { id: 'h-4', symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', shares: 20, avgBuyPrice: 510.00, purchaseDate: '2024-02-01' },
  { id: 'h-5', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', shares: 0.35, avgBuyPrice: 58200.00, purchaseDate: '2024-04-15' },
  { id: 'h-6', symbol: 'ETH', name: 'Ethereum', type: 'crypto', shares: 2.5, avgBuyPrice: 2450.00, purchaseDate: '2024-06-20' },
];

export function generateDemoTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date('2026-10-04T12:00:00Z');

  // Generator helper
  const addTx = (
    daysAgo: number,
    type: 'income' | 'expense',
    title: string,
    amount: number,
    category: any,
    paymentMethod: any,
    notes = '',
    tags: string[] = [],
    isRecurring = false,
    recurringFreq: any = 'none',
    status: 'cleared' | 'pending' = 'cleared'
  ) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    const timestamp = d.getTime();

    transactions.push({
      id: `tx-demo-${transactions.length + 1}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      amount,
      category,
      date: dateStr,
      paymentMethod,
      notes,
      tags,
      isRecurring,
      recurringFrequency: recurringFreq,
      status,
      currency: 'USD',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  };

  // Recent transactions (Month 0 - Current October 2026)
  addTx(0, 'expense', 'Organic Grocery Shopping & Produce', 142.80, 'Food & Dining', 'Credit Card', 'Whole Foods weekly run', ['groceries', 'food']);
  addTx(1, 'expense', 'Electric & Grid Utility Bill', 124.50, 'Utilities & Bills', 'Bank Transfer', 'Monthly power bill', ['utilities', 'home'], true, 'monthly');
  addTx(1, 'income', 'Freelance Frontend Architecture Project', 1850.00, 'Freelance & Consulting', 'Bank Transfer', 'Client Milestone #2 payment', ['freelance', 'work']);
  addTx(2, 'expense', 'Gas Station Refuel', 58.40, 'Transportation', 'Debit Card', 'Full tank premium gas', ['car', 'gas']);
  addTx(3, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Bi-weekly direct deposit', ['salary', 'direct-deposit'], true, 'biweekly');
  addTx(3, 'expense', 'Apartment Rent Payment', 1750.00, 'Housing & Rent', 'Bank Transfer', 'October Rent', ['rent', 'fixed-cost'], true, 'monthly');
  addTx(4, 'expense', 'Dinner with Friends at Italian Bistro', 86.50, 'Food & Dining', 'Credit Card', 'Pasta & wine evening', ['dining', 'social']);
  addTx(5, 'expense', 'Cloud Server Hosting & Domain', 42.00, 'Utilities & Bills', 'Credit Card', 'Vercel & AWS services', ['cloud', 'tools'], true, 'monthly');
  addTx(6, 'expense', 'Gym Membership & Recovery Spa', 95.00, 'Healthcare & Fitness', 'Debit Card', 'Monthly access', ['health', 'fitness'], true, 'monthly');
  addTx(7, 'expense', 'Spotify & Netflix Streaming Bundle', 28.98, 'Entertainment', 'Credit Card', 'Family streaming subscription', ['subscriptions'], true, 'monthly');
  addTx(8, 'income', 'Stock Dividend Payout (AAPL & SPY)', 142.30, 'Investments & Dividends', 'Bank Transfer', 'Quarterly dividends', ['passive-income', 'stocks']);
  addTx(9, 'expense', 'Noise-Cancelling Headphones Sale', 219.00, 'Shopping & Goods', 'Credit Card', 'Sony WH-1000XM5 deal', ['tech', 'gadgets']);
  addTx(10, 'expense', 'Uber Airport Ride', 46.20, 'Transportation', 'PayPal / Venmo', 'Ride to airport', ['travel', 'transport']);

  // Month 1 (September 2026)
  addTx(15, 'expense', 'Weekly Groceries & Meal Prep', 165.20, 'Food & Dining', 'Credit Card', 'Trader Joe’s haul', ['groceries']);
  addTx(17, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Direct deposit', ['salary'], true, 'biweekly');
  addTx(18, 'expense', 'High-Speed Fiber Internet Bill', 75.00, 'Utilities & Bills', 'Bank Transfer', '1 Gbps symmetrical fiber', ['utilities', 'internet'], true, 'monthly');
  addTx(20, 'expense', 'Weekend Roadtrip Lodging & Food', 320.00, 'Travel & Vacation', 'Credit Card', 'Cabin rental with friends', ['travel', 'vacation']);
  addTx(22, 'expense', 'Online Course - Advanced AI Systems', 120.00, 'Education & Learning', 'Credit Card', 'Full course certificate', ['education', 'skills']);
  addTx(24, 'expense', 'Sushi & Omakase Dinner', 115.00, 'Food & Dining', 'Credit Card', 'Celebration dinner', ['dining', 'food']);
  addTx(26, 'expense', 'Auto Insurance Premium', 110.00, 'Transportation', 'Bank Transfer', 'Monthly policy coverage', ['car', 'insurance'], true, 'monthly');
  addTx(28, 'income', 'Consulting Advisory Session', 600.00, 'Freelance & Consulting', 'Bank Transfer', '2 hour strategic consulting', ['consulting']);
  addTx(32, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Direct deposit', ['salary'], true, 'biweekly');
  addTx(33, 'expense', 'Apartment Rent Payment', 1750.00, 'Housing & Rent', 'Bank Transfer', 'September Rent', ['rent'], true, 'monthly');
  addTx(35, 'expense', 'New Ergonomic Desk Chair', 340.00, 'Shopping & Goods', 'Credit Card', 'Herman Miller refurbished', ['home-office']);

  // Month 2 (August 2026)
  addTx(40, 'expense', 'Supermarket Supplies', 178.50, 'Food & Dining', 'Credit Card', 'Costco bulk shopping', ['groceries']);
  addTx(45, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Direct deposit', ['salary'], true, 'biweekly');
  addTx(47, 'expense', 'Mobile Phone Plan Bill', 65.00, 'Utilities & Bills', 'Credit Card', 'Unlimited 5G plan', ['bills'], true, 'monthly');
  addTx(50, 'expense', 'Cinema Tickets & IMAX Popcorn', 44.00, 'Entertainment', 'Debit Card', 'Sci-fi movie night', ['entertainment']);
  addTx(55, 'expense', 'Dental Cleaning & Checkup', 150.00, 'Healthcare & Fitness', 'Credit Card', 'Annual prophylaxis', ['health']);
  addTx(60, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Direct deposit', ['salary'], true, 'biweekly');
  addTx(62, 'expense', 'Apartment Rent Payment', 1750.00, 'Housing & Rent', 'Bank Transfer', 'August Rent', ['rent'], true, 'monthly');
  addTx(65, 'income', 'Side Project SaaS Subscription Revenue', 890.00, 'Business Profits', 'Stripe / Bank', 'Monthly recurring product revenue', ['saas', 'side-hustle']);

  // Month 3 (July 2026)
  addTx(70, 'expense', 'Groceries & Farmers Market', 155.00, 'Food & Dining', 'Cash', 'Fresh organic produce', ['food']);
  addTx(75, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Direct deposit', ['salary'], true, 'biweekly');
  addTx(78, 'expense', 'Flight Tickets for Summer Holiday', 540.00, 'Travel & Vacation', 'Credit Card', 'Roundtrip tickets', ['travel']);
  addTx(82, 'expense', 'Car Maintenance & Oil Service', 185.00, 'Transportation', 'Debit Card', 'Synthetic oil change & filter', ['car']);
  addTx(90, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Direct deposit', ['salary'], true, 'biweekly');
  addTx(92, 'expense', 'Apartment Rent Payment', 1750.00, 'Housing & Rent', 'Bank Transfer', 'July Rent', ['rent'], true, 'monthly');
  addTx(95, 'income', 'Crypto Staking Rewards', 210.00, 'Crypto & Staking', 'Crypto', 'ETH Staking rewards', ['crypto', 'passive']);

  // Month 4 (June 2026)
  addTx(105, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Direct deposit', ['salary'], true, 'biweekly');
  addTx(110, 'expense', 'Apartment Rent Payment', 1750.00, 'Housing & Rent', 'Bank Transfer', 'June Rent', ['rent'], true, 'monthly');
  addTx(115, 'expense', 'Electronics & Keyboard Upgrade', 195.00, 'Shopping & Goods', 'Credit Card', 'Custom mechanical keyboard', ['tech']);
  addTx(120, 'income', 'Primary Tech Salary (Bi-weekly)', 3950.00, 'Salary & Wages', 'Bank Transfer', 'Direct deposit', ['salary'], true, 'biweekly');

  return transactions;
}
