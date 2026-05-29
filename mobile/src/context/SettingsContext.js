import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCY_KEY = '@clinic_currency';
const RATES_KEY = '@clinic_rates';

const DEFAULT_CURRENCIES = [
  { symbol: '₹', label: 'Indian Rupee', code: 'INR', rate: 1 },
  { symbol: '$', label: 'US Dollar', code: 'USD', rate: 0.012 },
  { symbol: '€', label: 'Euro', code: 'EUR', rate: 0.011 },
  { symbol: '£', label: 'British Pound', code: 'GBP', rate: 0.0095 },
  { symbol: '¥', label: 'Japanese Yen', code: 'JPY', rate: 1.85 },
  { symbol: '₽', label: 'Russian Ruble', code: 'RUB', rate: 1.05 },
  { symbol: '₩', label: 'S. Korean Won', code: 'KRW', rate: 16.20 },
  { symbol: 'A$', label: 'Australian Dollar', code: 'AUD', rate: 0.018 },
];

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [currencies, setCurrencies] = useState(DEFAULT_CURRENCIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CURRENCY_KEY);
        if (stored) setCurrencySymbol(stored);
        const storedRates = await AsyncStorage.getItem(RATES_KEY);
        if (storedRates) setCurrencies(JSON.parse(storedRates));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const setCurrency = useCallback(async (symbol) => {
    setCurrencySymbol(symbol);
    try { await AsyncStorage.setItem(CURRENCY_KEY, symbol); } catch (e) {}
  }, []);

  const updateRate = useCallback(async (code, newRate) => {
    const updated = currencies.map(c =>
      c.code === code ? { ...c, rate: parseFloat(newRate) || c.rate } : c
    );
    setCurrencies(updated);
    try { await AsyncStorage.setItem(RATES_KEY, JSON.stringify(updated)); } catch (e) {}
  }, [currencies]);

  const currentCurrency = currencies.find(c => c.symbol === currencySymbol) || currencies[0];

  const convertAmount = useCallback((amountInINR) => {
    const num = Number(amountInINR) || 0;
    return num * (currentCurrency.rate || 1);
  }, [currentCurrency]);

  const formatCurrency = useCallback((amountInINR, showSymbol = true) => {
    const converted = convertAmount(amountInINR);
    const formatted = converted.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return showSymbol ? `${currentCurrency.symbol}${formatted}` : formatted;
  }, [convertAmount, currentCurrency]);

  const formatCurrencyCompact = useCallback((amountInINR) => {
    const converted = convertAmount(amountInINR);
    const sym = currentCurrency.symbol;
    if (converted >= 10000000) return sym + (converted / 10000000).toFixed(2) + 'Cr';
    if (converted >= 100000) return sym + (converted / 100000).toFixed(2) + 'L';
    if (converted >= 1000) return sym + (converted / 1000).toFixed(1) + 'K';
    return sym + converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currentCurrency]);

  return (
    <SettingsContext.Provider value={{
      currencySymbol,
      currencies,
      currentCurrency,
      setCurrency,
      updateRate,
      convertAmount,
      formatCurrency,
      formatCurrencyCompact,
      loaded,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
