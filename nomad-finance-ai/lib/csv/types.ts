/**
 * Supported CSV source formats.
 *
 * - `revolut`: Revolut bank export (Type, Product, Started Date, Completed Date,
 *   Description, Amount, Fee, Currency, ...).
 * - `wise`: Wise / TransferWise statement (TransferWise ID, Date, Amount,
 *   Currency, Description, ...).
 * - `generic`: any CSV that exposes at least date, amount and description.
 */
export type CSVFormat = "revolut" | "wise" | "generic";

export const IMPORT_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Travel",
  "Income",
  "Transfer",
  "Other",
] as const;

export type ImportCategory = (typeof IMPORT_CATEGORIES)[number];

/**
 * A normalized transaction row produced by a CSV parser.
 *
 * The shape is intentionally provider-agnostic so the same downstream
 * pipeline (validation, AI categorization, persistence) can consume rows
 * from any supported format.
 */
export type ParsedTransaction = {
  /** ISO 8601 date-time string (UTC). */
  date: string;
  /** Signed amount: negative for outflows / expenses, positive for inflows / income. */
  amount: number;
  /** ISO 4217 uppercase 3-letter currency code (e.g. "EUR"). */
  currency: string;
  /** Human-readable merchant or memo string. */
  description: string;
  /** Inferred transaction direction. */
  type: "income" | "expense";
  /** Category selected by AI or the user during import review. */
  category?: ImportCategory;
  /** AI confidence score from 0 to 1, if categorization has run. */
  confidence?: number;
  /** True when the user should manually review the suggested category. */
  needs_review?: boolean;
  /** Source-specific reference (e.g. Wise TransferWise ID), if available. */
  sourceReference?: string;
};

/**
 * Per-row error captured while parsing a CSV.
 *
 * `row` is 1-indexed relative to the data rows (header excluded), matching
 * what end users typically see in spreadsheets.
 */
export type ParseError = {
  row: number;
  message: string;
};

/**
 * Outcome of parsing a CSV file end-to-end.
 */
export type ParseResult = {
  transactions: ParsedTransaction[];
  errors: ParseError[];
  format: CSVFormat;
  totalRows: number;
};
