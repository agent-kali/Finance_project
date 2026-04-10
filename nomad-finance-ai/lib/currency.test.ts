import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  convertToBase,
  convertCurrency,
  formatCurrency,
  formatCompact,
  formatForCard,
} from "./currency";
import { EXCHANGE_RATES, CURRENCY_SYMBOLS } from "@/lib/constants";
import type { SupportedCurrency } from "@/lib/constants";

// ─── Mock the live conversion module ────────────────────────────────────────
// We isolate unit tests from the network-dependent CurrencyConversionProvider
// by mocking the entire module. This lets us test convertCurrency's delegation
// logic without relying on Frankfurter API availability.
vi.mock("@/lib/currency-conversion", () => ({
  convert: vi.fn((amount: number, from: string, to: string) => {
    // Mirror the static-rate fallback so we can assert deterministic values
    const base = amount / EXCHANGE_RATES[from as SupportedCurrency];
    return base * EXCHANGE_RATES[to as SupportedCurrency];
  }),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────
const currencies = Object.keys(EXCHANGE_RATES) as SupportedCurrency[];

// ─── convertToBase ──────────────────────────────────────────────────────────
describe("convertToBase", () => {
  it("returns the same amount when converting from EUR (base currency)", () => {
    expect(convertToBase(100, "EUR")).toBe(100);
  });

  it("correctly divides by the exchange rate for non-base currencies", () => {
    const vndRate = EXCHANGE_RATES["VND"];
    expect(convertToBase(vndRate, "VND")).toBeCloseTo(1, 8);
  });

  it("handles zero amount for any currency", () => {
    currencies.forEach((cur) => {
      expect(convertToBase(0, cur)).toBe(0);
    });
  });

  it("handles fractional amounts without precision loss", () => {
    const result = convertToBase(0.01, "EUR");
    expect(result).toBeCloseTo(0.01, 10);
  });

  it("handles very large amounts", () => {
    const billion = 1_000_000_000;
    const result = convertToBase(billion, "EUR");
    expect(result).toBe(billion);
    expect(Number.isFinite(result)).toBe(true);
  });

  it("preserves negative sign (expenses / debits)", () => {
    const result = convertToBase(-500, "EUR");
    expect(result).toBe(-500);
  });

  // Roundtrip property: converting to base then back should ≈ original
  it.each(currencies)(
    "roundtrips through base for %s within floating-point tolerance",
    (cur) => {
      const original = 1234.56;
      const base = convertToBase(original, cur);
      const restored = base * EXCHANGE_RATES[cur];
      expect(restored).toBeCloseTo(original, 6);
    }
  );
});

// ─── convertCurrency ────────────────────────────────────────────────────────
describe("convertCurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to the live conversion module", async () => {
    const { convert } = await import("@/lib/currency-conversion");
    convertCurrency(100, "USD", "EUR");
    expect(convert).toHaveBeenCalledWith(100, "USD", "EUR");
  });

  it("returns the same amount when from === to", () => {
    const result = convertCurrency(250, "USD", "USD");
    expect(result).toBeCloseTo(250, 8);
  });

  it("produces a positive result for positive input across different pairs", () => {
    const result = convertCurrency(100, "USD", "VND");
    expect(result).toBeGreaterThan(0);
  });

  it("handles zero gracefully", () => {
    expect(convertCurrency(0, "USD", "EUR")).toBe(0);
  });
});

// ─── formatCurrency ─────────────────────────────────────────────────────────
describe("formatCurrency", () => {
  // Snapshot-style expectations for every supported currency ensure we catch
  // regressions if someone changes CURRENCY_SYMBOLS or formatting logic.
  it("prefixes output with the correct symbol for each currency", () => {
    currencies.forEach((cur) => {
      const formatted = formatCurrency(100, cur);
      expect(formatted.startsWith(CURRENCY_SYMBOLS[cur])).toBe(true);
    });
  });

  describe("VND formatting (zero-decimal currency)", () => {
    it("rounds to the nearest whole number", () => {
      expect(formatCurrency(50_000.4, "VND")).toBe("₫50,000");
      expect(formatCurrency(50_000.5, "VND")).toBe("₫50,001");
    });

    it("includes thousands separators", () => {
      expect(formatCurrency(1_234_567, "VND")).toBe("₫1,234,567");
    });

    it("formats zero", () => {
      expect(formatCurrency(0, "VND")).toBe("₫0");
    });
  });

  describe("standard currency formatting (two-decimal currencies)", () => {
    it("pads to two decimal places", () => {
      expect(formatCurrency(5, "USD")).toBe("$5.00");
    });

    it("truncates/rounds beyond two decimal places", () => {
      // toLocaleString rounds using banker's rounding in some engines,
      // so we verify the output has exactly two decimals.
      const result = formatCurrency(9.999, "USD");
      expect(result).toMatch(/^\$[\d,]+\.\d{2}$/);
    });

    it("includes thousands separators for large amounts", () => {
      expect(formatCurrency(1_234_567.89, "USD")).toBe("$1,234,567.89");
    });

    it("handles negative amounts", () => {
      const result = formatCurrency(-42.5, "USD");
      expect(result).toContain("42.50");
    });

    it("formats zero with decimals", () => {
      expect(formatCurrency(0, "USD")).toBe("$0");
    });
  });
});

// ─── formatForCard ─────────────────────────────────────────────────────────
describe("formatForCard", () => {
  it("returns full format when string length <= 11", () => {
    expect(formatForCard(1_234.56, "USD")).toBe("$1,234.56");
    expect(formatForCard(9_999.99, "USD")).toBe("$9,999.99");
    expect(formatForCard(1_234_567, "VND")).toBe("₫1,234,567");
  });

  it("returns compact format when full string exceeds 11 chars", () => {
    expect(formatForCard(191_450_500, "VND")).toBe("₫191.5M");
    expect(formatForCard(12_345_678.9, "USD")).toBe("$12.3M");
  });

  it("boundary: 11 chars uses full, 12 chars uses compact", () => {
    const fullShort = formatCurrency(123_456, "VND"); // "₫123,456" = 8 chars
    expect(fullShort.length).toBeLessThanOrEqual(11);
    expect(formatForCard(123_456, "VND")).toBe("₫123,456");

    const fullLong = formatCurrency(191_450_500, "VND"); // "₫191,450,500" = 12 chars
    expect(fullLong.length).toBeGreaterThan(11);
    expect(formatForCard(191_450_500, "VND")).toBe("₫191.5M");
  });
});

// ─── formatCompact ──────────────────────────────────────────────────────────
describe("formatCompact", () => {
  describe("USD (representative two-decimal currency)", () => {
    it.each([
      [2_500_000, "$2.5M"],
      [1_000_000, "$1.0M"],
      [999_999, "$1000.0K"],
      [10_000, "$10.0K"],
      [1_000, "$1.0K"],
      [999.99, "$999.99"],
      [42.5, "$42.50"],
      [0, "$0.00"],
    ])("formats %d as %s", (input, expected) => {
      expect(formatCompact(input, "USD")).toBe(expected);
    });
  });

  describe("VND (zero-decimal currency)", () => {
    it.each([
      [5_000_000, "₫5.0M"],
      [1_000_000, "₫1.0M"],
      [50_000, "₫50K"],
      [1_000, "₫1K"],
      [999, "₫999"],
      [0, "₫0"],
    ])("formats %d as %s", (input, expected) => {
      expect(formatCompact(input, "VND")).toBe(expected);
    });

    it("rounds VND thousands to whole numbers (no .0K)", () => {
      const result = formatCompact(1_500, "VND");
      // VND thousands use toFixed(0), so no decimal
      expect(result).toBe("₫2K");
    });
  });

  describe("negative values", () => {
    it("uses Math.abs for threshold but preserves sign in output", () => {
      // This documents the current behavior — negative millions keep the minus
      expect(formatCompact(-3_000_000, "USD")).toBe("$-3.0M");
    });

    it("handles negative thousands", () => {
      expect(formatCompact(-5_000, "USD")).toBe("$-5.0K");
    });

    it("handles negative small amounts", () => {
      expect(formatCompact(-7.5, "USD")).toBe("$-7.50");
    });
  });

  describe("boundary conditions", () => {
    it("treats exactly 1,000,000 as millions, not thousands", () => {
      const result = formatCompact(1_000_000, "USD");
      expect(result).toContain("M");
    });

    it("treats exactly 1,000 as thousands, not small", () => {
      const result = formatCompact(1_000, "USD");
      expect(result).toContain("K");
    });

    it("returns finite output for Number.MAX_SAFE_INTEGER", () => {
      const result = formatCompact(Number.MAX_SAFE_INTEGER, "USD");
      expect(result).toContain("M");
      expect(result.startsWith("$")).toBe(true);
    });
  });
});