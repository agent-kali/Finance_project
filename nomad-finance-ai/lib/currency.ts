import {
  EXCHANGE_RATES,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from "@/lib/constants";

export function convertToBase(
  amount: number,
  from: SupportedCurrency
): number {
  return amount / EXCHANGE_RATES[from];
}

export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency
): number {
  const baseAmount = convertToBase(amount, from);
  return baseAmount * EXCHANGE_RATES[to];
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
