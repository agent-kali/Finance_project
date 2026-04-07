"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { enableDemoMode } from "@/lib/demo-context";
import { Sparkles, Loader2 } from "lucide-react";

export function handleDemoLogin() {
  enableDemoMode();
  window.location.href = "/dashboard";
}

export function DemoLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  function onDemoLogin() {
    setIsLoading(true);
    handleDemoLogin();
  }

  return (
    <Button
      type="button"
      variant="outline"
      data-demo-login-button="true"
      className="w-full"
      onClick={onDemoLogin}
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
