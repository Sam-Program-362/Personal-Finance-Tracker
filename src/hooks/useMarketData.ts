import { useState, useEffect, useCallback } from 'react';
import { HistoricalDataPoint, MarketTickerItem } from '../types/market';
import { alphaVantageService } from '../services/alphaVantageApi';

export function useMarketData() {
  const [tickers, setTickers] = useState<MarketTickerItem[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [symbolHistory, setSymbolHistory] = useState<HistoricalDataPoint[]>([]);
  const [historySource, setHistorySource] = useState<string>('cache');
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isLoadingTickers, setIsLoadingTickers] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  const fetchTickers = useCallback(async (forceFresh = false) => {
    setIsLoadingTickers(true);
    try {
      const data = await alphaVantageService.getMarketTickers(forceFresh);
      setTickers(data);
      setLastRefreshed(Date.now());
    } catch (e) {
      console.warn('Failed to fetch market tickers:', e);
    } finally {
      setIsLoadingTickers(false);
    }
  }, []);

  const fetchHistory = useCallback(async (sym: string, forceFresh = false) => {
    setIsLoadingHistory(true);
    try {
      const res = await alphaVantageService.getDailyTimeSeries(sym, forceFresh);
      setSymbolHistory(res.data);
      setHistorySource(res.isFromCache ? `Cache (${res.source})` : 'Alpha Vantage Live');
    } catch (e) {
      console.warn(`Failed to fetch history for ${sym}:`, e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchTickers();
    // Auto-refresh tickers every 60 seconds
    const interval = setInterval(() => {
      fetchTickers(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchTickers]);

  useEffect(() => {
    if (selectedSymbol) {
      fetchHistory(selectedSymbol);
    }
  }, [selectedSymbol, fetchHistory]);

  const selectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol.toUpperCase());
  }, []);

  return {
    tickers,
    selectedSymbol,
    symbolHistory,
    historySource,
    isLoadingHistory,
    isLoadingTickers,
    lastRefreshed,
    selectSymbol,
    refreshHistory: (forceFresh = true) => fetchHistory(selectedSymbol, forceFresh),
    refreshTickers: (forceFresh = true) => fetchTickers(forceFresh),
  };
}
