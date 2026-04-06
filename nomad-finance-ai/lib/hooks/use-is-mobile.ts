"use client";

import { useState, useEffect } from "react";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 639px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    // #region agent log
    fetch("http://127.0.0.1:7289/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"09b5b5"},body:JSON.stringify({sessionId:"09b5b5",runId:"pre-fix",hypothesisId:"H6",location:"lib/hooks/use-is-mobile.ts:useEffect",message:"useIsMobile subscribed",data:{initial:mq.matches},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
