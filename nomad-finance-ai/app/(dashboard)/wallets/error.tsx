"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WalletsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="max-w-sm space-y-1 text-center">
        <h2 className="text-lg font-semibold text-foreground">Couldn&apos;t load wallets</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your wallets. Please try again.
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
