"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEMO_COOKIE } from "./demo";

type DemoContextValue = {
  isDemo: boolean;
};

const DemoContext = createContext<DemoContextValue>({ isDemo: false });

export function useDemoMode() {
  return useContext(DemoContext);
}

export function DemoProvider({
  children,
  initialValue = false,
}: {
  children: ReactNode;
  initialValue?: boolean;
}) {
  return (
    <DemoContext.Provider value={{ isDemo: initialValue }}>
      {children}
    </DemoContext.Provider>
  );
}

export function enableDemoMode() {
  document.cookie = `${DEMO_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function disableDemoMode() {
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0`;
}
