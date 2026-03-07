import { describe, it, expect } from "vitest";
import {
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  isAuthRoute,
  isProtectedRoute,
  getRootRedirectTarget,
} from "./auth-routes";

describe("auth-routes", () => {
  describe("AUTH_ROUTES", () => {
    it("includes /login and /register", () => {
      expect(AUTH_ROUTES).toContain("/login");
      expect(AUTH_ROUTES).toContain("/register");
    });

    it("has exactly two entries", () => {
      expect(AUTH_ROUTES).toHaveLength(2);
    });
  });

  describe("PROTECTED_ROUTES", () => {
    it("includes dashboard, transactions, wallets, ai-advisor, settings", () => {
      expect(PROTECTED_ROUTES).toContain("/dashboard");
      expect(PROTECTED_ROUTES).toContain("/transactions");
      expect(PROTECTED_ROUTES).toContain("/wallets");
      expect(PROTECTED_ROUTES).toContain("/ai-advisor");
      expect(PROTECTED_ROUTES).toContain("/settings");
    });
  });

  describe("isAuthRoute", () => {
    it.each(["/login", "/register", "/login/foo", "/register/confirm"])(
      "returns true for %s",
      (pathname) => {
        expect(isAuthRoute(pathname)).toBe(true);
      }
    );

    it.each(["/", "/dashboard", "/dashboard/settings", "/preregister"])(
      "returns false for %s",
      (pathname) => {
      expect(isAuthRoute(pathname)).toBe(false);
    });
  });

  describe("isProtectedRoute", () => {
    it.each([
      "/dashboard",
      "/dashboard/foo",
      "/transactions",
      "/wallets",
      "/ai-advisor",
      "/settings",
    ])("returns true for %s", (pathname) => {
      expect(isProtectedRoute(pathname)).toBe(true);
    });

    it.each(["/", "/login", "/register", "/api/ai"])(
      "returns false for %s",
      (pathname) => {
        expect(isProtectedRoute(pathname)).toBe(false);
      }
    );
  });

  describe("getRootRedirectTarget", () => {
    it("returns /dashboard when isDemo is true", () => {
      expect(getRootRedirectTarget(true)).toBe("/dashboard");
    });

    it("returns /login when isDemo is false", () => {
      expect(getRootRedirectTarget(false)).toBe("/login");
    });
  });
});
