export type CurrencyEntry = {
  code: string;
  symbol: string;
  name: string;
  shortName: string;
  flag: string;
};

/** Currencies popular among digital nomads (shown first in selector) */
export const POPULAR_FOR_NOMADS = [
  "EUR",
  "USD",
  "GBP",
  "THB",
  "VND",
  "IDR",
  "MYR",
  "SGD",
  "JPY",
  "TRY",
  "AED",
] as const;

export const CURRENCIES: CurrencyEntry[] = [
  { code: "USD", symbol: "$", name: "United States Dollar", shortName: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", shortName: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound Sterling", shortName: "Pound", flag: "🇬🇧" },
  { code: "THB", symbol: "฿", name: "Thai Baht", shortName: "Baht", flag: "🇹🇭" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", shortName: "Dong", flag: "🇻🇳" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", shortName: "Rupiah", flag: "🇮🇩" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", shortName: "Ringgit", flag: "🇲🇾" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", shortName: "Singapore Dollar", flag: "🇸🇬" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", shortName: "Yen", flag: "🇯🇵" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", shortName: "Lira", flag: "🇹🇷" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", shortName: "Dirham", flag: "🇦🇪" },
  { code: "MXN", symbol: "$", name: "Mexican Peso", shortName: "Peso", flag: "🇲🇽" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", shortName: "Real", flag: "🇧🇷" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc", shortName: "Franc", flag: "🇨🇭" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", shortName: "Aussie Dollar", flag: "🇦🇺" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", shortName: "Canadian Dollar", flag: "🇨🇦" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty", shortName: "Złoty", flag: "🇵🇱" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", shortName: "HK Dollar", flag: "🇭🇰" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", shortName: "Won", flag: "🇰🇷" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", shortName: "Rupee", flag: "🇮🇳" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", shortName: "Peso", flag: "🇵🇭" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", shortName: "Kiwi Dollar", flag: "🇳🇿" },
  { code: "ZAR", symbol: "R", name: "South African Rand", shortName: "Rand", flag: "🇿🇦" },
];

export const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrency(code: string): CurrencyEntry | undefined {
  return CURRENCY_MAP.get(code);
}

export function getPopularCurrencies(): CurrencyEntry[] {
  return POPULAR_FOR_NOMADS.map((code) => CURRENCY_MAP.get(code)).filter(
    (c): c is CurrencyEntry => !!c
  );
}

export function getOtherCurrencies(): CurrencyEntry[] {
  const popularSet = new Set<string>(POPULAR_FOR_NOMADS);
  return CURRENCIES.filter((c) => !popularSet.has(c.code));
}
