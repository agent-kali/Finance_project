import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDateRange,
  getPeriodLabel,
  getSavingsSubtitle,
  getEmptyMessage,
} from "./date-utils";
import type { TimeRange } from "@/lib/time-range-context";

// Use fixed date for deterministic tests
const FIXED_DATE = new Date(2025, 2, 5, 12, 0, 0); // 2025-03-05 noon (Wednesday)

describe("getDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Today: start is midnight today, end is 23:59:59.999 today", () => {
    const { start, end } = getDateRange("Today");
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(2);
    expect(start.getDate()).toBe(5);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(end.getDate()).toBe(5);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("This Week: start is Monday of current week", () => {
    const { start } = getDateRange("This Week");
    // 2025-03-05 is Wednesday; Monday is 2025-03-03
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(3);
    expect(start.getMonth()).toBe(2);
    expect(start.getFullYear()).toBe(2025);
  });

  it("This Month: start is first day of month", () => {
    const { start } = getDateRange("This Month");
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(2);
    expect(start.getFullYear()).toBe(2025);
    expect(start.getHours()).toBe(0);
  });

  it("This Week when today is Sunday uses previous Monday", () => {
    vi.setSystemTime(new Date(2025, 2, 9)); // Sunday 2025-03-09
    const { start } = getDateRange("This Week");
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(3); // Monday 2025-03-03
  });

  it("returns start before end for all ranges", () => {
    (["Today", "This Week", "This Month"] as TimeRange[]).forEach((range) => {
      const { start, end } = getDateRange(range);
      expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
    });
  });
});

describe("getPeriodLabel", () => {
  it.each([
    ["Today", "Today"],
    ["This Week", "This Week"],
    ["This Month", "This Month"],
  ] as [TimeRange, string][])("returns %s for %s", (input, expected) => {
    expect(getPeriodLabel(input)).toBe(expected);
  });
});

describe("getSavingsSubtitle", () => {
  it("returns 'No income yet' when hasIncome is false", () => {
    (["Today", "This Week", "This Month"] as TimeRange[]).forEach((range) => {
      expect(getSavingsSubtitle(range, false)).toBe("No income yet");
    });
  });

  it.each([
    ["Today", true, "Of daily income"],
    ["This Week", true, "Of weekly income"],
    ["This Month", true, "Of monthly income"],
  ] as [TimeRange, boolean, string][])(
    "returns correct subtitle for %s with income",
    (range, hasIncome, expected) => {
      expect(getSavingsSubtitle(range, hasIncome)).toBe(expected);
    }
  );
});

describe("getEmptyMessage", () => {
  it.each([
    ["Today", "No spending today yet!"],
    ["This Week", "No spending this week yet!"],
    ["This Month", "No spending this month yet!"],
  ] as [TimeRange, string][])("returns correct message for %s", (input, expected) => {
    expect(getEmptyMessage(input)).toBe(expected);
  });
});
