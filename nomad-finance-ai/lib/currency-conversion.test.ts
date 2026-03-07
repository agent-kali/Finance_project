import { describe, it, expect, vi, beforeEach } from "vitest";
import { convert, getExchangeRates } from "./currency-conversion";
import { EXCHANGE_RATES, SUPPORTED_CURRENCIES } from "@/lib/constants";
import type { SupportedCurrency } from "@/lib/constants";

// In Node, loadFromStorage returns null, so convert uses EXCHANGE_RATES when cache is empty.
// Run convert tests first so memoryCache stays null; getExchangeRates tests use vi.resetModules.

// ─── convert ────────────────────────────────────────────────────────────────
describe("convert", () => {
  it("returns the same amount when from === to", () => {
    expect(convert(100, "EUR", "EUR")).toBe(100);
    expect(convert(42.5, "USD", "USD")).toBe(42.5);
  });

  it("converts EUR to USD using static fallback (no cache in Node)", () => {
    const eurAmount = 100;
    const usdRate = EXCHANGE_RATES.USD;
    const expected = eurAmount * usdRate;
    expect(convert(eurAmount, "EUR", "USD")).toBeCloseTo(expected, 8);
  });

  it("converts USD to EUR using static fallback", () => {
    const usdAmount = 108;
    const eurAmount = usdAmount / EXCHANGE_RATES.USD;
    expect(convert(usdAmount, "USD", "EUR")).toBeCloseTo(eurAmount, 8);
  });

  it("handles zero amount", () => {
    expect(convert(0, "EUR", "USD")).toBe(0);
    expect(convert(0, "VND", "GBP")).toBe(0);
  });

  it("preserves negative amounts (expenses)", () => {
    const result = convert(-50, "USD", "EUR");
    expect(result).toBeLessThan(0);
    expect(Math.abs(result)).toBeCloseTo(
      Math.abs(50 / EXCHANGE_RATES.USD),
      8
    );
  });

  it("handles very large amounts without overflow", () => {
    const billion = 1_000_000_000;
    const result = convert(billion, "EUR", "USD");
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeCloseTo(billion * EXCHANGE_RATES.USD, 2);
  });

  describe("unknown currency fallback", () => {
    it("returns amount unchanged when both from and to are unknown", () => {
      expect(convert(100, "XXX", "YYY")).toBe(100);
    });

    it("uses static EXCHANGE_RATES when from and to are supported", () => {
      const result = convert(100, "EUR", "PLN");
      expect(result).toBeCloseTo(100 * EXCHANGE_RATES.PLN, 8);
    });
  });

  // Roundtrip: convert to B then back to A should ≈ original
  it.each(SUPPORTED_CURRENCIES.slice(0, 5))(
    "roundtrips for %s within floating-point tolerance",
    (cur) => {
      const original = 1234.56;
      const toEur = convert(original, cur as string, "EUR");
      const back = convert(toEur, "EUR", cur as string);
      expect(back).toBeCloseTo(original, 5);
    }
  );
});

// ─── getExchangeRates ──────────────────────────────────────────────────────
describe("getExchangeRates", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", originalFetch);
    vi.clearAllMocks();
  });

  it("returns rates and date on successful API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          base: "EUR",
          date: "2025-03-05",
          rates: { USD: 1.08, GBP: 0.85 },
        }),
    }));

    const { getExchangeRates: getRates } = await import("./currency-conversion");
    const result = await getRates("EUR");

    expect(result).toHaveProperty("rates");
    expect(result).toHaveProperty("date");
    expect(result.rates).toHaveProperty("USD");
    expect(result.rates).toHaveProperty("GBP");
    expect(result.date).toBe("2025-03-05");
  });

  it("falls back to static rates when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const { getExchangeRates: getRates } = await import("./currency-conversion");
    const result = await getRates("EUR");

    expect(result.rates.EUR).toBe(1);
    expect(result.rates.USD).toBe(EXCHANGE_RATES.USD);
    expect(result).toHaveProperty("date");
  });

  it("falls back to static rates when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const { getExchangeRates: getRates } = await import("./currency-conversion");
    const result = await getRates("EUR");

    expect(result.rates.EUR).toBe(1);
    expect(result.rates.USD).toBe(EXCHANGE_RATES.USD);
  });

  it("merges Frankfurter rates with static rates for unsupported currencies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          base: "EUR",
          date: "2025-03-05",
          rates: { USD: 1.09, GBP: 0.86 },
        }),
    }));

    const { getExchangeRates: getRates } = await import("./currency-conversion");
    const result = await getRates("EUR");

    // Frankfurter returns USD and GBP; VND is not in their API, so it must be merged from EXCHANGE_RATES
    expect(result.rates.VND).toBe(EXCHANGE_RATES.VND);
    expect(result.rates.EUR).toBe(1);
  });

  it("uses default base EUR when not specified", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          base: "EUR",
          date: "2025-03-05",
          rates: { USD: 1.08 },
        }),
    }));

    const { getExchangeRates: getRates } = await import("./currency-conversion");
    const result = await getRates();

    expect(result.rates.EUR).toBe(1);
  });
});
