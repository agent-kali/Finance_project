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
  if (full.length <= 11) return full;
  return formatCompact(amount, currency);
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