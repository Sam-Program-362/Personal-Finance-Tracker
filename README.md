# 💰 ApexFinance Tracker

A high-performance **Personal Finance Tracker** built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Recharts**, featuring real-time market data powered by **Alpha Vantage API** and an intelligent **Multi-Tier Caching Engine**.

---

## 🚀 Key Features

### 1. 📊 Expense & Income Tracking
- **Complete CRUD Operations**: Add, edit, categorize, and delete transactions with ease.
- **Smart Categorization**: Preset & custom categories across essential expenses (Housing, Food, Transport, Utilities, Healthcare, Entertainment, etc.) and income sources (Salary, Freelancing, Dividends, Business, Staking, etc.).
- **Transaction Details**: Amount, Date, Category, Payment Method (Cash, Card, Transfer, Crypto), Recurring Frequencies (Daily, Weekly, Monthly, Yearly), Status (Cleared / Pending), Notes, and Tags.
- **Multi-Facet Filtering & Search**: Instant full-text search, category filter, payment method filter, status filter, date range presets, and sorting options.
- **Bulk Operations**: Bulk selection, deletion, CSV export, and CSV import with parsed preview.

### 2. ⚡ Real-Time Market Intelligence (Alpha Vantage API)
- **Live Stock & ETF Quotes**: Real-time quotes for AAPL, MSFT, NVDA, TSLA, SPY, VOO, etc.
- **Crypto & Forex Tracking**: Real-time crypto prices (BTC, ETH, SOL) and Forex rates across 12+ fiat currencies.
- **Interactive Time Series Charts**: Historical daily charts with area / volume views and range statistics (High, Low, Volume).
- **Multi-Currency Live Converter**: Fast currency conversions with cached exchange rates.
- **API Resilience & Fallback Simulator**: High-fidelity dynamic fallback simulation if rate limits occur or when running in offline/demo mode.

### 3. 🧠 Multi-Tier Robust Caching Engine
- **L1 In-Memory Cache (RAM)**: Sub-millisecond instant lookup for active session data.
- **L2 Storage Cache (LocalStorage)**: Persistent storage across browser reloads.
- **Stale-While-Revalidate (SWR)**: Delivers immediate cached responses while refreshing fresh data in the background.
- **Granular TTL Policies**:
  - Stock/Crypto Quotes: 3 minutes TTL
  - FX Rates: 30 minutes TTL
  - Daily Historical Series: 6 hours TTL
- **Live Cache Inspector Dashboard**:
  - Live Cache Hit Ratio % & counter metrics.
  - Memory & Disk storage size estimators.
  - Interactive table of cached keys with real-time TTL countdowns.
  - Raw JSON payload inspector.
  - Cache Invalidation & Purge controls.
  - Visual status badges on live components (`[⚡ RAM Cache]`, `[💾 Disk Cache]`, `[🌐 Live API]`).

### 4. 📈 Rich Data Visualizations & Analytics Suite
- **Cash Flow Trend & Net Accumulation Chart**: Smooth multi-gradient Area/Line charts comparing monthly income vs expenses.
- **Category Expense Donut Chart**: Interactive donut breakdown with slice highlighting and percentage distribution.
- **Financial Health Scorecard**: Algorithmic scoring (0–100), savings rate metrics, runway in months, and AI-styled financial advice tips.
- **Daily Spending Activity Heatmap**: GitHub-style calendar matrix showing 12 weeks of daily spend intensity.
- **Budget vs. Actual Spending Chart**: Grouped bar chart highlighting monthly limits vs real outflows with variance warnings.
- **Monthly Savings Margin Comparison**: Income, expense, and retained net savings bar chart.
- **Investment Portfolio Allocations**: Asset breakdown chart and P&L (Profit & Loss) tracking.

### 5. 🎯 Budgets & Milestone Savings Goals
- **Monthly Category Budgets**: Category limits with progress bars and dynamic warning thresholds (80% warning, >100% over-budget alerts).
- **Milestone Savings Goals**: Goal cards with progress rings, target date countdowns, and quick "Deposit / Withdraw" modal with celebratory confetti on completion!

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Charts & Data Viz**: Recharts
- **Celebration Effects**: Canvas Confetti
- **Date Handling**: date-fns

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be live at `http://localhost:5173`.
