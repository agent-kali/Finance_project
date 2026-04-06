"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7289/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"09b5b5"},body:JSON.stringify({sessionId:"09b5b5",runId:"pre-fix",hypothesisId:"H2",location:"app/providers.tsx:Providers:mount",message:"Providers mounted",data:{href:window.location.href},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const globalWithFlag = window as Window & {
      __debugFetchWrapped09b5b5?: boolean;
      __debugOriginalFetch09b5b5?: typeof window.fetch;
    };
    if (globalWithFlag.__debugFetchWrapped09b5b5) return;

    globalWithFlag.__debugFetchWrapped09b5b5 = true;
    globalWithFlag.__debugOriginalFetch09b5b5 = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (!url.includes("127.0.0.1:7289/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b") && (url.includes("127.0.0.1:") || url.includes("/ingest/"))) {
        // #region agent log
        fetch("http://127.0.0.1:7289/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"09b5b5"},body:JSON.stringify({sessionId:"09b5b5",runId:"pre-fix",hypothesisId:"H1",location:"app/providers.tsx:window.fetch",message:"Observed outbound fetch candidate",data:{url,method:init?.method??"GET",stack:new Error().stack?.split("\n").slice(0,8).join(" | ")},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
      return globalWithFlag.__debugOriginalFetch09b5b5!(input, init);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
