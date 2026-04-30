import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import {
  IMPORT_CATEGORIES,
  type ImportCategory,
  type ParsedTransaction,
} from "@/lib/csv/types";

type Categorization = {
  index: number;
  category: ImportCategory;
  confidence: number;
};

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
Return only valid JSON in this exact shape:
{"categories":[{"index":0,"category":"Food","confidence":0.9}]}

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

function stripMarkdownCodeFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseCategorizationResponse(raw: string): Categorization[] {
  const parsed = JSON.parse(stripMarkdownCodeFence(raw)) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Categorization response is not an object");
  }

  const categories = (parsed as { categories?: unknown }).categories;
  if (!Array.isArray(categories)) {
    throw new Error("Categorization response is missing categories array");
  }

  return categories.map((item, position) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Categorization item ${position} is not an object`);
    }

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.index !== "number" ||
      !Number.isInteger(candidate.index) ||
      candidate.index < 0
    ) {
      throw new Error(`Categorization item ${position} has an invalid index`);
    }

    if (
      typeof candidate.category !== "string" ||
      !IMPORT_CATEGORIES.includes(candidate.category as ImportCategory)
    ) {
      throw new Error(`Categorization item ${position} has an invalid category`);
    }

    if (
      typeof candidate.confidence !== "number" ||
      !Number.isFinite(candidate.confidence)
    ) {
      throw new Error(`Categorization item ${position} has an invalid confidence`);
    }

    return {
      index: candidate.index,
      category: candidate.category as ImportCategory,
      confidence: Math.min(1, Math.max(0, candidate.confidence)),
    };
  });
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
      const result = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        abortSignal: controller.signal,
        prompt: buildPrompt(transactions),
      });

      clearTimeout(timeout);
      const categories = parseCategorizationResponse(result.text);

      const byIndex = new Map(
        categories.map((item) => [item.index, item])
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
    } catch (error) {
      clearTimeout(timeout);
      console.error("[categorize] Failed to categorize transactions", error);
      return Response.json(fallback(transactions));
    }
  } catch {
    return Response.json(fallback(transactions));
  }
}
