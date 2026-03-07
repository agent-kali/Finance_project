import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./auth-schemas";

describe("loginSchema", () => {
  it("accepts valid email and non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("valid email");
    }
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Password");
    }
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({})).toMatchObject({ success: false });
    expect(loginSchema.safeParse({ email: "a@b.com" })).toMatchObject({
      success: false,
    });
  });
});

describe("registerSchema", () => {
  it("accepts valid data with matching passwords", () => {
    const result = registerSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects fullName shorter than 2 characters", () => {
    const result = registerSchema.safeParse({
      fullName: "A",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("2 characters");
    }
  });

  it("rejects password shorter than 6 characters", () => {
    const result = registerSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues.some((i) =>
        i.message.includes("6 characters")
      );
      expect(msg).toBe(true);
    }
  });

  it("rejects when passwords don't match", () => {
    const result = registerSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (i) => (i as { path?: string[] }).path?.[0] === "confirmPassword"
      );
      expect(confirmError?.message).toContain("don't match");
    }
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      fullName: "Jane Doe",
      email: "invalid",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });
});
