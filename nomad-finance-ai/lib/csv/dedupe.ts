import type { ParsedTransaction } from "./types";

/**
 * Build the canonical string fed into the hash.
 *
 * Each component is normalized so that semantically-identical rows imported
 * from different files produce the same hash:
 * - `date` is reduced to its YYYY-MM-DD calendar component (UTC).
 * - `amount` is rendered with two-decimal precision.
 * - `description` is lowercased and whitespace-collapsed.
 */
function canonicalString(tx: ParsedTransaction): string {
  const dateOnly = tx.date.slice(0, 10);
  const amount = tx.amount.toFixed(2);
  const description = tx.description.trim().toLowerCase().replace(/\s+/g, " ");
  return `${dateOnly}|${amount}|${description}`;
}

function bytesToHex(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < view.length; i++) {
    out += view[i].toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * Generate a deterministic external ID for a parsed transaction.
 *
 * The hash is SHA-256 over a canonical (date + amount + description) string
 * and is computed via the Web Crypto API so the function works in Edge,
 * Node 20+ and the browser without polyfills. The returned value is
 * lowercase hexadecimal.
 *
 * Uniqueness is enforced server-side via a partial unique index on
 * `(user_id, external_id)`.
 */
export async function generateExternalId(
  tx: ParsedTransaction
): Promise<string> {
  const data = new TextEncoder().encode(canonicalString(tx));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(digest);
}
