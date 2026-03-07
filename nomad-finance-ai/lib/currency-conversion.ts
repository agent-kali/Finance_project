import {
  EXCHANGE_RATES,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/constants";

const STORAGE_KEY = "nomad-finance-frankfurter-rates";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const API_BASE = "https://api.frankfurter.dev/v1";

type CacheEntry = {
  rates: Record<string, number>;
  base: string;
  date: string;
  fetchedAt: number;
};

let memoryCache: CacheEntry | null = null;

function loadFromStorage(): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CacheEntry;
    if (!data.rates || !data.base || !data.fetchedAt) return null;
    if (Date.now() - data.fetchedAt > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function saveToStorage(entry: CacheEntry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

/**
 * Merges Frankfurter rates with static EXCHANGE_RATES for unsupported currencies (VND, AED, etc.)
 */
function mergeRates(
  frankfurterRates: Record<string, number>,
  base: string
): Record<string, number> {
  const merged = { ...frankfurterRates };
  for (const code of SUPPORTED_CURRENCIES) {
    if (!(code in merged)) {
      // Frankfurter doesn't support this currency; use static fallback
      const staticRate = EXCHANGE_RATES[code as SupportedCurrency];
      if (staticRate !== undefined) {
        merged[code] = staticRate;
      }
    }
  }
  // Ensure base is 1
  if (base in merged) merged[base] = 1;
  else merged[base] = 1;
  return merged;
}

/**
 * Fetches exchange rates from Frankfurter API and caches in memory + localStorage for 24h.
 * Merges with EXCHANGE_RATES for unsupported currencies (VND, AED).
 */
export async function getExchangeRates(base: string = "EUR"): Promise<{
  rates: Record<string, number>;
  date: string;
}> {
  const cached = memoryCache ?? loadFromStorage();
  if (cached && cached.base === base && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { rates: cached.rates, date: cached.date };
  }

  try {
    const url = `${API_BASE}/latest?base=${base}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
    const data = (await res.json()) as {
      base: string;
      date: string;
      rates: Record<string, number>;
    };
    const rates = mergeRates(data.rates ?? {}, data.base ?? base);
    const entry: CacheEntry = {
      rates,
      base: data.base ?? base,
      date: data.date ?? new Date().toISOString().split("T")[0],
      fetchedAt: Date.now(),
    };
    memoryCache = entry;
    saveToStorage(entry);
    return { rates: entry.rates, date: entry.date };
  } catch {
    // Fallback: build rates from static EXCHANGE_RATES (EUR-based)
    const fallbackRates: Record<string, number> = {};
    for (const code of SUPPORTED_CURRENCIES) {
      fallbackRates[code] = EXCHANGE_RATES[code];
    }
    fallbackRates.EUR = 1;
    const entry: CacheEntry = {
      rates: fallbackRates,
      base: "EUR",
      date: new Date().toISOString().split("T")[0],
      fetchedAt: Date.now(),
    };
    memoryCache = entry;
    return { rates: entry.rates, date: entry.date };
  }
}

/**
 * Initializes the in-memory rates cache from prefetched/hydrated data.
 * Call this when React Query hydrates exchange rates so convert() uses the same
 * rates on client as server, avoiding hydration mismatch.
 */
export function initRatesFromData(
  rates: Record<string, number>,
  base: string,
  date: string
): void {
  memoryCache = {
    rates,
    base,
    date,
    fetchedAt: Date.now(),
  };
}

/**
 * Converts amount from one currency to another. Sync; uses in-memory or localStorage cache.
 * Same currency returns amount unchanged. Fallback to EXCHANGE_RATES if cache empty.
 */
export function convert(
  amount: number,
  from: string,
  to: string
): number {
  if (from === to) return amount;

  const cached = memoryCache ?? loadFromStorage();
  const rates = cached?.rates ?? EXCHANGE_RATES as Record<string, number>;
  const base = cached?.base ?? "EUR";

  // rates[code] = units of code per 1 base
  const fromRate = rates[from];
  const toRate = rates[to];
  if (fromRate === undefined || toRate === undefined) {
    // Fallback to static rates
    const fromStatic = EXCHANGE_RATES[from as SupportedCurrency];
    const toStatic = EXCHANGE_RATES[to as SupportedCurrency];
    if (fromStatic !== undefined && toStatic !== undefined) {
      const toEur = amount / fromStatic;
      return toEur * toStatic;
    }
    return amount; // 1:1 fallback if unknown
  }

  const toBase = from === base ? amount : amount / fromRate;
  return to === base ? toBase : toBase * toRate;
}
