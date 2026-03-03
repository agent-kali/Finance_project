"use client";

import * as React from "react";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useDemoMode } from "@/lib/demo-context";

const STORAGE_KEY = "nomad-finance-default-wallet";

function readStoredWalletId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s && s.length > 0 ? s : null;
  } catch {
    /* ignore */
  }
  return null;
}

type DefaultWalletContextValue = {
  defaultWalletId: string | null;
  setDefaultWallet: (id: string | null) => void;
};

const DefaultWalletContext =
  React.createContext<DefaultWalletContextValue | null>(null);

export function DefaultWalletProvider({ children }: { children: React.ReactNode }) {
  const { isDemo } = useDemoMode();
  const { data: wallets } = useWallets();

  const [defaultWalletId, setDefaultWalletState] =
    React.useState<string | null>(null);

  React.useEffect(() => {
    if (isDemo) {
      const firstId = wallets?.[0]?.id ?? null;
      setDefaultWalletState(firstId);
      return;
    }
    const stored = readStoredWalletId();
    if (stored && wallets?.some((w) => w.id === stored)) {
      setDefaultWalletState(stored);
      return;
    }
    if (stored && wallets && !wallets.some((w) => w.id === stored)) {
      setDefaultWalletState(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    if (stored) {
      setDefaultWalletState(stored);
    } else {
      setDefaultWalletState(null);
    }
  }, [isDemo, wallets]);

  const setDefaultWallet = React.useCallback(
    (id: string | null) => {
      setDefaultWalletState(id);
      if (!isDemo) {
        try {
          if (id) {
            localStorage.setItem(STORAGE_KEY, id);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          /* ignore */
        }
      }
    },
    [isDemo]
  );

  const value = React.useMemo(
    () => ({ defaultWalletId, setDefaultWallet }),
    [defaultWalletId, setDefaultWallet]
  );

  return (
    <DefaultWalletContext.Provider value={value}>
      {children}
    </DefaultWalletContext.Provider>
  );
}

export function useDefaultWallet() {
  return React.useContext(DefaultWalletContext);
}

export function useEffectiveDefaultWalletId(): string | undefined {
  const ctx = useDefaultWallet();
  const { data: wallets } = useWallets();

  if (!wallets || wallets.length === 0) return undefined;
  if (ctx?.defaultWalletId && wallets.some((w) => w.id === ctx.defaultWalletId)) {
    return ctx.defaultWalletId;
  }
  return wallets[0]?.id;
}
