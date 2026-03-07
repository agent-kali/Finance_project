import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password inputs", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Both email and password show validation errors
    const errors = screen.getAllByText(
      /please enter a valid email|password is required/i
    );
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });
});
