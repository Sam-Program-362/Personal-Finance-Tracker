import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/common/Navbar';
import { MarketTickerBar } from './components/dashboard/MarketTickerBar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { CsvImportModal } from './components/transactions/CsvImportModal';
import { BudgetManager } from './components/budgets/BudgetManager';
import { SavingsGoals } from './components/budgets/SavingsGoals';
import { StockLookupChart } from './components/investments/StockLookupChart';
import { CurrencyConverter } from './components/investments/CurrencyConverter';
import { PortfolioView } from './components/investments/PortfolioView';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { CacheInspectorModal } from './components/cache/CacheInspectorModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastProvider, useToast } from './components/common/Toast';

import { useFinanceData } from './hooks/useFinanceData';
import { useMarketData } from './hooks/useMarketData';
import { useCurrency } from './hooks/useCurrency';
import { Transaction } from './types/finance';

function MainApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Finance state
  const {
    transactions,
    budgets,
    savingsGoals,
    holdings,
    totals,
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
  } = useFinanceData();

  // Market & Currency state
  const {
    tickers,
    selectedSymbol,
    symbolHistory,
    historySource,
    isLoadingHistory,
    isLoadingTickers,
    selectSymbol,
    refreshHistory,
    refreshTickers,
  } = useMarketData();

  const { baseCurrency, changeBaseCurrency } = useCurrency();

  // Modals state
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isCacheInspectorOpen, setIsCacheInspectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txData);
      showToast(`Updated transaction "${txData.title}"`, 'success');
      setEditingTransaction(null);
    } else {
      addTransaction(txData);
      showToast(`Added ${txData.type === 'income' ? 'income' : 'expense'} "${txData.title}"`, 'success');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    deleteTransaction(id);
    showToast(`Deleted transaction "${tx?.title || ''}"`, 'info');
  };

  const handleBulkImportCsv = (parsedTxs: Partial<Transaction>[]) => {
    const count = bulkAddTransactions(parsedTxs);
    showToast(`Successfully imported ${count} transactions from CSV`, 'success');
  };

  const handleDepositToGoal = (id: string, amount: number) => {
    depositToGoal(id, amount);
    showToast(`${amount >= 0 ? 'Deposited' : 'Withdrew'} funds for savings goal`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddTxModalOpen(true);
        }}
        onOpenCacheInspector={() => setIsCacheInspectorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        baseCurrency={baseCurrency}
      />

      {/* Market Ticker Ribbon */}
      <MarketTickerBar
        tickers={tickers}
        onSelectSymbol={(sym) => {
          selectSymbol(sym);
          setActiveTab('investments');
        }}
        onRefresh={() => {
          refreshTickers(true);
          showToast('Refreshed real-time market data', 'info');
        }}
        isLoading={isLoadingTickers}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            transactions={transactions}
            totals={totals}
            financialHealth={financialHealth}
            baseCurrency={baseCurrency}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddTxModalOpen(true);
            }}
            onViewAllTransactions={() => setActiveTab('transactions')}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsAddTxModalOpen(true);
            }}
            onNavigateToTab={(tabId) => setActiveTab(tabId as ActiveTab)}
          />
        )}

        {/* Tab 2: Transactions Manager */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            baseCurrency={baseCurrency}
            onAddTransaction={() => {
              setEditingTransaction(null);
              setIsAddTxModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsAddTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onBulkImport={() => setIsCsvImportOpen(true)}
          />
        )}

        {/* Tab 3: Budgets & Savings Goals */}
        {activeTab === 'budgets' && (
          <div className="space-y-8">
            <BudgetManager
              budgets={budgets}
              transactions={transactions}
              baseCurrency={baseCurrency}
              onAddBudget={(b) => {
                addBudget(b);
                showToast(`Created budget for ${b.category}`, 'success');
              }}
              onUpdateBudget={(id, updates) => {
                updateBudget(id, updates);
                showToast('Budget updated successfully', 'success');
              }}
              onDeleteBudget={(id) => {
                deleteBudget(id);
                showToast('Budget category deleted', 'info');
              }}
            />

            <SavingsGoals
              goals={savingsGoals}
              baseCurrency={baseCurrency}
              onAddGoal={(g) => {
                addSavingsGoal(g);
                showToast(`Created savings goal "${g.name}"`, 'success');
              }}
              onUpdateGoal={(id, updates) => {
                updateSavingsGoal(id, updates);
                showToast('Savings goal updated', 'success');
              }}
              onDeleteGoal={(id) => {
                deleteSavingsGoal(id);
                showToast('Savings goal deleted', 'info');
              }}
              onDeposit={handleDepositToGoal}
            />
          </div>
        )}

        {/* Tab 4: Market Hub & Investments */}
        {activeTab === 'investments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <StockLookupChart
                  symbol={selectedSymbol}
                  history={symbolHistory}
                  historySource={historySource}
                  isLoading={isLoadingHistory}
                  onSelectSymbol={selectSymbol}
                  onRefresh={(force) => {
                    refreshHistory(force);
                    showToast(`Updated real-time chart for ${selectedSymbol}`, 'info');
                  }}
                  onInspectCache={() => setIsCacheInspectorOpen(true)}
                />
              </div>

              <div className="lg:col-span-4">
                <CurrencyConverter onInspectCache={() => setIsCacheInspectorOpen(true)} />
              </div>
            </div>

            <PortfolioView
              holdings={holdings}
              baseCurrency={baseCurrency}
              onAddHolding={(h) => {
                addHolding(h);
                showToast(`Added holding ${h.symbol}`, 'success');
              }}
              onDeleteHolding={(id) => {
                deleteHolding(id);
                showToast('Removed asset from portfolio', 'info');
              }}
              onSelectSymbol={selectSymbol}
            />
          </div>
        )}

        {/* Tab 5: Analytics & Visualizations */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            transactions={transactions}
            budgets={budgets}
            financialHealth={financialHealth}
            baseCurrency={baseCurrency}
          />
        )}
      </main>

      {/* Modals */}
      <TransactionFormModal
        isOpen={isAddTxModalOpen}
        onClose={() => {
          setIsAddTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        baseCurrency={baseCurrency}
      />

      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onImport={handleBulkImportCsv}
      />

      <CacheInspectorModal
        isOpen={isCacheInspectorOpen}
        onClose={() => setIsCacheInspectorOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        baseCurrency={baseCurrency}
        onChangeBaseCurrency={(code) => {
          changeBaseCurrency(code);
          showToast(`Changed base currency to ${code}`, 'success');
        }}
        onResetToDemo={() => {
          resetToDemoData();
          showToast('Reset application to sample demo data', 'info');
        }}
        transactions={transactions}
        budgets={budgets}
        savingsGoals={savingsGoals}
        holdings={holdings}
      />

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-slate-800/80 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 ApexFinance Tracker · Real-time market analytics powered by Alpha Vantage & L1/L2 Cache Engine</p>
          <div className="flex items-center gap-3 text-slate-400">
            <button onClick={() => setIsCacheInspectorOpen(true)} className="hover:text-indigo-400">
              Cache Status
            </button>
            <span>•</span>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-indigo-400">
              API Config
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('analytics')} className="hover:text-indigo-400">
              Visual Reports
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
