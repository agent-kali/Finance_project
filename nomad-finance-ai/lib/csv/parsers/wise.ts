import type { ParsedTransaction } from "../types";
import {
  parseAmount,
  parseCurrency,
  parseDate,
  pick,
  toCleanString,
} from "../normalize";

/**
 * Parse rows from a Wise (TransferWise) CSV statement.
 *
 * Wise columns: TransferWise ID, Date, Amount, Currency, Description,
 * Payment Reference, Running Balance, Exchange From, Exchange To,
 * Exchange Rate, Payer Name, Payee Name, Payee Account Number, Merchant,
 * Card Last Four Digits, Total fees.
 *
 * Rules:
 * - The `Amount` is signed (negative for outflows).
 * - Skip rows missing any of date / amount / currency.
 * - When `Description` is empty, fall back to merchant or payee names so
 *   the resulting record stays human-readable.
 */
export function parseWiseRows(
  rows: Record<string, unknown>[]
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    const date = parseDate(pick(row, "Date"));
    const amount = parseAmount(pick(row, "Amount"));
    const currency = parseCurrency(pick(row, "Currency"));
    if (!date || amount === null || amount === 0 || !currency) continue;

    const description =
      toCleanString(pick(row, "Description")) ||
      toCleanString(pick(row, "Merchant")) ||
      toCleanString(pick(row, "Payee Name")) ||
      toCleanString(pick(row, "Payer Name")) ||
      "Wise transaction";

    const sourceReference =
      toCleanString(pick(row, "TransferWise ID")) || undefined;

    transactions.push({
      date,
      amount,
      currency,
      description,
      type: amount < 0 ? "expense" : "income",
      sourceReference,
    });
  }

  return transactions;
}
