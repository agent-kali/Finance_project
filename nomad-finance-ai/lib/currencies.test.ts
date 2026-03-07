import { describe, it, expect } from "vitest";
import {
  getCurrency,
  getPopularCurrencies,
  getOtherCurrencies,
  CURRENCIES,
  POPULAR_FOR_NOMADS,
} from "./currencies";
import type { CurrencyEntry } from "./currencies";

// ─── getCurrency ───────────────────────────────────────────────────────────
describe("getCurrency", () => {
  it("returns the entry for a valid currency code", () => {
    const usd = getCurrency("USD");
    expect(usd).toBeDefined();
    expect(usd?.code).toBe("USD");
    expect(usd?.symbol).toBe("$");
    expect(usd?.name).toBe("United States Dollar");
    expect(usd?.shortName).toBe("US Dollar");
    expect(usd?.flag).toBe("🇺🇸");
  });

  it("returns undefined for an unknown currency code", () => {
    expect(getCurrency("XXX")).toBeUndefined();
    expect(getCurrency("INVALID")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(getCurrency("")).toBeUndefined();
  });

  it.each(["USD", "EUR", "GBP", "VND", "JPY"])(
    "returns a complete entry for %s with all required fields",
    (code) => {
      const entry = getCurrency(code);
      expect(entry).toBeDefined();
      expect(entry).toHaveProperty("code");
      expect(entry).toHaveProperty("symbol");
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("shortName");
      expect(entry).toHaveProperty("flag");
    }
  );
});

// ─── getPopularCurrencies ──────────────────────────────────────────────────
describe("getPopularCurrencies", () => {
  it("returns an array of length equal to POPULAR_FOR_NOMADS", () => {
    const popular = getPopularCurrencies();
    expect(popular).toHaveLength(POPULAR_FOR_NOMADS.length);
  });

  it("every returned entry has code, symbol, name, shortName, and flag", () => {
    const popular = getPopularCurrencies();
    const required: (keyof CurrencyEntry)[] = ["code", "symbol", "name", "shortName", "flag"];
    popular.forEach((entry) => {
      required.forEach((key) => {
        expect(entry[key]).toBeDefined();
        expect(typeof entry[key]).toBe("string");
      });
    });
  });

  it("returns no duplicates", () => {
    const popular = getPopularCurrencies();
    const codes = popular.map((c) => c.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it("all returned codes match POPULAR_FOR_NOMADS order", () => {
    const popular = getPopularCurrencies();
    popular.forEach((entry, i) => {
      expect(entry.code).toBe(POPULAR_FOR_NOMADS[i]);
    });
  });
});

// ─── getOtherCurrencies ────────────────────────────────────────────────────
describe("getOtherCurrencies", () => {
  it("returns currencies not in the popular set", () => {
    const popular = getPopularCurrencies();
    const other = getOtherCurrencies();
    const popularCodes = new Set(popular.map((c) => c.code));
    other.forEach((entry) => {
      expect(popularCodes.has(entry.code)).toBe(false);
    });
  });

  it("popular and other together cover all CURRENCIES with no overlap", () => {
    const popular = getPopularCurrencies();
    const other = getOtherCurrencies();
    const popularCodes = new Set(popular.map((c) => c.code));
    const otherCodes = new Set(other.map((c) => c.code));
    expect(popularCodes.size + otherCodes.size).toBe(CURRENCIES.length);
    popularCodes.forEach((code) => {
      expect(otherCodes.has(code)).toBe(false);
    });
  });

  it("every CURRENCY appears in either popular or other", () => {
    const popular = getPopularCurrencies();
    const other = getOtherCurrencies();
    const combinedCodes = new Set([
      ...popular.map((c) => c.code),
      ...other.map((c) => c.code),
    ]);
    CURRENCIES.forEach((c) => {
      expect(combinedCodes.has(c.code)).toBe(true);
    });
  });
});
