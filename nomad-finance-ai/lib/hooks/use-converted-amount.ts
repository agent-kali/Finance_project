"use client";

import * as React from "react";
import { useCurrency } from "@/lib/currency-context";
import { useCurrencyConversion } from "@/lib/currency-conversion-context";
import { convert } from "@/lib/currency-conversion";
import { formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";

export interface UseConvertedAmountOptions {
  toCurrency?: string;
}

export interface UseConvertedAmountResult {
  converted: number;
  formatted: string;
  originalFormatted: string;
  isLoading: boolean;
  ratesDate: string | null;
  error: Error | null;
}

/**
 * Converts an amount from one currency to display currency and formats both.
 * Uses live Frankfurter rates when available; falls back to static rates.
 */
export function useConvertedAmount(
  amount: number,
  fromCurrency: string,
  options?: UseConvertedAmountOptions
): UseConvertedAmountResult {
  const currencyContext = useCurrency();
  const conversionContext = useCurrencyConversion();
  const displayCurrency =
    options?.toCurrency ??
    currencyContext?.displayCurrency ??
    ("EUR" as SupportedCurrency);

  const converted = React.useMemo(() => {
    return convert(amount, fromCurrency, displayCurrency);
  }, [amount, fromCurrency, displayCurrency]);

  const formatted = React.useMemo(
    () => `≈ ${formatCurrency(converted, displayCurrency as SupportedCurrency)}`,
    [converted, displayCurrency]
  );

  const originalFormatted = React.useMemo(
    () => formatCurrency(amount, fromCurrency as SupportedCurrency),
    [amount, fromCurrency]
  );

  return {
    converted,
    formatted,
    originalFormatted,
    isLoading: conversionContext?.isLoading ?? false,
    ratesDate: conversionContext?.ratesDate ?? null,
    error: conversionContext?.error ?? null,
  };
}
