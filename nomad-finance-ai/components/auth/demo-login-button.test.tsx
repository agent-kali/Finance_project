import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemoLoginButton } from "./demo-login-button";
import { enableDemoMode } from "@/lib/demo-context";

vi.mock("@/lib/demo-context", () => ({
  enableDemoMode: vi.fn(),
}));

describe("DemoLoginButton", () => {

  const mockLocation = { href: "" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
      configurable: true,
    });
  });

  it("renders the button with Try Demo Account text", () => {
    render(<DemoLoginButton />);
    expect(screen.getByRole("button", { name: /try demo account/i })).toBeInTheDocument();
  });

  it("calls enableDemoMode and sets location.href to /dashboard on click", async () => {
    const user = userEvent.setup();
    render(<DemoLoginButton />);

    await user.click(screen.getByRole("button", { name: /try demo account/i }));

    expect(enableDemoMode).toHaveBeenCalledTimes(1);
    expect(mockLocation.href).toBe("/dashboard");
  });

  it("shows loading state and disables button after click", async () => {
    const user = userEvent.setup();
    render(<DemoLoginButton />);

    const button = screen.getByRole("button", { name: /try demo account/i });
    await user.click(button);

    expect(button).toBeDisabled();
  });
});
