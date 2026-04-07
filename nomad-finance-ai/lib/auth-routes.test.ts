import { describe, it, expect } from "vitest";
import {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  isAuthRoute,
  isPublicRoute,
  isProtectedRoute,
} from "./auth-routes";

describe("auth-routes", () => {
  describe("PUBLIC_ROUTES", () => {
    it("includes /, /login, /register, and /signup", () => {
      expect(PUBLIC_ROUTES).toContain("/");
      expect(PUBLIC_ROUTES).toContain("/login");
      expect(PUBLIC_ROUTES).toContain("/register");
      expect(PUBLIC_ROUTES).toContain("/signup");
    });
  });

  describe("AUTH_ROUTES", () => {
    it("includes /login, /register, and /signup", () => {
      expect(AUTH_ROUTES).toContain("/login");
      expect(AUTH_ROUTES).toContain("/register");
      expect(AUTH_ROUTES).toContain("/signup");
    });

    it("has exactly three entries", () => {
      expect(AUTH_ROUTES).toHaveLength(3);
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

  describe("isPublicRoute", () => {
    it.each(["/", "/login", "/login/foo", "/register", "/register/confirm", "/signup"])(
      "returns true for %s",
      (pathname) => {
        expect(isPublicRoute(pathname)).toBe(true);
      }
    );

    it.each(["/dashboard", "/dashboard/settings", "/transactions", "/api/ai"])(
      "returns false for %s",
      (pathname) => {
        expect(isPublicRoute(pathname)).toBe(false);
      }
    );
  });

  describe("isAuthRoute", () => {
    it.each(["/login", "/register", "/signup", "/login/foo", "/register/confirm"])(
      "returns true for %s",
      (pathname) => {
        expect(isAuthRoute(pathname)).toBe(true);
      }
    );

    it.each(["/", "/dashboard", "/dashboard/settings", "/preregister"])(
      "returns false for %s",
      (pathname) => {
        expect(isAuthRoute(pathname)).toBe(false);
      }
    );
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

    it.each(["/", "/login", "/register", "/signup", "/api/ai"])(
      "returns false for %s",
      (pathname) => {
        expect(isProtectedRoute(pathname)).toBe(false);
      }
    );
  });
});
