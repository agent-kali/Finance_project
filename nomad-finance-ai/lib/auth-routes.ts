/**
 * Canonical route definitions for auth, public, and protected routes.
 * Used by proxy (inlined in proxy.ts) and root page to keep redirect logic in sync.
 */

export const PUBLIC_ROUTES = ["/", "/login", "/register", "/signup"] as const;

export const AUTH_ROUTES = ["/login", "/register", "/signup"] as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/wallets",
  "/ai-advisor",
  "/settings",
] as const;

export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_ROUTES.some(
    (route) => route !== "/" && pathname.startsWith(route)
  );
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}
