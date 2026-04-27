import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import {
  IMPORT_CATEGORIES,
  type ImportCategory,
  type ParsedTransaction,
} from "@/lib/csv/types";

const categorizationSchema = z.object({
  categories: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      category: z.enum(IMPORT_CATEGORIES),
      confidence: z.number().min(0).max(1),
    })
  ),
});

type Categorization = z.infer<typeof categorizationSchema>["categories"][number];

function fallback(transactions: ParsedTransaction[]): Categorization[] {
  return transactions.map((_, index) => ({
    index,
    category: "Other" as ImportCategory,
    confidence: 0,
  }));
}

function parseTransactions(raw: unknown): ParsedTransaction[] {
  if (!raw || typeof raw !== "object") return [];
  const transactions = (raw as { transactions?: unknown }).transactions;
  if (!Array.isArray(transactions)) return [];

  return transactions.filter((tx): tx is ParsedTransaction => {
    if (!tx || typeof tx !== "object") return false;
    const candidate = tx as Record<string, unknown>;
    return (
      typeof candidate.date === "string" &&
      typeof candidate.amount === "number" &&
      Number.isFinite(candidate.amount) &&
      typeof candidate.currency === "string" &&
      typeof candidate.description === "string" &&
      (candidate.type === "income" || candidate.type === "expense")
    );
  });
}

function buildPrompt(transactions: ParsedTransaction[]): string {
  const rows = transactions.map((tx, index) => ({
    index,
    date: tx.date.slice(0, 10),
    amount: tx.amount,
    currency: tx.currency,
    description: tx.description,
    type: tx.type,
  }));

  return `Categorize these imported personal finance transactions.

Return one category for every transaction index.
Allowed categories: ${IMPORT_CATEGORIES.join(", ")}.

Category guidance:
- Food: groceries, restaurants, cafes, delivery
- Transport: local transport, taxi, rideshare, train, fuel
- Shopping: retail purchases, clothing, electronics, general goods
- Entertainment: subscriptions, events, leisure, media
- Bills: utilities, phone, internet, rent-like recurring bills
- Health: medical, pharmacy, insurance, fitness
- Travel: flights, hotels, lodging, visas, travel activities
- Income: salary, freelance, payouts, dividends
- Transfer: wallet transfers, savings transfers, card top-ups, currency exchange
- Other: unclear or uncategorized

Transactions:
${JSON.stringify(rows, null, 2)}`;
}

export async function POST(request: Request) {
  let transactions: ParsedTransaction[] = [];

  try {
    const body = await request.json();
    transactions = parseTransactions(body);
    if (transactions.length === 0) {
      return Response.json([]);
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json(fallback(transactions));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
      const result = await generateObject({
        model: groq("llama-3.3-70b-versatile"),
        schema: categorizationSchema,
        abortSignal: controller.signal,
        prompt: buildPrompt(transactions),
      });

      clearTimeout(timeout);

      const byIndex = new Map(
        result.object.categories.map((item) => [item.index, item])
      );

      return Response.json(
        transactions.map((_, index) => {
          const item = byIndex.get(index);
          return (
            item ?? {
              index,
              category: "Other",
              confidence: 0,
            }
          );
        })
      );
    } catch {
      clearTimeout(timeout);
      return Response.json(fallback(transactions));
    }
  } catch {
    return Response.json(fallback(transactions));
  }
}
