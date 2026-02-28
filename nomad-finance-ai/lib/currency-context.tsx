"use client";

import * as React from "react";
import { useProfile } from "@/lib/hooks/use-profile";
import { useDemoMode } from "@/lib/demo-context";
import { DEMO_PRIMARY_CURRENCY } from "@/lib/demo";
import type { SupportedCurrency } from "@/lib/constants";

type CurrencyContextValue = {
  displayCurrency: SupportedCurrency;
  setDisplayCurrency: (currency: SupportedCurrency) => void;
};

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { isDemo } = useDemoMode();
  const { data: profile } = useProfile();

  const profileCurrency =
    (profile?.primary_currency as SupportedCurrency) ?? "EUR";
  const sourceCurrency: SupportedCurrency = isDemo
    ? DEMO_PRIMARY_CURRENCY
    : profileCurrency;

  const [displayCurrency, setDisplayCurrency] =
    React.useState<SupportedCurrency>(sourceCurrency);

  React.useEffect(() => {
    setDisplayCurrency(sourceCurrency);
  }, [sourceCurrency]);

  const value = React.useMemo(
    () => ({ displayCurrency, setDisplayCurrency }),
    [displayCurrency]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext);
  return ctx;
}
