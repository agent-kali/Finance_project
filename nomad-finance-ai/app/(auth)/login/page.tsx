import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageClient />
    </Suspense>
  );
}
