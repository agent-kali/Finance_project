"use client";

import { useEffect } from "react";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AiAdvisorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isRateLimit =
    error.message.toLowerCase().includes("rate") ||
    error.message.includes("429");

  const title = isRateLimit
    ? "AI is busy right now"
    : "AI advisor unavailable";
  const message = isRateLimit
    ? "Too many requests. Please wait a moment and try again."
    : "The AI advisor is temporarily unavailable. Please try again.";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4">
      <div className="rounded-full bg-destructive/10 p-3">
        <BrainCircuit className="h-8 w-8 text-destructive" />
      </div>
      <div className="max-w-sm space-y-2 text-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground/80">
          Your financial data is safe — only the advisor is offline.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground">Stack trace</summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-muted p-3 text-xs">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
      <Button onClick={reset} variant="default" size="sm">
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
