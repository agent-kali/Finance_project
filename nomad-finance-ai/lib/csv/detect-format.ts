import type { CSVFormat } from "./types";

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function hasAll(headers: Set<string>, required: string[]): boolean {
  return required.every((h) => headers.has(h));
}

/**
 * Detect a CSV format from its header row.
 *
 * Detection is case-insensitive and whitespace-insensitive. We look for the
 * canonical column set of each known provider; a generic fallback is used
 * whenever at least date + amount + description are present.
 *
 * @throws if the headers do not match any supported format.
 */
export function detectFormat(headers: string[]): CSVFormat {
  const normalized = new Set(headers.map(normalizeHeader));

  const revolutColumns = [
    "type",
    "product",
    "started date",
    "completed date",
    "description",
    "amount",
    "fee",
    "currency",
  ];
  if (hasAll(normalized, revolutColumns)) {
    return "revolut";
  }

  const wiseColumns = [
    "transferwise id",
    "date",
    "amount",
    "currency",
    "description",
  ];
  if (hasAll(normalized, wiseColumns)) {
    return "wise";
  }

  const genericColumns = ["date", "amount", "description"];
  if (hasAll(normalized, genericColumns)) {
    return "generic";
  }

  throw new Error(
    "Unrecognized CSV format. Expected at minimum date, amount and description columns."
  );
}
