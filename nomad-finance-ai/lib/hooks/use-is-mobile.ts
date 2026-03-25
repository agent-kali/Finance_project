"use client";

import { useState, useEffect } from "react";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    const initialValue =
      typeof window === "undefined"
        ? false
        : window.matchMedia("(max-width: 639px)").matches;
    // #region agent log
    fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "58c2c5" },
      body: JSON.stringify({
        sessionId: "58c2c5",
        runId: "post-fix",
        hypothesisId: "H1",
        location: "use-is-mobile.ts:initializer",
        message: "mobile state initialized lazily",
        data: { initialValue, hasWindow: typeof window !== "undefined" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return initialValue;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    // #region agent log
    fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "58c2c5" },
      body: JSON.stringify({
        sessionId: "58c2c5",
        runId: "post-fix",
        hypothesisId: "H1",
        location: "use-is-mobile.ts:useEffect",
        message: "effect subscribed to mobile media query",
        data: { mediaMatches: mq.matches },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
