"use client";

import * as React from "react";
import { useProfile } from "@/lib/hooks/use-profile";
import { useDemoMode } from "@/lib/demo-context";
import { DEMO_PRIMARY_CURRENCY } from "@/lib/demo";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/constants";

const STORAGE_KEY = "nomad-finance-display-currency";

function readStoredCurrency(): SupportedCurrency | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s && SUPPORTED_CURRENCIES.includes(s as SupportedCurrency)) {
      return s as SupportedCurrency;
    }
  } catch {
    /* ignore */
  }
  return null;
}

type CurrencyContextValue = {
  displayCurrency: SupportedCurrency;
  setDisplayCurrency: (currency: SupportedCurrency) => void;
};

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { isDemo } = useDemoMode();
  const { data: profile } = useProfile();

  const [displayCurrency, setDisplayCurrencyState] =
    React.useState<SupportedCurrency>("EUR");

  React.useEffect(() => {
    if (isDemo) {
      setDisplayCurrencyState(DEMO_PRIMARY_CURRENCY);
      return;
    }
    const stored = readStoredCurrency();
    if (stored) {
      setDisplayCurrencyState(stored);
      return;
    }
    const profileCurrency = profile?.primary_currency as
      | SupportedCurrency
      | undefined;
    if (profileCurrency) {
      setDisplayCurrencyState(profileCurrency);
      try {
        localStorage.setItem(STORAGE_KEY, profileCurrency);
      } catch {
        /* ignore */
      }
    }
  }, [isDemo, profile?.primary_currency]);

  const setDisplayCurrency = React.useCallback((currency: SupportedCurrency) => {
    setDisplayCurrencyState(currency);
    if (!isDemo) {
      try {
        localStorage.setItem(STORAGE_KEY, currency);
      } catch {
        /* ignore */
      }
    }
  }, [isDemo]);

  const value = React.useMemo(
    () => ({ displayCurrency, setDisplayCurrency }),
    [displayCurrency, setDisplayCurrency]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext);
  return ctx;
}
