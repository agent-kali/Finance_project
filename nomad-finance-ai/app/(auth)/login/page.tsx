import type { Metadata } from "next";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
