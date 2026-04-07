"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { handleDemoLogin } from "@/components/auth/demo-login-button";

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const hasTriggeredDemo = useRef(false);

  useEffect(() => {
    if (searchParams.get("demo") !== "true" || hasTriggeredDemo.current) {
      return;
    }

    hasTriggeredDemo.current = true;
    handleDemoLogin();
  }, [searchParams]);

  return <LoginForm />;
}
