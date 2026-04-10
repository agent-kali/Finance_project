import {
  EXCHANGE_RATES,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from "@/lib/constants";
import { convert as convertLive } from "@/lib/currency-conversion";

export function convertToBase(
  amount: number,
  from: SupportedCurrency
): number {
  return amount / EXCHANGE_RATES[from];
}

/**
 * Converts amount from one currency to another. Uses live Frankfurter rates when
 * available (populated by CurrencyConversionProvider); falls back to static rates.
 */
export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency
): number {
  return convertLive(amount, from, to);
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (amount === 0) {
    return `${symbol}0`;
  }
  if (currency === "VND") {
    return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
  }
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format for dashboard cards: full for normal amounts, compact when too long. */
export function formatForCard(
  amount: number,
  currency: SupportedCurrency
): string {
  const full = formatCurrency(amount, currency);
  const result = full.length <= 11 ? full : formatCompact(amount, currency);
  return result;
}

export function formatCompact(
  amount: number,
  currency: SupportedCurrency
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const abs = Math.abs(amount);

  if (currency === "VND") {
    if (abs >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
    return `${symbol}${Math.round(amount)}`;
  }

  if (abs >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toFixed(2)}`;
}
export type Currency = {
  code: string;
  symbol: string;
  name: string;
  flag: string;
};

/** Format number for amount input display (European: period thousands, comma decimal). */
export function formatAmountDisplay(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  if (value === 0) return "";
  const [intPart, decPart] = value.toFixed(2).split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart && parseFloat(decPart) > 0
    ? `${formattedInt},${decPart.replace(/0+$/, "") || "0"}`
    : formattedInt;
}

/** Parse amount input string to number (handles European and US formats). Caps at 2 decimals for currency. */
export function parseAmountInput(input: string): number {
  const trimmed = input.replace(/\s/g, "");
  if (!trimmed) return 0;
  let num: number;
  // European: 1.234,56 → 1234.56 (comma = decimal)
  if (trimmed.indexOf(",") >= 0) {
    const withDecimal = trimmed.replace(/\./g, "").replace(",", ".");
    num = parseFloat(withDecimal);
  } else {
    // US/international: 1234.56 or 1234 (period = decimal)
    num = parseFloat(trimmed);
  }
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}