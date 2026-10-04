import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  ComposedChart,
} from 'recharts';
import { HistoricalDataPoint } from '../../types/market';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CacheBadge } from '../common/CacheBadge';
import { Search, RefreshCw, TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';

interface StockLookupChartProps {
  symbol: string;
  history: HistoricalDataPoint[];
  historySource: string;
  isLoading: boolean;
  onSelectSymbol: (symbol: string) => void;
  onRefresh: (forceFresh?: boolean) => void;
  onInspectCache?: () => void;
}

const POPULAR_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'SPY', 'BTC', 'ETH'];

export const StockLookupChart: React.FC<StockLookupChartProps> = ({
  symbol,
  history,
  historySource,
  isLoading,
  onSelectSymbol,
  onRefresh,
  onInspectCache,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | 'ALL'>('1M');
  const [chartMode, setChartMode] = useState<'area' | 'volume'>('area');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectSymbol(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  // Filter history based on timeframe
  const filteredHistory = React.useMemo(() => {
    if (!history || history.length === 0) return [];
    if (timeframe === '1M') return history.slice(-22);
    if (timeframe === '3M') return history.slice(-66);
    return history;
  }, [history, timeframe]);

  const latestPoint = filteredHistory[filteredHistory.length - 1] || { close: 0, open: 0, high: 0, low: 0, volume: 0, date: '' };
  const firstPoint = filteredHistory[0] || latestPoint;
  const priceChange = latestPoint.close - firstPoint.close;
  const priceChangePct = firstPoint.close > 0 ? (priceChange / firstPoint.close) * 100 : 0;
  const isPositive = priceChange >= 0;

  const minPrice = filteredHistory.length > 0 ? Math.min(...filteredHistory.map((d) => d.low)) : 0;
  const maxPrice = filteredHistory.length > 0 ? Math.max(...filteredHistory.map((d) => d.high)) : 100;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Top Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white tracking-tight">{symbol}</h3>
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}
              {priceChange.toFixed(2)} ({priceChangePct.toFixed(2)}%)
            </span>
            <CacheBadge
              source={historySource.toLowerCase().includes('live') ? 'network' : 'memory'}
              ttlRemainingMs={180000}
              onInspect={onInspectCache}
            />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-Time Market Time Series (Alpha Vantage API + Multi-Tier Cache Engine)
          </p>
        </div>

        {/* Search bar + refresh */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lookup ticker (e.g. NVDA)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
            />
          </form>

          <button
            onClick={() => onRefresh(true)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
            title="Force fresh API fetch"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Popular Symbol Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Quick Select:</span>
        {POPULAR_SYMBOLS.map((sym) => (
          <button
            key={sym}
            onClick={() => onSelectSymbol(sym)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              symbol === sym
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Price Highlights Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Price</span>
          <p className="text-base font-bold text-white mt-0.5">${latestPoint.close.toFixed(2)}</p>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Range High</span>
          <p className="text-base font-bold text-emerald-400 mt-0.5">${maxPrice.toFixed(2)}</p>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Range Low</span>
          <p className="text-base font-bold text-rose-400 mt-0.5">${minPrice.toFixed(2)}</p>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Volume</span>
          <p className="text-base font-bold text-indigo-300 mt-0.5">
            {(latestPoint.volume / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>

      {/* Controls & Timeframe */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setChartMode('area')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
              chartMode === 'area' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Activity className="w-3 h-3" /> Price
          </button>
          <button
            onClick={() => setChartMode('volume')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
              chartMode === 'volume' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <BarChart2 className="w-3 h-3" /> Volume
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          {(['1M', '3M', 'ALL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                timeframe === t ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span>Fetching real-time market data...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No chart data available for {symbol}.
          </div>
        ) : chartMode === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => val.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[minPrice * 0.98, maxPrice * 1.02]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `$${val.toFixed(0)}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Close Price']}
                labelFormatter={(label) => formatDate(String(label))}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={isPositive ? '#10b981' : '#f43f5e'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#stockGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => val.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(val: any) => [`${(Number(val) / 1000000).toFixed(2)}M`, 'Volume']}
                labelFormatter={(label) => formatDate(String(label))}
              />
              <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
