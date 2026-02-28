"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { enableDemoMode } from "@/lib/demo-context";
import { Sparkles, Loader2 } from "lucide-react";

export function DemoLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  function handleDemoLogin() {
    setIsLoading(true);
    enableDemoMode();
    window.location.href = "/dashboard";
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleDemoLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Try Demo Account
    </Button>
  );
}
