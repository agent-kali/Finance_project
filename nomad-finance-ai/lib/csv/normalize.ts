/**
 * Internal helpers shared by the CSV parsers.
 * Not part of the public CSV import API.
 */

/**
 * Convert any string-like value into a finite number. Tolerates currency
 * symbols, surrounding whitespace, thousands separators, and parentheses
 * (which some banks use to denote negative amounts).
 *
 * Returns `null` if the input cannot be parsed.
 */
export function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let raw = String(value).trim();
  if (raw === "") return null;

  let isNegative = false;
  if (raw.startsWith("(") && raw.endsWith(")")) {
    isNegative = true;
    raw = raw.slice(1, -1);
  }

  const cleaned = raw.replace(/[^\d.,\-+]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "+") return null;

  // Heuristic: if both separators are present, assume the rightmost is the
  // decimal separator and the other is a thousands separator.
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  let normalized: string;
  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Only commas: treat single comma followed by ≤2 digits as decimal,
    // otherwise as thousands separator.
    const decimals = cleaned.length - lastComma - 1;
    if (cleaned.indexOf(",") === lastComma && decimals > 0 && decimals <= 2) {
      normalized = cleaned.replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else {
    normalized = cleaned;
  }

  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return isNegative ? -num : num;
}

/**
 * Normalize a date-like value to an ISO 8601 string. Accepts native Date
 * objects and a wide range of strings parsable by the JavaScript Date
 * constructor (ISO, RFC 2822, "YYYY-MM-DD HH:mm:ss", etc.).
 *
 * Returns `null` if the value cannot be parsed.
 */
export function parseDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const raw = String(value).trim();
  if (raw === "") return null;

  // Convert "YYYY-MM-DD HH:mm:ss" to ISO-compatible form.
  const isoish = raw.includes(" ") && !raw.includes("T")
    ? raw.replace(" ", "T")
    : raw;

  const parsed = new Date(isoish);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/**
 * Normalize a currency code to an uppercase 3-letter ISO 4217 string.
 * Returns `null` if the value isn't a valid 3-letter alphabetical code.
 */
export function parseCurrency(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : null;
}

/**
 * Coerce a value to a trimmed string, returning an empty string for
 * null/undefined.
 */
export function toCleanString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Look up a value in a row by matching one of several header aliases
 * case-insensitively. Returns the first non-empty match, or undefined.
 */
export function pick(
  row: Record<string, unknown>,
  ...aliases: string[]
): unknown {
  const lowerToOriginal = new Map<string, string>();
  for (const key of Object.keys(row)) {
    lowerToOriginal.set(key.toLowerCase(), key);
  }
  for (const alias of aliases) {
    const original = lowerToOriginal.get(alias.toLowerCase());
    if (original !== undefined) {
      const value = row[original];
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        return value;
      }
    }
  }
  return undefined;
}
