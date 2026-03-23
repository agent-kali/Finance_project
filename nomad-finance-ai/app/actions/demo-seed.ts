"use server";

import { createClient } from "@/lib/supabase/server";

const DEMO_WALLETS = [
  { currency: "EUR" as const, balance: 4250.0 },
  { currency: "USD" as const, balance: 2180.5 },
  { currency: "PLN" as const, balance: 8500.0 },
];

type Currency = "EUR" | "USD" | "VND" | "GBP" | "PLN";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateDemoTransactions(
  userId: string,
  walletMap: Record<string, { id: string; currency: Currency }>
) {
  const now = new Date();
  const txs: Array<{
    user_id: string;
    wallet_id: string;
    type: "income" | "expense";
    amount: number;
    currency: Currency;
    category: string;
    description: string;
    date: string;
  }> = [];

  const templates: Array<{
    type: "income" | "expense";
    category: string;
    desc: string;
    cur: Currency;
    amount: number;
  }> = [
    { type: "income", category: "Freelance", desc: "Client payment — website redesign", cur: "EUR", amount: 3200 },
    { type: "income", category: "Freelance", desc: "Logo design project", cur: "USD", amount: 850 },
    { type: "income", category: "Salary", desc: "Monthly retainer — consulting", cur: "EUR", amount: 2500 },
    { type: "income", category: "Investment", desc: "ETF dividend payout", cur: "EUR", amount: 120 },
    { type: "income", category: "Freelance", desc: "Mobile app UI contract", cur: "USD", amount: 1400 },
    { type: "income", category: "Transfer", desc: "Transfer from savings", cur: "PLN", amount: 2000 },
    { type: "expense", category: "Housing", desc: "Airbnb Lisbon — 1 month", cur: "EUR", amount: 1100 },
    { type: "expense", category: "Housing", desc: "Apartment Kraków", cur: "PLN", amount: 3200 },
    { type: "expense", category: "Coworking", desc: "WeWork day pass x5", cur: "EUR", amount: 125 },
    { type: "expense", category: "Food & Dining", desc: "Groceries — week", cur: "EUR", amount: 85 },
    { type: "expense", category: "Food & Dining", desc: "Restaurants & cafés", cur: "PLN", amount: 340 },
    { type: "expense", category: "Transportation", desc: "Ryanair — Lisbon to Kraków", cur: "EUR", amount: 89 },
    { type: "expense", category: "Transportation", desc: "Monthly metro pass", cur: "PLN", amount: 110 },
    { type: "expense", category: "Health & Insurance", desc: "SafetyWing insurance", cur: "USD", amount: 83 },
    { type: "expense", category: "SaaS & Tools", desc: "Figma + Notion + Vercel", cur: "USD", amount: 45 },
    { type: "expense", category: "Entertainment", desc: "Spotify + Netflix", cur: "EUR", amount: 22 },
    { type: "expense", category: "Shopping", desc: "New backpack for travel", cur: "EUR", amount: 79 },
    { type: "expense", category: "Travel", desc: "Weekend trip — Porto", cur: "EUR", amount: 210 },
    { type: "expense", category: "Education", desc: "Udemy course bundle", cur: "USD", amount: 29 },
    { type: "expense", category: "Utilities", desc: "Phone plan (eSIM)", cur: "EUR", amount: 15 },
  ];

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const count = 8 + Math.floor(Math.random() * 6);

    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const t = shuffled[i];
      const wallet = walletMap[t.cur];
      if (!wallet) continue;

      const day = 1 + Math.floor(Math.random() * 27);
      const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, day);
      if (d > now) d.setMonth(d.getMonth() - 1);

      const variance = 0.8 + Math.random() * 0.4;

      txs.push({
        user_id: userId,
        wallet_id: wallet.id,
        type: t.type,
        amount: Math.round(t.amount * variance * 100) / 100,
        currency: t.cur,
        category: t.category,
        description: t.desc,
        date: formatLocalDate(d),
      });
    }
  }

  const guaranteedRecent = [
    {
      type: "income" as const,
      category: "Freelance",
      description: "Rush homepage refresh",
      currency: "USD" as const,
      amount: 620,
      daysAgo: 0,
    },
    {
      type: "expense" as const,
      category: "Food & Dining",
      description: "Brunch with client",
      currency: "EUR" as const,
      amount: 46,
      daysAgo: 0,
    },
    {
      type: "expense" as const,
      category: "Transportation",
      description: "Metro and airport shuttle",
      currency: "EUR" as const,
      amount: 18,
      daysAgo: 0,
    },
    {
      type: "expense" as const,
      category: "SaaS & Tools",
      description: "Cursor + hosting top-up",
      currency: "USD" as const,
      amount: 31,
      daysAgo: 1,
    },
    {
      type: "expense" as const,
      category: "Coworking",
      description: "Half-day coworking pass",
      currency: "EUR" as const,
      amount: 27,
      daysAgo: 2,
    },
  ];

  for (const item of guaranteedRecent) {
    const wallet = walletMap[item.currency];
    if (!wallet) continue;

    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - item.daysAgo);
    txs.push({
      user_id: userId,
      wallet_id: wallet.id,
      type: item.type,
      amount: item.amount,
      currency: item.currency,
      category: item.category,
      description: item.description,
      date: formatLocalDate(d),
    });
  }

  return txs;
}

export async function seedDemoData() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Not authenticated");

  const userId = user.id;

  const { data: existingWallets } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existingWallets && existingWallets.length > 0) {
    return { seeded: false, message: "Data already exists" };
  }

  const walletInserts = DEMO_WALLETS.map((w) => ({
    user_id: userId,
    currency: w.currency,
    balance: w.balance,
  }));

  const { data: wallets, error: walletError } = await supabase
    .from("wallets")
    .insert(walletInserts)
    .select("id, currency");

  if (walletError) throw new Error(`Wallet seed failed: ${walletError.message}`);

  const walletMap: Record<string, { id: string; currency: Currency }> = {};
  for (const w of wallets ?? []) {
    walletMap[w.currency] = { id: w.id, currency: w.currency as Currency };
  }

  const transactions = generateDemoTransactions(userId, walletMap);

  const { error: txError } = await supabase
    .from("transactions")
    .insert(transactions);

  if (txError) throw new Error(`Transaction seed failed: ${txError.message}`);

  return { seeded: true, message: "Demo data created" };
}
