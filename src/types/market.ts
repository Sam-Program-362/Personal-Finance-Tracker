export interface GlobalQuote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  change: number;
  changePercent: number;
  latestTradingDay: string;
  timestamp: number;
  isMock?: boolean;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CurrencyRate {
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  bidPrice: number;
  askPrice: number;
  lastRefreshed: string;
  timeZone: string;
  timestamp: number;
}

export interface MarketTickerItem {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'index';
  price: number;
  change: number;
  changePercent: number;
  sparkline?: number[];
  high24h?: number;
  low24h?: number;
  volume?: number;
  lastUpdated: number;
  source: 'alpha_vantage' | 'cache' | 'simulated';
}

export interface AlphaVantageOverview {
  Symbol: string;
  AssetType: string;
  Name: string;
  Description: string;
  Exchange: string;
  Currency: string;
  Sector: string;
  Industry: string;
  MarketCapitalization: string;
  PERatio: string;
  PEGRatio: string;
  DividendYield: string;
  EPS: string;
  FiftyTwoWeekHigh: string;
  FiftyTwoWeekLow: string;
}
