/**
 * Canonical route definitions for auth and protected routes.
 * Used by middleware and root page to keep redirect logic in sync.
 */

export const AUTH_ROUTES = ["/login", "/register"] as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/wallets",
  "/ai-advisor",
  "/settings",
] as const;

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export function getRootRedirectTarget(isDemo: boolean): "/dashboard" | "/login" {
  return isDemo ? "/dashboard" : "/login";
}
