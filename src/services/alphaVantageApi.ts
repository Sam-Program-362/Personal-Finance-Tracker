import { cacheManager } from './cacheManager';
import { CurrencyRate, GlobalQuote, HistoricalDataPoint, MarketTickerItem } from '../types/market';

const DEFAULT_API_KEY = 'demo';
const API_KEY_STORAGE = 'pft_av_api_key';

export const getAlphaVantageApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE) || DEFAULT_API_KEY;
};

export const setAlphaVantageApiKey = (key: string): void => {
  if (key.trim()) {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
};

// Base mock market prices for fallback and dynamic micro-fluctuations
const BASE_MARKET_DATA: Record<string, { name: string; price: number; type: 'stock' | 'crypto' | 'forex' | 'index'; volatility: number }> = {
  AAPL: { name: 'Apple Inc.', price: 232.45, type: 'stock', volatility: 0.015 },
  MSFT: { name: 'Microsoft Corp.', price: 448.20, type: 'stock', volatility: 0.012 },
  NVDA: { name: 'NVIDIA Corp.', price: 128.90, type: 'stock', volatility: 0.028 },
  GOOGL: { name: 'Alphabet Inc.', price: 182.15, type: 'stock', volatility: 0.014 },
  AMZN: { name: 'Amazon.com Inc.', price: 194.50, type: 'stock', volatility: 0.018 },
  TSLA: { name: 'Tesla Inc.', price: 248.80, type: 'stock', volatility: 0.035 },
  SPY: { name: 'SPDR S&P 500 ETF', price: 574.60, type: 'index', volatility: 0.008 },
  VOO: { name: 'Vanguard S&P 500 ETF', price: 526.40, type: 'index', volatility: 0.008 },
  QQQ: { name: 'Invesco QQQ Trust', price: 489.10, type: 'index', volatility: 0.012 },
  BTC: { name: 'Bitcoin (USD)', price: 65420.00, type: 'crypto', volatility: 0.038 },
  ETH: { name: 'Ethereum (USD)', price: 2640.50, type: 'crypto', volatility: 0.042 },
  SOL: { name: 'Solana (USD)', price: 154.20, type: 'crypto', volatility: 0.05 },
};

// Base FX rates against USD
const BASE_FX_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.77,
  JPY: 148.50,
  CAD: 1.38,
  AUD: 1.51,
  CHF: 0.86,
  INR: 84.15,
  CNY: 7.12,
  SGD: 1.31,
  BRL: 5.45,
  MXN: 19.35,
};

/**
 * Generate simulated dynamic historical data for any symbol
 */
function generateMockHistory(symbol: string, currentPrice: number, days: number = 30): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];
  let price = currentPrice * (1 - (Math.random() * 0.1 - 0.05));
  const baseDate = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    // skip weekends for stocks
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (isWeekend && !['BTC', 'ETH', 'SOL'].includes(symbol)) continue;

    const changePct = (Math.random() - 0.49) * 0.03;
    const open = price;
    const close = Math.max(1, price * (1 + changePct));
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 5000000) + 1000000;

    points.push({
      date: d.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  // Ensure last point aligns with currentPrice
  if (points.length > 0) {
    points[points.length - 1].close = currentPrice;
  }
  return points;
}

export class AlphaVantageService {
  private baseUrl = 'https://www.alphavantage.co/query';

  /**
   * Fetch Real-Time Global Quote for a Stock / ETF
   */
  async getGlobalQuote(symbol: string, forceFresh = false): Promise<{ quote: GlobalQuote; source: string; isFromCache: boolean }> {
    const sym = symbol.toUpperCase().trim();
    const cacheKey = `av_quote_${sym}`;

    const fetcher = async (): Promise<GlobalQuote> => {
      const apiKey = getAlphaVantageApiKey();
      try {
        const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        // Check for rate limit or note
        if (data['Note'] || data['Information'] || data['Error Message'] || !data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
          return this.getSimulatedQuote(sym);
        }

        const raw = data['Global Quote'];
        const price = parseFloat(raw['05. price']) || 0;
        const change = parseFloat(raw['09. change']) || 0;
        const changePctStr = raw['10. change percent'] || '0%';
        const changePercent = parseFloat(changePctStr.replace('%', '')) || 0;

        return {
          symbol: sym,
          price,
          open: parseFloat(raw['02. open']) || price,
          high: parseFloat(raw['03. high']) || price,
          low: parseFloat(raw['04. low']) || price,
          volume: parseInt(raw['06. volume'], 10) || 0,
          previousClose: parseFloat(raw['08. previous close']) || price,
          change,
          changePercent,
          latestTradingDay: raw['07. latest trading day'] || new Date().toISOString().split('T')[0],
          timestamp: Date.now(),
          isMock: false,
        };
      } catch (err) {
        console.warn(`Alpha Vantage API error for ${sym}, falling back to simulated data:`, err);
        return this.getSimulatedQuote(sym);
      }
    };

    const res = await cacheManager.getOrFetch(cacheKey, fetcher, {
      ttlMs: 3 * 60 * 1000, // 3 minutes TTL for real-time quotes
      staleWhileRevalidate: true,
      forceFresh,
      metadata: { symbol: sym, apiEndpoint: 'GLOBAL_QUOTE' },
    });

    return {
      quote: res.data,
      source: res.source,
      isFromCache: res.isFromCache,
    };
  }

  /**
   * Fetch Real-Time Currency Exchange Rate (e.g. USD to EUR)
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string, forceFresh = false): Promise<{ rate: CurrencyRate; source: string; isFromCache: boolean }> {
    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();

    if (from === to) {
      return {
        rate: {
          fromCurrency: from,
          toCurrency: to,
          exchangeRate: 1.0,
          bidPrice: 1.0,
          askPrice: 1.0,
          lastRefreshed: new Date().toISOString(),
          timeZone: 'UTC',
          timestamp: Date.now(),
        },
        source: 'memory',
        isFromCache: true,
      };
    }

    const cacheKey = `av_fx_${from}_${to}`;

    const fetcher = async (): Promise<CurrencyRate> => {
      const apiKey = getAlphaVantageApiKey();
      try {
        const url = `${this.baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data['Realtime Currency Exchange Rate']) {
          const raw = data['Realtime Currency Exchange Rate'];
          const exchangeRate = parseFloat(raw['5. Exchange Rate']) || 1.0;
          return {
            fromCurrency: from,
            toCurrency: to,
            exchangeRate,
            bidPrice: parseFloat(raw['8. Bid Price']) || exchangeRate,
            askPrice: parseFloat(raw['9. Ask Price']) || exchangeRate,
            lastRefreshed: raw['6. Last Refreshed'] || new Date().toISOString(),
            timeZone: raw['7. Time Zone'] || 'UTC',
            timestamp: Date.now(),
          };
        }
      } catch (e) {
        console.warn(`FX rate fetch failed for ${from}/${to}:`, e);
      }

      // Fallback calculation using BASE_FX_RATES
      const fromRateUSD = BASE_FX_RATES[from] ?? 1.0;
      const toRateUSD = BASE_FX_RATES[to] ?? 1.0;
      const simulatedRate = (1 / fromRateUSD) * toRateUSD;

      return {
        fromCurrency: from,
        toCurrency: to,
        exchangeRate: parseFloat(simulatedRate.toFixed(4)),
        bidPrice: parseFloat((simulatedRate * 0.999).toFixed(4)),
        askPrice: parseFloat((simulatedRate * 1.001).toFixed(4)),
        lastRefreshed: new Date().toISOString(),
        timeZone: 'UTC',
        timestamp: Date.now(),
      };
    };

    const res = await cacheManager.getOrFetch(cacheKey, fetcher, {
      ttlMs: 30 * 60 * 1000, // 30 minutes TTL for FX rates
      staleWhileRevalidate: true,
      forceFresh,
      metadata: { from, to, apiEndpoint: 'CURRENCY_EXCHANGE_RATE' },
    });

    return {
      rate: res.data,
      source: res.source,
      isFromCache: res.isFromCache,
    };
  }

  /**
   * Fetch Historical Time Series for Charting (30-90 Days)
   */
  async getDailyTimeSeries(symbol: string, forceFresh = false): Promise<{ data: HistoricalDataPoint[]; source: string; isFromCache: boolean }> {
    const sym = symbol.toUpperCase().trim();
    const cacheKey = `av_daily_${sym}`;

    const fetcher = async (): Promise<HistoricalDataPoint[]> => {
      const apiKey = getAlphaVantageApiKey();
      try {
        const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${sym}&outputsize=compact&apikey=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        const timeSeries = data['Time Series (Daily)'];
        if (timeSeries && Object.keys(timeSeries).length > 0) {
          const points: HistoricalDataPoint[] = [];
          for (const [dateStr, values] of Object.entries(timeSeries)) {
            const val = values as Record<string, string>;
            points.push({
              date: dateStr,
              open: parseFloat(val['1. open']),
              high: parseFloat(val['2. high']),
              low: parseFloat(val['3. low']),
              close: parseFloat(val['4. close']),
              volume: parseInt(val['5. volume'], 10),
            });
          }
          // Sort ascending by date
          return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      } catch (err) {
        console.warn(`Time series fetch failed for ${sym}:`, err);
      }

      // Generate realistic mock history
      const base = BASE_MARKET_DATA[sym] || { name: sym, price: 150.0, type: 'stock' };
      return generateMockHistory(sym, base.price, 45);
    };

    const res = await cacheManager.getOrFetch(cacheKey, fetcher, {
      ttlMs: 6 * 60 * 60 * 1000, // 6 hours TTL for daily charts
      staleWhileRevalidate: true,
      forceFresh,
      metadata: { symbol: sym, apiEndpoint: 'TIME_SERIES_DAILY' },
    });

    return {
      data: res.data,
      source: res.source,
      isFromCache: res.isFromCache,
    };
  }

  /**
   * Fetch a batch of watch-list market tickers for the ticker ribbon & investment hub
   */
  async getMarketTickers(forceFresh = false): Promise<MarketTickerItem[]> {
    const symbols = ['SPY', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'BTC', 'ETH'];
    const results: MarketTickerItem[] = [];

    for (const sym of symbols) {
      try {
        const { quote, source } = await this.getGlobalQuote(sym, forceFresh);
        const base = BASE_MARKET_DATA[sym] || { name: sym, type: 'stock' };

        results.push({
          symbol: sym,
          name: base.name,
          type: base.type as 'stock' | 'crypto' | 'forex' | 'index',
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          high24h: quote.high,
          low24h: quote.low,
          lastUpdated: quote.timestamp,
          source: quote.isMock ? 'simulated' : source === 'network' ? 'alpha_vantage' : 'cache',
        });
      } catch (e) {
        console.warn(`Error gathering ticker item for ${sym}`, e);
      }
    }

    return results;
  }

  /**
   * High-fidelity simulated dynamic quote
   */
  private getSimulatedQuote(symbol: string): GlobalQuote {
    const sym = symbol.toUpperCase();
    const base = BASE_MARKET_DATA[sym] || {
      name: sym,
      price: 150.0 + (sym.charCodeAt(0) % 50),
      type: 'stock',
      volatility: 0.02,
    };

    // Add subtle micro-fluctuation based on timestamp
    const jitter = (Math.sin(Date.now() / 15000 + sym.charCodeAt(0)) * base.volatility * base.price) / 2;
    const price = parseFloat(Math.max(1, base.price + jitter).toFixed(2));
    const previousClose = parseFloat(base.price.toFixed(2));
    const change = parseFloat((price - previousClose).toFixed(2));
    const changePercent = parseFloat(((change / previousClose) * 100).toFixed(2));
    const high = parseFloat(Math.max(price, previousClose * 1.015).toFixed(2));
    const low = parseFloat(Math.min(price, previousClose * 0.985).toFixed(2));

    return {
      symbol: sym,
      price,
      open: previousClose,
      high,
      low,
      volume: Math.floor(Math.random() * 8000000) + 1200000,
      previousClose,
      change,
      changePercent,
      latestTradingDay: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      isMock: true,
    };
  }
}

export const alphaVantageService = new AlphaVantageService();
