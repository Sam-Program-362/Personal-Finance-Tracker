import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { alphaVantageService } from '../services/alphaVantageApi';
import { formatCurrency as formatCurr } from '../utils/formatters';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', flag: '🇲🇽' },
];

export function useCurrency() {
  const [baseCurrency, setBaseCurrencyState] = useState<string>(() => storageService.getBaseCurrency());
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1.0 });
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const fetchRates = useCallback(async (currencyCode: string) => {
    setIsFetchingRates(true);
    try {
      // If base is USD, get rates for common currencies
      if (currencyCode === 'USD') {
        const standardRates: Record<string, number> = { USD: 1.0 };
        for (const c of ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CHF']) {
          const res = await alphaVantageService.getExchangeRate('USD', c);
          standardRates[c] = res.rate.exchangeRate;
        }
        setRates(standardRates);
      } else {
        // Fetch rate between USD and the base currency
        const res = await alphaVantageService.getExchangeRate('USD', currencyCode);
        const rateAgainstUSD = res.rate.exchangeRate;
        setRates((prev) => ({
          ...prev,
          USD: 1 / (rateAgainstUSD || 1),
          [currencyCode]: 1.0,
        }));
      }
    } catch (e) {
      console.warn('Failed to load currency rates:', e);
    } finally {
      setIsFetchingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchRates(baseCurrency);
  }, [baseCurrency, fetchRates]);

  const changeBaseCurrency = useCallback((code: string) => {
    storageService.setBaseCurrency(code);
    setBaseCurrencyState(code);
  }, []);

  const format = useCallback(
    (amount: number, decimals = 2) => {
      return formatCurr(amount, baseCurrency, decimals);
    },
    [baseCurrency]
  );

  return {
    baseCurrency,
    changeBaseCurrency,
    rates,
    isFetchingRates,
    refreshRates: () => fetchRates(baseCurrency),
    format,
  };
}
