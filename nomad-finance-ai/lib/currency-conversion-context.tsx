"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getExchangeRates, convert as convertAmount } from "./currency-conversion";

type CurrencyConversionContextValue = {
  convert: (amount: number, from: string, to: string) => number;
  ratesDate: string | null;
  isLoading: boolean;
  error: Error | null;
};

const CurrencyConversionContext =
  React.createContext<CurrencyConversionContextValue | null>(null);

export function CurrencyConversionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exchange-rates", "EUR"] as const,
    queryFn: () => getExchangeRates("EUR"),
    staleTime: 24 * 60 * 60 * 1000, // 24h
    gcTime: 24 * 60 * 60 * 1000,
  });

  const convert = React.useCallback(
    (amount: number, from: string, to: string) => convertAmount(amount, from, to),
    []
  );

  const value = React.useMemo(
    () => ({
      convert,
      ratesDate: data?.date ?? null,
      isLoading,
      error: error as Error | null,
    }),
    [convert, data?.date, isLoading, error]
  );

  return (
    <CurrencyConversionContext.Provider value={value}>
      {children}
    </CurrencyConversionContext.Provider>
  );
}

export function useCurrencyConversion() {
  const ctx = React.useContext(CurrencyConversionContext);
  return ctx;
}
