import React, { useState, useEffect } from 'react';
import { SUPPORTED_CURRENCIES } from '../../hooks/useCurrency';
import { alphaVantageService } from '../../services/alphaVantageApi';
import { CacheBadge } from '../common/CacheBadge';
import { ArrowLeftRight, RefreshCw, DollarSign } from 'lucide-react';

interface CurrencyConverterProps {
  onInspectCache?: () => void;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ onInspectCache }) => {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('1000');
  const [rate, setRate] = useState<number>(0.92);
  const [cacheSource, setCacheSource] = useState<string>('memory');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchConversionRate = async (from: string, to: string, forceFresh = false) => {
    setIsLoading(true);
    try {
      const res = await alphaVantageService.getExchangeRate(from, to, forceFresh);
      setRate(res.rate.exchangeRate);
      setCacheSource(res.source);
    } catch (err) {
      console.warn('Currency fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversionRate(fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const convertedAmount = parsedAmount * rate;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Real-Time Currency Converter</h3>
            <CacheBadge source={cacheSource} ttlRemainingMs={1800000} onInspect={onInspectCache} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Live FX conversion using Alpha Vantage Forex API</p>
        </div>

        <button
          onClick={() => fetchConversionRate(fromCurrency, toCurrency, true)}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh exchange rate"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Converter Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
        {/* From Amount & Currency */}
        <div className="md:col-span-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">You Convert</span>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-2 py-1 bg-transparent text-white font-bold text-lg focus:outline-none"
              />
            </div>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={handleSwap}
            className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 transition-all hover:scale-110"
            title="Swap currencies"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* To Converted Result */}
        <div className="md:col-span-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Converted Amount</span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-bold text-lg truncate">
              {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer shrink-0"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exchange Rate Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span>
          1 {fromCurrency} = <strong className="text-white">{rate.toFixed(4)}</strong> {toCurrency}
        </span>
        <span className="text-[11px] text-slate-500">Auto-cached TTL: 30 minutes</span>
      </div>
    </div>
  );
};
