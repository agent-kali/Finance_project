"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange } from "@/lib/time-range-context";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { getDateRange } from "@/lib/date-utils";
import { convertCurrency, formatCurrency, formatForCard } from "@/lib/currency";
import { CURRENCY_SYMBOLS, type SupportedCurrency } from "@/lib/constants";

/* ─── Currency flag map ─────────────────────────────────────── */
const CURRENCY_FLAGS: Record<SupportedCurrency, string> = {
  EUR: "🇪🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  VND: "🇻🇳",
  PLN: "🇵🇱",
  THB: "🇹🇭",
  IDR: "🇮🇩",
  MYR: "🇲🇾",
  SGD: "🇸🇬",
  JPY: "🇯🇵",
  TRY: "🇹🇷",
  AED: "🇦🇪",
  MXN: "🇲🇽",
  BRL: "🇧🇷",
  CHF: "🇨🇭",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  HKD: "🇭🇰",
  KRW: "🇰🇷",
  INR: "🇮🇳",
  PHP: "🇵🇭",
  NZD: "🇳🇿",
  ZAR: "🇿🇦",
};

/* ─── Category helpers ──────────────────────────────────────── */
function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("transport")) return "🚗";
  if (lower.includes("food") || lower.includes("dining")) return "🍽️";
  if (lower.includes("coffee") || lower.includes("cafe")) return "☕";
  if (lower.includes("housing") || lower.includes("rent")) return "🏠";
  if (lower.includes("cowork")) return "💻";
  if (lower.includes("health") || lower.includes("insurance")) return "🏥";
  if (lower.includes("entertain")) return "🎬";
  if (lower.includes("shop")) return "🛍️";
  if (lower.includes("saas") || lower.includes("tool")) return "⚙️";
  if (lower.includes("travel")) return "✈️";
  if (lower.includes("education")) return "📚";
  if (lower.includes("utilit")) return "💡";
  return "📦";
}

function getCategoryRgb(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("transport")) return "184,149,106";
  if (lower.includes("food") || lower.includes("dining")) return "193,123,107";
  if (lower.includes("coffee") || lower.includes("cafe")) return "99,153,34";
  if (lower.includes("housing") || lower.includes("rent")) return "147,112,219";
  if (lower.includes("entertain")) return "236,72,153";
  if (lower.includes("health")) return "34,197,94";
  return "59,130,246";
}

function getCategoryAlias(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("food") || lower.includes("dining")) return "Food";
  if (lower.includes("transport")) return "Transport";
  if (lower.includes("coffee") || lower.includes("cafe")) return "Coffee";
  if (lower.includes("housing") || lower.includes("rent")) return "Housing";
  if (lower.includes("cowork")) return "Cowork";
  if (lower.includes("health") || lower.includes("insurance")) return "Health";
  if (lower.includes("entertain")) return "Fun";
  if (lower.includes("shop")) return "Shopping";
  if (lower.includes("saas") || lower.includes("tool")) return "Tools";
  if (lower.includes("travel")) return "Travel";
  if (lower.includes("education")) return "Learning";
  if (lower.includes("utilit")) return "Utilities";
  return category
    .replace(/[&/]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ─── Types ─────────────────────────────────────────────────── */
interface BubbleData {
  name: string;
  alias: string;
  emoji: string;
  rgb: string;
  value: number;
  pct: number;
  size: number;
  txCount: number;
  delta: number;
}

interface WalletRow {
  label: string;
  flag: string;
  currency: SupportedCurrency;
  originalBalance: number;
  comparableBalance: number;
  barWidth: number;
}

/* ─── Animation variants ─────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const bubbleVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

const FLOAT_DURATIONS = [5, 6, 7, 8];
const MAX_BUBBLE = 120;
const MID_BUBBLE = 88;
const MIN_BUBBLE = 64;

/* ─── SVG trend ring ─────────────────────────────────────────── */
function TrendRing({
  size,
  pct,
  rgb,
}: {
  size: number;
  pct: number;
  rgb: string;
}) {
  const outerSize = size + 16;
  const r = outerSize / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const dash = Math.max(0, (pct / 100) * circumference);

  return (
    <svg
      width={outerSize}
      height={outerSize}
      style={{
        position: "absolute",
        top: -8,
        left: -8,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {/* track */}
      <circle
        cx={outerSize / 2}
        cy={outerSize / 2}
        r={r}
        fill="none"
        stroke={`rgba(${rgb}, 0.12)`}
        strokeWidth={3}
      />
      {/* fill */}
      <circle
        cx={outerSize / 2}
        cy={outerSize / 2}
        r={r}
        fill="none"
        stroke={`rgba(${rgb}, 0.55)`}
        strokeWidth={3}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${outerSize / 2} ${outerSize / 2})`}
      />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function BottomInsightsCard() {
  const { data: transactions } = useTransactions();
  const { data: wallets } = useWallets();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();
  const prefersReducedMotion = useReducedMotion();

  /* ── Category bubbles ──────────────────────────────────────── */
  const { bubbles, totalSpend } = useMemo(() => {
    const txs = transactions ?? [];
    const { start, end } = getDateRange(timeRange);

    const byCategory: Record<string, number> = {};
    const countByCategory: Record<string, number> = {};

    for (const tx of txs) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.date);
      if (d < start || d > end) continue;
      const amount = convertCurrency(
        tx.amount,
        tx.currency as SupportedCurrency,
        displayCurrency,
      );
      byCategory[tx.category] = (byCategory[tx.category] ?? 0) + amount;
      countByCategory[tx.category] = (countByCategory[tx.category] ?? 0) + 1;
    }

    // Yesterday by category
    const now = new Date();
    const yesterdayKey = toDateKey(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
    );
    const yesterdayByCategory: Record<string, number> = {};
    for (const tx of txs) {
      if (tx.type !== "expense") continue;
      if (toDateKey(new Date(tx.date)) !== yesterdayKey) continue;
      const amount = convertCurrency(
        tx.amount,
        tx.currency as SupportedCurrency,
        displayCurrency,
      );
      yesterdayByCategory[tx.category] =
        (yesterdayByCategory[tx.category] ?? 0) + amount;
    }

    const sorted = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);

    const total = sorted.reduce((s, e) => s + e.value, 0);

    const TOP = 3;
    const top3 = sorted.slice(0, TOP);
    const rest = sorted.slice(TOP);

    // Roll up "Other"
    const otherValue = rest.reduce((s, e) => s + e.value, 0);
    const otherCount = rest.reduce(
      (s, e) => s + (countByCategory[e.name] ?? 0),
      0,
    );

    const entries = [
      ...top3,
      ...(rest.length > 0
        ? [{ name: "Other", value: Math.round(otherValue * 100) / 100 }]
        : []),
    ];

    const result: BubbleData[] = entries.map((entry, idx) => {
      let size: number;
      if (idx === 0) size = MAX_BUBBLE;
      else if (idx === 1) size = MID_BUBBLE;
      else size = MIN_BUBBLE;

      const txCount =
        entry.name === "Other"
          ? otherCount
          : (countByCategory[entry.name] ?? 0);

      const yesterdayAmount =
        entry.name === "Other"
          ? rest.reduce((s, e) => s + (yesterdayByCategory[e.name] ?? 0), 0)
          : (yesterdayByCategory[entry.name] ?? 0);

      return {
        name: entry.name,
        alias: getCategoryAlias(entry.name),
        emoji: getCategoryEmoji(entry.name),
        rgb: getCategoryRgb(entry.name),
        value: entry.value,
        pct: total > 0 ? Math.round((entry.value / total) * 100) : 0,
        size,
        txCount,
        delta: Math.round((entry.value - yesterdayAmount) * 100) / 100,
      };
    });

    return { bubbles: result, totalSpend: Math.round(total * 100) / 100 };
  }, [transactions, timeRange, displayCurrency]);

  /* ── Wallet rows ───────────────────────────────────────────── */
  const walletRows = useMemo((): WalletRow[] => {
    if (!wallets?.length) return [];
    const comparableBalances = wallets.map((w) =>
      Math.max(
        convertCurrency(
          w.balance,
          w.currency as SupportedCurrency,
          displayCurrency,
        ),
        0,
      ),
    );
    const maxBalance = Math.max(...comparableBalances, 0);
    return wallets.map((w, i) => {
      const currency = w.currency as SupportedCurrency;
      const comparable = comparableBalances[i];
      return {
        label: `${currency} ${CURRENCY_SYMBOLS[currency] ?? ""}`.trim(),
        flag: CURRENCY_FLAGS[currency] ?? "🏳",
        currency,
        originalBalance: w.balance,
        comparableBalance: comparable,
        barWidth: maxBalance > 0 ? (comparable / maxBalance) * 100 : 0,
      };
    });
  }, [wallets, displayCurrency]);

  return (
    <div
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(184,149,106,0.15)",
        borderRadius: 14,
        display: "grid",
        gridTemplateColumns: "3fr 1px 2fr",
        minHeight: 260,
      }}
    >
      {/* ── LEFT: bubbles ─────────────────────────────────────── */}
      <div style={{ padding: 24 }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(184,149,106,0.6)",
                margin: 0,
              }}
            >
              WHERE IT WENT
            </p>
            <p
              style={{
                fontSize: 12,
                color: "rgba(245,240,232,0.35)",
                margin: "2px 0 0",
              }}
            >
              bigger bubble = more spent
            </p>
          </div>
          {totalSpend > 0 && (
            <p
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: "rgba(245,240,232,0.8)",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              {formatForCard(totalSpend, displayCurrency)}
            </p>
          )}
        </div>

        {/* Bubbles */}
        {bubbles.length === 0 ? (
          <div
            style={{
              height: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ fontSize: 13, color: "rgba(245,240,232,0.3)" }}>
              No spending data yet
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{
              width: "100%",
              height: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 32,
            }}
          >
            {bubbles.map((cat, i) => (
              <motion.div
                key={cat.name}
                variants={bubbleVariants}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {/* Bubble + ring wrapper */}
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <TrendRing size={cat.size} pct={cat.pct} rgb={cat.rgb} />
                  <motion.div
                    animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
                    transition={{
                      duration: FLOAT_DURATIONS[i % FLOAT_DURATIONS.length],
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.5,
                    }}
                    style={{
                      width: cat.size,
                      height: cat.size,
                      borderRadius: "50%",
                      background: `rgba(${cat.rgb}, 0.15)`,
                      border: `1px solid rgba(${cat.rgb}, 0.3)`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 6,
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>
                      {cat.emoji}
                    </span>
                    <span
                      style={{
                        marginTop: 3,
                        fontSize: 12,
                        fontWeight: 600,
                        color: `rgba(${cat.rgb}, 0.95)`,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatForCard(cat.value, displayCurrency)}
                    </span>
                    <span
                      style={{
                        marginTop: 2,
                        fontSize: 10,
                        color: "rgba(245,240,232,0.45)",
                        lineHeight: 1,
                      }}
                    >
                      {cat.pct}%
                    </span>
                  </motion.div>
                </div>

                {/* Context card below bubble */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(184,149,106,0.1)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    textAlign: "center",
                    minWidth: cat.size,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "rgba(245,240,232,0.75)",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: cat.size + 20,
                    }}
                  >
                    {cat.alias}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color:
                        cat.delta > 0
                          ? "rgba(248,113,113,0.9)"
                          : cat.delta < 0
                            ? "rgba(74,222,128,0.9)"
                            : "rgba(245,240,232,0.35)",
                      margin: "2px 0 0",
                    }}
                  >
                    {cat.delta > 0
                      ? `+${formatForCard(cat.delta, displayCurrency)} vs yday`
                      : cat.delta < 0
                        ? `${formatForCard(cat.delta, displayCurrency)} vs yday`
                        : "same as yday"}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "rgba(245,240,232,0.3)",
                      margin: "2px 0 0",
                    }}
                  >
                    {cat.txCount} tx
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── DIVIDER ───────────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(184,149,106,0.08)",
          width: 1,
          alignSelf: "stretch",
        }}
      />

      {/* ── RIGHT: wallet rows ────────────────────────────────── */}
      <div style={{ padding: 24 }}>
        <p
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(184,149,106,0.6)",
            margin: "0 0 18px",
          }}
        >
          WALLET BALANCES
        </p>

        {walletRows.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(245,240,232,0.3)" }}>
            No wallets yet
          </p>
        ) : (
          <div
            role="img"
            aria-label={`Wallet balances in ${displayCurrency}`}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            {walletRows.map((row, index) => (
              <div key={`${row.currency}-${index}`}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(245,240,232,0.55)",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{row.flag}</span>
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#f5f0e8",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(row.originalBalance, row.currency)}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    height: 4,
                    borderRadius: 100,
                    background: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={prefersReducedMotion ? false : { width: 0 }}
                    whileInView={{ width: `${row.barWidth}%` }}
                    viewport={{ once: true }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.8,
                      ease: "easeOut",
                      delay: prefersReducedMotion ? 0 : index * 0.15,
                    }}
                    style={{
                      height: "100%",
                      borderRadius: 100,
                      background: "linear-gradient(90deg, #b8956a, #d4b48a)",
                      minWidth: row.barWidth > 0 ? 4 : 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
