import React from 'react';
import { MarketTickerItem } from '../../types/market';
import { TrendingUp, TrendingDown, RefreshCw, Zap } from 'lucide-react';

interface MarketTickerBarProps {
  tickers: MarketTickerItem[];
  onSelectSymbol?: (symbol: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({
  tickers,
  onSelectSymbol,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="w-full bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-4 py-2 flex items-center justify-between overflow-hidden">
      <div className="flex items-center gap-2 mr-3 shrink-0">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Market Pulse
        </span>
      </div>

      {/* Tickers Scroll Container */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5 flex-1 mask-linear-fade">
        {tickers.map((item) => {
          const isUp = item.change >= 0;
          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol && onSelectSymbol(item.symbol)}
              className="group flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition-all shrink-0 select-none"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {item.symbol}
                </span>
                <span className="text-[11px] font-medium text-slate-300">
                  ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div
                className={`flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                  isUp
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-2.5 h-2.5 mr-0.5 inline" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 mr-0.5 inline" />
                )}
                {isUp ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh Button */}
      <div className="ml-3 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Force refresh live market rates"
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>
    </div>
  );
};
