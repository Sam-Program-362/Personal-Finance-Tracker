import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { getAlphaVantageApiKey, setAlphaVantageApiKey, alphaVantageService } from '../../services/alphaVantageApi';
import { SUPPORTED_CURRENCIES } from '../../hooks/useCurrency';
import { exportImportService } from '../../services/exportImportService';
import { Budget, PortfolioHolding, SavingsGoal, Transaction } from '../../types/finance';
import {
  Key,
  Globe,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency: string;
  onChangeBaseCurrency: (code: string) => void;
  onResetToDemo: () => void;
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  holdings: PortfolioHolding[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  baseCurrency,
  onChangeBaseCurrency,
  onResetToDemo,
  transactions,
  budgets,
  savingsGoals,
  holdings,
}) => {
  const [apiKey, setApiKey] = useState(() => getAlphaVantageApiKey());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveApiKey = () => {
    setAlphaVantageApiKey(apiKey);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestApiKey = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      const res = await alphaVantageService.getGlobalQuote('AAPL', true);
      if (res.quote.price > 0) {
        setTestStatus('success');
        setTestMessage(`API Connected! Successfully fetched AAPL quote ($${res.quote.price.toFixed(2)})`);
      } else {
        setTestStatus('error');
        setTestMessage('Received empty response. Rate limit may apply, but fallback simulator is active.');
      }
    } catch (e) {
      setTestStatus('error');
      setTestMessage('Failed to connect to Alpha Vantage API.');
    }
  };

  const handleExportBackup = () => {
    exportImportService.exportBackupJson({
      transactions,
      budgets,
      goals: savingsGoals,
    });
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data and re-populate fresh demo transactions, budgets, and goals?')) {
      onResetToDemo();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Settings & API Configuration"
      subtitle="Configure Alpha Vantage public API keys, base currency, and backup management."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Alpha Vantage API Key Section */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Alpha Vantage Public API Key</h4>
            </div>
            <a
              href="https://www.alphavantage.co/support/#api-key"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-400">
            Alpha Vantage provides real-time stock quotes, historical time series, and forex exchange rates. Default &apos;demo&apos; key with intelligent local caching and fallback is active.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter your Alpha Vantage API key (or 'demo')"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleTestApiKey}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test'}
            </button>
          </div>

          {saveSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> API key saved successfully.
            </p>
          )}

          {testStatus === 'success' && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {testMessage}
            </p>
          )}

          {testStatus === 'error' && (
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {testMessage}
            </p>
          )}
        </div>

        {/* Base Currency Selector */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Base Display Currency</h4>
          </div>
          <p className="text-xs text-slate-400">
            Select your preferred currency for dashboard totals, transactions, and budgets.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => onChangeBaseCurrency(c.code)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  baseCurrency === c.code
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                </div>
                <span className="text-slate-400">{c.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-white">Data Backup & Factory Reset</h4>
          <p className="text-xs text-slate-400">
            Export a full JSON snapshot of your transactions and budgets, or restore factory sample data.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleExportBackup}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export JSON Backup</span>
            </button>

            <button
              onClick={handleResetData}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset & Reload Demo Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
