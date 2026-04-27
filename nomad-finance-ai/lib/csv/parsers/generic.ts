import type { ParsedTransaction } from "../types";
import {
  parseAmount,
  parseCurrency,
  parseDate,
  pick,
  toCleanString,
} from "../normalize";

/**
 * Parse rows from a generic CSV file.
 *
 * Required columns (case-insensitive): `date`, `amount`, `description`.
 * Optional column: `currency` (defaults to "EUR" when absent or invalid,
 * mirroring the app's primary currency convention).
 *
 * The amount column is treated as signed: negative values are expenses,
 * positive values are income. Rows missing a date, amount, or description
 * are skipped.
 */
export function parseGenericRows(
  rows: Record<string, unknown>[]
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    const date = parseDate(pick(row, "Date"));
    const amount = parseAmount(pick(row, "Amount"));
    const description = toCleanString(pick(row, "Description"));
    if (!date || amount === null || amount === 0 || description === "") continue;

    const currency = parseCurrency(pick(row, "Currency")) ?? "EUR";

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
