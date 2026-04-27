import type { ParsedTransaction } from "../types";
import {
  parseAmount,
  parseCurrency,
  parseDate,
  pick,
  toCleanString,
} from "../normalize";

/**
 * Parse rows from a Revolut CSV export.
 *
 * Revolut columns: Type, Product, Started Date, Completed Date,
 * Description, Amount, Fee, Currency, State, Balance.
 *
 * Rules:
 * - Use Completed Date when available, otherwise fall back to Started Date.
 * - The `Amount` is already signed (negative for outflows).
 * - Skip rows whose State is not "COMPLETED" so pending / reverted entries
 *   never reach the user's ledger.
 * - Skip rows missing any of date / amount / currency.
 */
export function parseRevolutRows(
  rows: Record<string, unknown>[]
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    const state = toCleanString(pick(row, "State")).toUpperCase();
    if (state && state !== "COMPLETED") continue;

    const date =
      parseDate(pick(row, "Completed Date")) ??
      parseDate(pick(row, "Started Date"));
    const amount = parseAmount(pick(row, "Amount"));
    const currency = parseCurrency(pick(row, "Currency"));
    if (!date || amount === null || amount === 0 || !currency) continue;

    const description =
      toCleanString(pick(row, "Description")) ||
      toCleanString(pick(row, "Type")) ||
      "Revolut transaction";

    transactions.push({
      date,
      amount,
      currency,
      description,
      type: amount < 0 ? "expense" : "income",
    });
  }

  return transactions;
}
