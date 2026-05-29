import { useSettings } from '../context/SettingsContext';

export function useCurrencyFormat() {
  const { formatCurrency, formatCurrencyCompact, convertAmount, currencySymbol } = useSettings();
  return { formatCurrency, formatCurrencyCompact, convertAmount, currencySymbol };
}
