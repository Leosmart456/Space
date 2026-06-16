// Currency symbols and data
export const currencySymbols: Record<string, string> = {
  USD: "$",
  AED: "د.إ",
  ALL: "L",
  AMD: "֏",
  ANG: "ƒ",
  ARS: "AR$",
  AUD: "$",
  AZN: "₼",
  BAM: "KM",
  BBD: "Bds$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  KRW: "₩",
  RUB: "₽",
  BRL: "R$",
  CAD: "C$",
  CHF: "Fr",
  MXN: "Mex$",
  SGD: "S$",
  NZD: "NZ$",
  ZAR: "R",
  THB: "฿",
  TRY: "₺",
  SAR: "﷼",
};

// Approximate exchange rates (USD as base)
// In production, these should be fetched from a real-time API
export const exchangeRates: Record<string, number> = {
  USD: 1,
  AED: 3.67,    // UAE Dirham
  ALL: 92.5,    // Albanian Lek
  AMD: 387,     // Armenian Dram
  ANG: 1.79,    // Netherlands Antillean Guilder
  ARS: 350,     // Argentine Peso
  AUD: 1.53,    // Australian Dollar
  AZN: 1.70,    // Azerbaijani Manat
  BAM: 1.80,    // Bosnia-Herzegovina Convertible Mark
  BBD: 2.00,    // Barbadian Dollar
  EUR: 0.92,    // Euro
  GBP: 0.79,    // British Pound
  JPY: 149,     // Japanese Yen
  CNY: 7.24,    // Chinese Yuan
  INR: 83.12,   // Indian Rupee
  KRW: 1320,    // Korean Won
  RUB: 92,      // Russian Ruble
  BRL: 4.97,    // Brazilian Real
  CAD: 1.36,    // Canadian Dollar
  CHF: 0.88,    // Swiss Franc
  MXN: 17.0,    // Mexican Peso
  SGD: 1.34,    // Singapore Dollar
  NZD: 1.66,    // New Zealand Dollar
  ZAR: 18.5,    // South African Rand
  THB: 35.5,    // Thai Baht
  TRY: 32.5,    // Turkish Lira
  SAR: 3.75,    // Saudi Riyal
};

export function convertCurrency(usdAmount: number, targetCurrency: string): number {
  const rate = exchangeRates[targetCurrency] || 1;
  return usdAmount * rate;
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}

export function formatCurrency(amount: number, currency: string, visible: boolean = true): string {
  if (!visible) return '••••••';
  
  const symbol = getCurrencySymbol(currency);
  const convertedAmount = convertCurrency(amount, currency);
  
  // Show "0" for zero values (without decimals)
  if (convertedAmount === 0) {
    return `${symbol}0`;
  }
  
  // Format with appropriate decimal places
  let formatted;
  if (currency === 'JPY' || currency === 'KRW') {
    // These currencies don't use decimal places
    formatted = convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  } else {
    formatted = convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  return `${symbol}${formatted}`;
}
