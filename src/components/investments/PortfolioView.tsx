import React, { useState } from 'react';
import { PortfolioHolding } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Modal } from '../common/Modal';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Trash2,
} from 'lucide-react';

interface PortfolioViewProps {
  holdings: PortfolioHolding[];
  baseCurrency?: string;
  onAddHolding: (holding: Omit<PortfolioHolding, 'id'>) => void;
  onDeleteHolding: (id: string) => void;
  onSelectSymbol: (symbol: string) => void;
}

const HOLDING_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316'];

// Current price simulation map for holdings
const ESTIMATED_PRICES: Record<string, number> = {
  AAPL: 232.45,
  NVDA: 128.90,
  MSFT: 448.20,
  SPY: 574.60,
  BTC: 65420.00,
  ETH: 2640.50,
  TSLA: 248.80,
  AMZN: 194.50,
  GOOGL: 182.15,
};

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  holdings,
  baseCurrency = 'USD',
  onAddHolding,
  onDeleteHolding,
  onSelectSymbol,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'stock' | 'crypto' | 'etf'>('stock');
  const [shares, setShares] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');

  // Enrich holdings with current prices and calculations
  const enrichedHoldings = holdings.map((h) => {
    const currentPrice = ESTIMATED_PRICES[h.symbol] || h.avgBuyPrice * 1.05;
    const totalCost = h.shares * h.avgBuyPrice;
    const currentValue = h.shares * currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      ...h,
      currentPrice,
      totalCost,
      currentValue,
      profitLoss,
      profitLossPercent,
    };
  });

  const totalPortfolioValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPortfolioCost = enrichedHoldings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalProfitLoss = totalPortfolioValue - totalPortfolioCost;
  const totalProfitLossPercent = totalPortfolioCost > 0 ? (totalProfitLoss / totalPortfolioCost) * 100 : 0;

  // Chart data for asset allocation
  const allocationData = enrichedHoldings.map((h, idx) => ({
    name: h.symbol,
    value: parseFloat(h.currentValue.toFixed(2)),
    color: HOLDING_COLORS[idx % HOLDING_COLORS.length],
  }));

  const handleCreateHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !shares || !avgBuyPrice) return;

    onAddHolding({
      symbol: symbol.toUpperCase().trim(),
      name: name.trim() || symbol.toUpperCase().trim(),
      type,
      shares: parseFloat(shares) || 1,
      avgBuyPrice: parseFloat(avgBuyPrice) || 100,
      purchaseDate: new Date().toISOString().split('T')[0],
    });

    setSymbol('');
    setName('');
    setShares('');
    setAvgBuyPrice('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              <span>Investment Portfolio & Assets</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Live market tracking of stocks, ETFs, and digital assets.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>

        {/* Portfolio Value Summary */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Portfolio Value</span>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(totalPortfolioValue, baseCurrency)}
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Invested Cost</span>
            <p className="text-2xl font-bold text-slate-300 mt-1">
              {formatCurrency(totalPortfolioCost, baseCurrency)}
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold">All-Time P&L</span>
            <div className="flex items-center gap-2 mt-1">
              <p
                className={`text-2xl font-bold ${
                  totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalProfitLoss >= 0 ? '+' : ''}
                {formatCurrency(totalProfitLoss, baseCurrency)}
              </p>
              <span
                className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  totalProfitLoss >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {totalProfitLoss >= 0 ? '+' : ''}
                {totalProfitLossPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Allocation Donut + Holdings Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Allocation Donut */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <h4 className="text-base font-bold text-white tracking-tight">Asset Allocation</h4>
          <div className="h-56 relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val) || 0, baseCurrency), 'Value']}
                />
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Assets</span>
              <span className="text-base font-bold text-white">{enrichedHoldings.length}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            {allocationData.map((item) => (
              <span
                key={item.name}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-slate-800/60 text-slate-200"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Holdings Table */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-base font-bold text-white tracking-tight">Holdings & Positions</h4>
            <span className="text-xs text-slate-400">Click row to view live chart</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Asset</th>
                  <th className="p-3">Shares</th>
                  <th className="p-3">Avg Buy</th>
                  <th className="p-3">Live Price</th>
                  <th className="p-3">Total Value</th>
                  <th className="p-3 text-right">P&L</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {enrichedHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No investment holdings added yet.
                    </td>
                  </tr>
                ) : (
                  enrichedHoldings.map((h) => {
                    const isProfit = h.profitLoss >= 0;
                    return (
                      <tr
                        key={h.id}
                        onClick={() => onSelectSymbol(h.symbol)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {h.symbol}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded uppercase">
                              {h.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 truncate block max-w-[120px]">{h.name}</span>
                        </td>
                        <td className="p-3 text-slate-200 font-mono">{h.shares}</td>
                        <td className="p-3 text-slate-400 font-mono">{formatCurrency(h.avgBuyPrice, baseCurrency)}</td>
                        <td className="p-3 text-white font-semibold font-mono">
                          {formatCurrency(h.currentPrice, baseCurrency)}
                        </td>
                        <td className="p-3 text-white font-bold font-mono">
                          {formatCurrency(h.currentValue, baseCurrency)}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span className={`font-semibold flex items-center justify-end gap-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isProfit ? '+' : ''}
                            {formatCurrency(h.profitLoss, baseCurrency)}
                          </span>
                          <span className={`text-[10px] ${isProfit ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                            ({isProfit ? '+' : ''}{h.profitLossPercent.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onDeleteHolding(h.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Holding"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Holding Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Portfolio Holding"
        subtitle="Track stocks, ETFs, and crypto in your personal balance sheet."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateHolding} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Symbol / Ticker *
            </label>
            <input
              type="text"
              placeholder="e.g. AAPL, NVDA, BTC, VOO"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Asset Name
            </label>
            <input
              type="text"
              placeholder="e.g. Apple Inc., Vanguard S&P 500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Asset Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-2 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                min="0.0001"
                placeholder="10"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Avg Buy ($) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="150"
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                required
              />
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
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition-all"
            >
              Add Holding
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
