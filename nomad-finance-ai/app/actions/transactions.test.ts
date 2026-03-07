import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./transactions";

// ─── Mock Supabase ───────────────────────────────────────────────────────────
const mockFrom = vi.fn();
const mockAuthGetUser = vi.fn();

const createMockSupabase = () => ({
  auth: {
    getUser: () => mockAuthGetUser(),
  },
  from: mockFrom,
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(createMockSupabase())),
}));

// Chainable mock builder for Supabase query pattern
function chainMock(returnValue: { data?: unknown; error?: { message: string } | null }) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(returnValue)),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: "user-123" } },
    error: null,
  });
});

// ─── createTransaction ──────────────────────────────────────────────────────
describe("createTransaction", () => {
  it("throws Unauthorized when user is not authenticated", async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(
      createTransaction({
        wallet_id: "wallet-1",
        amount: 100,
        type: "income",
        category: "Salary",
        date: "2025-03-05",
      })
    ).rejects.toThrow("Unauthorized");
  });

  it("throws when auth.getUser returns error", async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Session expired" },
    });

    await expect(
      createTransaction({
        wallet_id: "wallet-1",
        amount: 100,
        type: "income",
        category: "Salary",
        date: "2025-03-05",
      })
    ).rejects.toThrow("Unauthorized");
  });

  it("throws Wallet not found when wallet fetch fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "wallets") {
        return chainMock({ data: null, error: { message: "Not found" } });
      }
      return chainMock({ data: null, error: null });
    });

    await expect(
      createTransaction({
        wallet_id: "nonexistent",
        amount: 100,
        type: "income",
        category: "Salary",
        date: "2025-03-05",
      })
    ).rejects.toThrow("Wallet not found");
  });

  it("returns created transaction on success", async () => {
    const mockWallet = { currency: "EUR", balance: 1000 };
    const mockTx = {
      id: "tx-1",
      user_id: "user-123",
      wallet_id: "wallet-1",
      amount: 100,
      type: "income" as const,
      currency: "EUR",
      category: "Salary",
      description: null,
      date: "2025-03-05",
      created_at: "2025-03-05T12:00:00Z",
    };

    mockFrom.mockImplementation((table: string) => {
      const walletChain = chainMock({ data: mockWallet, error: null });
      const txChain = chainMock({ data: mockTx, error: null });
      const updateChain = chainMock({ data: null, error: null });
      if (table === "wallets") {
        return { ...walletChain, update: vi.fn(() => updateChain), eq: vi.fn(() => updateChain) };
      }
      if (table === "transactions") {
        return txChain;
      }
      return chainMock({ data: null, error: null });
    });

    const result = await createTransaction({
      wallet_id: "wallet-1",
      amount: 100,
      type: "income",
      category: "Salary",
      date: "2025-03-05",
    });

    expect(result).toEqual(mockTx);
  });

  it("throws when insert fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "wallets") {
        return chainMock({ data: { currency: "EUR", balance: 1000 }, error: null });
      }
      if (table === "transactions") {
        return chainMock({ data: null, error: { message: "Duplicate key" } });
      }
      return chainMock({ data: null, error: null });
    });

    await expect(
      createTransaction({
        wallet_id: "wallet-1",
        amount: 100,
        type: "income",
        category: "Salary",
        date: "2025-03-05",
      })
    ).rejects.toThrow("Duplicate key");
  });
});

// ─── updateTransaction ───────────────────────────────────────────────────────
describe("updateTransaction", () => {
  it("throws Unauthorized when user is not authenticated", async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(
      updateTransaction("tx-1", { amount: 200, category: "Freelance" })
    ).rejects.toThrow("Unauthorized");
  });

  it("returns updated transaction on success", async () => {
    const mockTx = {
      id: "tx-1",
      user_id: "user-123",
      amount: 200,
      category: "Freelance",
    };

    mockFrom.mockImplementation(() => chainMock({ data: mockTx, error: null }));

    const result = await updateTransaction("tx-1", {
      amount: 200,
      category: "Freelance",
    });

    expect(result).toEqual(mockTx);
  });

  it("throws when update fails", async () => {
    mockFrom.mockImplementation(() =>
      chainMock({ data: null, error: { message: "Transaction not found" } })
    );

    await expect(
      updateTransaction("tx-nonexistent", { amount: 200 })
    ).rejects.toThrow("Transaction not found");
  });
});

// ─── deleteTransaction ──────────────────────────────────────────────────────
describe("deleteTransaction", () => {
  it("throws Unauthorized when user is not authenticated", async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(deleteTransaction("tx-1")).rejects.toThrow("Unauthorized");
  });

  it("completes without error when transaction exists", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "transactions") {
        const selectChain = chainMock({
          data: { wallet_id: "wallet-1", amount: 100, type: "income" },
          error: null,
        });
        const deleteChain = chainMock({ data: null, error: null });
        return {
          select: vi.fn(() => selectChain),
          eq: vi.fn(() => selectChain),
          single: vi.fn(() => Promise.resolve({ data: { wallet_id: "wallet-1", amount: 100, type: "income" }, error: null })),
          delete: vi.fn(() => deleteChain),
        };
      }
      if (table === "wallets") {
        return { ...chainMock({ data: { balance: 1100 }, error: null }), update: vi.fn(() => chainMock({ data: null, error: null })), eq: vi.fn(() => chainMock({ data: null, error: null })) };
      }
      return chainMock({ data: null, error: null });
    });

    await expect(deleteTransaction("tx-1")).resolves.toBeUndefined();
  });

  it("throws when delete fails", async () => {
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "transactions") {
        callCount++;
        if (callCount === 1) {
          const selectChain = {
            select: vi.fn(() => selectChain),
            eq: vi.fn(() => selectChain),
            single: vi.fn(() =>
              Promise.resolve({
                data: { wallet_id: "wallet-1", amount: 100, type: "income" },
                error: null,
              })
            ),
          };
          return selectChain;
        }
        const deleteChain = {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({ data: null, error: { message: "Delete failed" } })
              ),
            })),
          })),
        };
        return deleteChain;
      }
      return chainMock({ data: null, error: null });
    });

    await expect(deleteTransaction("tx-1")).rejects.toThrow("Delete failed");
  });
});
