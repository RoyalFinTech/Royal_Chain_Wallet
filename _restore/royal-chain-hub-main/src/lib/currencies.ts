// Multi-currency support for the Royal Chain Wallet
export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "GMD"
  | "NGN"
  | "XOF"
  | "JPY"
  | "CNY"
  | "INR"
  | "ZAR"
  | "KES"
  | "GHS"
  | "CAD"
  | "AUD"
  | "BRL"
  | "MXN"
  | "AED"
  | "CHF";

export interface CurrencyMeta {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  // Exchange rate to 1 USD (mock — replaced by a live pricing service in a later integration phase)
  usdRate: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", usdRate: 1 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", usdRate: 0.92 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", usdRate: 0.79 },
  GMD: { code: "GMD", name: "Gambian Dalasi", symbol: "D", flag: "🇬🇲", usdRate: 68.5 },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬", usdRate: 1580 },
  XOF: { code: "XOF", name: "CFA Franc (BCEAO)", symbol: "CFA ", flag: "🇸🇳", usdRate: 605 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", usdRate: 156 },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", usdRate: 7.24 },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", usdRate: 86.4 },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", usdRate: 18.1 },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪", usdRate: 129 },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", flag: "🇬🇭", usdRate: 15.3 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦", usdRate: 1.38 },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", usdRate: 1.52 },
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷", usdRate: 5.6 },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "MX$", flag: "🇲🇽", usdRate: 18.9 },
  AED: { code: "AED", name: "UAE Dirham", symbol: "AED ", flag: "🇦🇪", usdRate: 3.67 },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF ", flag: "🇨🇭", usdRate: 0.88 },
};

export const CURRENCY_LIST: CurrencyMeta[] = Object.values(CURRENCIES);

export function formatCurrency(amount: number, code: CurrencyCode) {
  const meta = CURRENCIES[code];
  const value = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${meta.symbol}${value}`;
}

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode) {
  const usd = amount / CURRENCIES[from].usdRate;
  return usd * CURRENCIES[to].usdRate;
}

// Mock balances per currency (holdings)
export const CURRENCY_BALANCES: Record<CurrencyCode, number> = {
  USD: 4820.5,
  EUR: 1240.0,
  GBP: 650.75,
  GMD: 12480.5,
  NGN: 285000,
  XOF: 128500,
  JPY: 0,
  CNY: 0,
  INR: 0,
  ZAR: 0,
  KES: 0,
  GHS: 0,
  CAD: 0,
  AUD: 0,
  BRL: 0,
  MXN: 0,
  AED: 0,
  CHF: 0,
};
