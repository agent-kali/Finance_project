import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPageClient } from "./login-page-client";

const getMockSearchParams = vi.fn();
const { handleDemoLogin } = vi.hoisted(() => ({
  handleDemoLogin: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: getMockSearchParams,
  }),
}));

vi.mock("@/components/auth/demo-login-button", () => ({
  handleDemoLogin,
}));

vi.mock("@/components/auth/login-form", () => ({
  LoginForm: () => <button>Try Demo Account</button>,
}));

describe("LoginPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auto-clicks the demo button when demo=true is present", async () => {
    getMockSearchParams.mockReturnValue("true");

    render(<LoginPageClient />);

    await waitFor(() => {
      expect(handleDemoLogin).toHaveBeenCalledTimes(1);
    });
  });

  it("does not auto-click the demo button without the demo query param", async () => {
    getMockSearchParams.mockReturnValue(null);

    render(<LoginPageClient />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /try demo account/i })
      ).toBeInTheDocument();
    });

    expect(handleDemoLogin).not.toHaveBeenCalled();
  });
});
