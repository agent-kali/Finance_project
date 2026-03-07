import { describe, it, expect } from "vitest";
import { cn } from "./utils";

// ─── cn (class name merger) ─────────────────────────────────────────────────
describe("cn", () => {
  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns the single string as-is when no conflicts", () => {
    expect(cn("foo")).toBe("foo");
    expect(cn("px-4 py-2")).toBe("px-4 py-2");
  });

  it("merges multiple strings with space separator", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles undefined and null by ignoring them", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
    expect(cn("foo", null as unknown as string, "bar")).toBe("foo bar");
  });

  it("handles conditional classes (clsx object syntax)", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
    expect(cn({ hidden: true })).toBe("hidden");
  });

  it("resolves conflicting Tailwind classes via twMerge (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("py-1", "py-3")).toBe("py-3");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays of class values", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn("base", ["foo", "bar"])).toBe("base foo bar");
  });

  it("handles empty string in inputs", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("deduplicates non-conflicting classes", () => {
    const result = cn("foo", "foo", "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });
});
