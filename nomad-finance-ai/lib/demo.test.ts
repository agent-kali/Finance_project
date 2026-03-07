import { describe, it, expect } from "vitest";
import {
  DEMO_COOKIE,
  DEMO_USER_ID,
  DEMO_USER,
  DEMO_PRIMARY_CURRENCY,
  DEMO_WALLETS,
  DEMO_TRANSACTIONS,
} from "./demo";

// ─── Constants ─────────────────────────────────────────────────────────────
describe("demo constants", () => {
  it("DEMO_COOKIE has expected value", () => {
    expect(DEMO_COOKIE).toBe("demo_mode");
  });

  it("DEMO_USER_ID has expected value", () => {
    expect(DEMO_USER_ID).toBe("demo-user-00000000-0000-0000-0000");
  });

  it("DEMO_PRIMARY_CURRENCY is USD", () => {
    expect(DEMO_PRIMARY_CURRENCY).toBe("USD");
  });
});

// ─── DEMO_USER ──────────────────────────────────────────────────────────────
describe("DEMO_USER", () => {
  it("has required fields", () => {
    expect(DEMO_USER).toHaveProperty("id");
    expect(DEMO_USER).toHaveProperty("email");
    expect(DEMO_USER).toHaveProperty("user_metadata");
  });

  it("id matches DEMO_USER_ID", () => {
    expect(DEMO_USER.id).toBe(DEMO_USER_ID);
  });

  it("email is demo@nomadfinance.app", () => {
    expect(DEMO_USER.email).toBe("demo@nomadfinance.app");
  });

  it("user_metadata contains full_name", () => {
    expect(DEMO_USER.user_metadata.full_name).toBe("Demo User");
  });
});

// ─── DEMO_WALLETS ───────────────────────────────────────────────────────────
describe("DEMO_WALLETS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(DEMO_WALLETS)).toBe(true);
    expect(DEMO_WALLETS.length).toBeGreaterThan(0);
  });

  it("every wallet has required fields", () => {
    DEMO_WALLETS.forEach((w) => {
      expect(w).toHaveProperty("id");
      expect(w).toHaveProperty("user_id");
      expect(w).toHaveProperty("currency");
      expect(w).toHaveProperty("balance");
      expect(w).toHaveProperty("created_at");
    });
  });

  it("all wallets belong to DEMO_USER_ID", () => {
    DEMO_WALLETS.forEach((w) => {
      expect(w.user_id).toBe(DEMO_USER_ID);
    });
  });

  it("balances are non-negative numbers", () => {
    DEMO_WALLETS.forEach((w) => {
      expect(typeof w.balance).toBe("number");
      expect(w.balance).toBeGreaterThanOrEqual(0);
    });
  });

  it("wallets have unique ids", () => {
    const ids = DEMO_WALLETS.map((w) => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─── DEMO_TRANSACTIONS ──────────────────────────────────────────────────────
describe("DEMO_TRANSACTIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(DEMO_TRANSACTIONS)).toBe(true);
    expect(DEMO_TRANSACTIONS.length).toBeGreaterThan(0);
  });

  it("every transaction has required fields", () => {
    DEMO_TRANSACTIONS.forEach((t) => {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("user_id");
      expect(t).toHaveProperty("wallet_id");
      expect(t).toHaveProperty("type");
      expect(t).toHaveProperty("amount");
      expect(t).toHaveProperty("currency");
      expect(t).toHaveProperty("category");
      expect(t).toHaveProperty("description");
      expect(t).toHaveProperty("date");
      expect(t).toHaveProperty("created_at");
    });
  });

  it("type is either income or expense", () => {
    DEMO_TRANSACTIONS.forEach((t) => {
      expect(["income", "expense"]).toContain(t.type);
    });
  });

  it("all transactions belong to DEMO_USER_ID", () => {
    DEMO_TRANSACTIONS.forEach((t) => {
      expect(t.user_id).toBe(DEMO_USER_ID);
    });
  });

  it("transactions reference existing demo wallet ids", () => {
    const walletIds = new Set(DEMO_WALLETS.map((w) => w.id));
    DEMO_TRANSACTIONS.forEach((t) => {
      expect(walletIds.has(t.wallet_id)).toBe(true);
    });
  });

  it("amounts are positive numbers", () => {
    DEMO_TRANSACTIONS.forEach((t) => {
      expect(typeof t.amount).toBe("number");
      expect(t.amount).toBeGreaterThan(0);
    });
  });

  it("ids are unique and follow tx-XXXX format", () => {
    const ids = DEMO_TRANSACTIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
    ids.forEach((id) => {
      expect(id).toMatch(/^tx-\d{4}$/);
    });
  });

  it("dates are ISO date strings (YYYY-MM-DD)", () => {
    DEMO_TRANSACTIONS.forEach((t) => {
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
