import type { Wallet, Transaction } from "@/types/database.types";

export const DEMO_COOKIE = "demo_mode";
export const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@nomadfinance.app",
  user_metadata: { full_name: "Demo User" },
} as const;

export const DEMO_PRIMARY_CURRENCY = "USD" as const;

const W_EUR = "wallet-eur-0001";
const W_USD = "wallet-usd-0002";
const W_PLN = "wallet-pln-0003";

export const DEMO_WALLETS: Wallet[] = [
  { id: W_EUR, user_id: DEMO_USER_ID, currency: "EUR", balance: 4250.0, created_at: "2025-08-01T00:00:00Z" },
  { id: W_USD, user_id: DEMO_USER_ID, currency: "USD", balance: 2180.5, created_at: "2025-08-01T00:00:00Z" },
  { id: W_PLN, user_id: DEMO_USER_ID, currency: "PLN", balance: 8500.0, created_at: "2025-09-15T00:00:00Z" },
];

function d(monthsAgo: number, day: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
  return date.toISOString().split("T")[0];
}

let txId = 0;
function tx(
  overrides: Omit<Transaction, "id" | "user_id" | "created_at">
): Transaction {
  txId++;
  return {
    id: `tx-${String(txId).padStart(4, "0")}`,
    user_id: DEMO_USER_ID,
    created_at: `${overrides.date}T12:00:00Z`,
    ...overrides,
  };
}

export const DEMO_TRANSACTIONS: Transaction[] = [
  // --- Month 0 (current) ---
  tx({ wallet_id: W_EUR, type: "income", amount: 3200, currency: "EUR", category: "Freelance", description: "Client payment — website redesign", date: d(0, 2) }),
  tx({ wallet_id: W_EUR, type: "income", amount: 2500, currency: "EUR", category: "Salary", description: "Monthly retainer — consulting", date: d(0, 1) }),
  tx({ wallet_id: W_USD, type: "income", amount: 850, currency: "USD", category: "Freelance", description: "Logo design project", date: d(0, 5) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 1100, currency: "EUR", category: "Housing", description: "Airbnb Lisbon — 1 month", date: d(0, 1) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 125, currency: "EUR", category: "Coworking", description: "WeWork day pass x5", date: d(0, 3) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 85, currency: "EUR", category: "Food & Dining", description: "Groceries — week 1", date: d(0, 4) }),
  tx({ wallet_id: W_PLN, type: "expense", amount: 340, currency: "PLN", category: "Food & Dining", description: "Restaurants & cafés", date: d(0, 6) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 89, currency: "EUR", category: "Transportation", description: "Ryanair — Lisbon to Kraków", date: d(0, 7) }),
  tx({ wallet_id: W_USD, type: "expense", amount: 83, currency: "USD", category: "Health & Insurance", description: "SafetyWing insurance", date: d(0, 1) }),
  tx({ wallet_id: W_USD, type: "expense", amount: 45, currency: "USD", category: "SaaS & Tools", description: "Figma + Notion + Vercel", date: d(0, 1) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 22, currency: "EUR", category: "Entertainment", description: "Spotify + Netflix", date: d(0, 1) }),

  // --- Month 1 ---
  tx({ wallet_id: W_EUR, type: "income", amount: 2500, currency: "EUR", category: "Salary", description: "Monthly retainer — consulting", date: d(1, 1) }),
  tx({ wallet_id: W_USD, type: "income", amount: 1400, currency: "USD", category: "Freelance", description: "Mobile app UI contract", date: d(1, 10) }),
  tx({ wallet_id: W_EUR, type: "income", amount: 120, currency: "EUR", category: "Investment", description: "ETF dividend payout", date: d(1, 15) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 1050, currency: "EUR", category: "Housing", description: "Airbnb Porto — 1 month", date: d(1, 1) }),
  tx({ wallet_id: W_PLN, type: "expense", amount: 280, currency: "PLN", category: "Food & Dining", description: "Groceries + eating out", date: d(1, 5) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 210, currency: "EUR", category: "Travel", description: "Weekend trip — Sintra", date: d(1, 12) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 79, currency: "EUR", category: "Shopping", description: "New backpack for travel", date: d(1, 8) }),
  tx({ wallet_id: W_USD, type: "expense", amount: 83, currency: "USD", category: "Health & Insurance", description: "SafetyWing insurance", date: d(1, 1) }),
  tx({ wallet_id: W_USD, type: "expense", amount: 29, currency: "USD", category: "Education", description: "Udemy course bundle", date: d(1, 20) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 15, currency: "EUR", category: "Utilities", description: "Phone plan (eSIM)", date: d(1, 2) }),

  // --- Month 2 ---
  tx({ wallet_id: W_EUR, type: "income", amount: 2500, currency: "EUR", category: "Salary", description: "Monthly retainer — consulting", date: d(2, 1) }),
  tx({ wallet_id: W_EUR, type: "income", amount: 1800, currency: "EUR", category: "Freelance", description: "Brand identity project", date: d(2, 14) }),
  tx({ wallet_id: W_PLN, type: "income", amount: 2000, currency: "PLN", category: "Transfer", description: "Transfer from savings", date: d(2, 5) }),
  tx({ wallet_id: W_PLN, type: "expense", amount: 3200, currency: "PLN", category: "Housing", description: "Apartment Kraków — rent", date: d(2, 1) }),
  tx({ wallet_id: W_PLN, type: "expense", amount: 110, currency: "PLN", category: "Transportation", description: "Monthly metro pass", date: d(2, 2) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 95, currency: "EUR", category: "Food & Dining", description: "Groceries — week", date: d(2, 7) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 150, currency: "EUR", category: "Coworking", description: "Coworking space monthly", date: d(2, 1) }),
  tx({ wallet_id: W_USD, type: "expense", amount: 45, currency: "USD", category: "SaaS & Tools", description: "Figma + Notion + Vercel", date: d(2, 1) }),

  // --- Month 3 ---
  tx({ wallet_id: W_EUR, type: "income", amount: 2500, currency: "EUR", category: "Salary", description: "Monthly retainer — consulting", date: d(3, 1) }),
  tx({ wallet_id: W_USD, type: "income", amount: 2200, currency: "USD", category: "Freelance", description: "E-commerce site build", date: d(3, 18) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 980, currency: "EUR", category: "Housing", description: "Airbnb Split — 1 month", date: d(3, 1) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 75, currency: "EUR", category: "Food & Dining", description: "Groceries — week", date: d(3, 6) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 320, currency: "EUR", category: "Travel", description: "Ferry + hotel — Hvar Island", date: d(3, 15) }),
  tx({ wallet_id: W_USD, type: "expense", amount: 83, currency: "USD", category: "Health & Insurance", description: "SafetyWing insurance", date: d(3, 1) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 22, currency: "EUR", category: "Entertainment", description: "Spotify + Netflix", date: d(3, 1) }),

  // --- Month 4 ---
  tx({ wallet_id: W_EUR, type: "income", amount: 2500, currency: "EUR", category: "Salary", description: "Monthly retainer — consulting", date: d(4, 1) }),
  tx({ wallet_id: W_EUR, type: "income", amount: 600, currency: "EUR", category: "Freelance", description: "Landing page design", date: d(4, 22) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 1200, currency: "EUR", category: "Housing", description: "Airbnb Barcelona — 1 month", date: d(4, 1) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 110, currency: "EUR", category: "Food & Dining", description: "Groceries + dining", date: d(4, 8) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 65, currency: "EUR", category: "Transportation", description: "Metro card Barcelona", date: d(4, 3) }),
  tx({ wallet_id: W_USD, type: "expense", amount: 45, currency: "USD", category: "SaaS & Tools", description: "Figma + Notion + Vercel", date: d(4, 1) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 15, currency: "EUR", category: "Utilities", description: "Phone plan (eSIM)", date: d(4, 2) }),

  // --- Month 5 ---
  tx({ wallet_id: W_EUR, type: "income", amount: 2500, currency: "EUR", category: "Salary", description: "Monthly retainer — consulting", date: d(5, 1) }),
  tx({ wallet_id: W_USD, type: "income", amount: 950, currency: "USD", category: "Freelance", description: "Dashboard UI project", date: d(5, 12) }),
  tx({ wallet_id: W_EUR, type: "income", amount: 120, currency: "EUR", category: "Investment", description: "ETF dividend payout", date: d(5, 15) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 1100, currency: "EUR", category: "Housing", description: "Airbnb Lisbon — 1 month", date: d(5, 1) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 90, currency: "EUR", category: "Food & Dining", description: "Groceries — week", date: d(5, 4) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 125, currency: "EUR", category: "Coworking", description: "Coworking day passes", date: d(5, 6) }),
  tx({ wallet_id: W_USD, type: "expense", amount: 83, currency: "USD", category: "Health & Insurance", description: "SafetyWing insurance", date: d(5, 1) }),
  tx({ wallet_id: W_EUR, type: "expense", amount: 22, currency: "EUR", category: "Entertainment", description: "Spotify + Netflix", date: d(5, 1) }),
];
