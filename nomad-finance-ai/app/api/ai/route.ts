import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";
import type { SupportedCurrency } from "@/lib/constants";
import { CURRENCY_SYMBOLS } from "@/lib/constants";

function buildSystemPrompt(
  transactions: Array<{
    type: string;
    amount: number;
    currency: string;
    category: string;
    date: string;
    description: string | null;
  }>,
  wallets: Array<{ currency: string; balance: number }>,
  primaryCurrency: string
) {
  const walletSummary = wallets
    .map(
      (w) =>
        `${w.currency} (${CURRENCY_SYMBOLS[w.currency as SupportedCurrency] ?? w.currency}${w.balance.toLocaleString()})`
    )
    .join(", ");

  const totalExpenses: Record<string, number> = {};
  const totalIncome: Record<string, number> = {};

  for (const tx of transactions) {
    const bucket = tx.type === "expense" ? totalExpenses : totalIncome;
    bucket[tx.category] = (bucket[tx.category] || 0) + tx.amount;
  }

  const expenseSummary = Object.entries(totalExpenses)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `${cat}: €${amt.toFixed(0)}`)
    .join(", ");

  const incomeSummary = Object.entries(totalIncome)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `${cat}: €${amt.toFixed(0)}`)
    .join(", ");

  return `You are a financial advisor specializing in digital nomads and EU tax compliance.
You give concise, practical, and actionable advice.

The user's primary currency is ${primaryCurrency}.
Their wallets: ${walletSummary || "none"}.

Recent financial data (last 30 transactions):
- Expense breakdown: ${expenseSummary || "no expenses recorded"}
- Income breakdown: ${incomeSummary || "no income recorded"}
- Total transactions analyzed: ${transactions.length}

Provide specific, actionable advice about:
1. Spending patterns and areas to optimize
2. Savings opportunities based on their actual data
3. Relevant EU tax considerations for digital nomads (tax residency, 183-day rule, etc.)
4. Currency management tips for multi-currency lifestyles

Be concise. Use bullet points. Reference their actual numbers. Do not hallucinate data they don't have.`;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return jsonError(
        "GROQ_API_KEY not configured. Add it to your .env.local to enable AI features.",
        503
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError("Unauthorized", 401);
    }

    let body: { messages?: Array<{ role: "user" | "assistant"; content: string }> };
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body", 400);
    }

    const messages = body.messages ?? [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonError("Messages are required", 400);
    }

    const [
      { data: transactions },
      { data: wallets },
      { data: profile },
    ] = await Promise.all([
      supabase
        .from("transactions")
        .select("type, amount, currency, category, date, description")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30),
      supabase
        .from("wallets")
        .select("currency, balance")
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("primary_currency")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: buildSystemPrompt(
        transactions ?? [],
        wallets ?? [],
        profile?.primary_currency ?? "EUR"
      ),
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return jsonError(message, 500);
  }
}
