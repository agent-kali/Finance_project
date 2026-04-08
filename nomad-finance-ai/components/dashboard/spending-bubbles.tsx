"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange } from "@/lib/time-range-context";
import { getDateRange } from "@/lib/date-utils";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";

const MAX_BUBBLE = 88;
const MIN_BUBBLE = 28;
const FLOAT_DURATIONS = [5, 6, 7, 8];

function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("transport")) return "\u{1F697}";
  if (lower.includes("food") || lower.includes("dining")) return "\u{1F37D}\u{FE0F}";
  if (lower.includes("coffee") || lower.includes("cafe")) return "\u2615";
  if (lower.includes("housing") || lower.includes("rent")) return "\u{1F3E0}";
  if (lower.includes("cowork")) return "\u{1F4BB}";
  if (lower.includes("health") || lower.includes("insurance")) return "\u{1F3E5}";
  if (lower.includes("entertain")) return "\u{1F3AC}";
  if (lower.includes("shop")) return "\u{1F6CD}\u{FE0F}";
  if (lower.includes("saas") || lower.includes("tool")) return "\u2699\u{FE0F}";
  if (lower.includes("travel")) return "\u2708\u{FE0F}";
  if (lower.includes("education")) return "\u{1F4DA}";
  if (lower.includes("utilit")) return "\u{1F4A1}";
  return "\u{1F4E6}";
}

function getCategoryRgb(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("transport")) return "184,149,106";
  if (lower.includes("food") || lower.includes("dining")) return "193,123,107";
  if (lower.includes("coffee") || lower.includes("cafe")) return "99,153,34";
  return "59,130,246";
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const bubbleEntrance: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

interface CategoryBubble {
  name: string;
  value: number;
  pct: number;
  size: number;
  emoji: string;
  rgb: string;
}

export function SpendingBubbles() {
  const { data: transactions } = useTransactions();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();

  const categories: CategoryBubble[] = useMemo(() => {
    const txs = transactions ?? [];
    const { start, end } = getDateRange(timeRange);
    const byCategory: Record<string, number> = {};

    for (const tx of txs) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.date);
      if (d < start || d > end) continue;
      const amount = convertCurrency(
        tx.amount,
        tx.currency as SupportedCurrency,
        displayCurrency,
      );
      byCategory[tx.category] = (byCategory[tx.category] || 0) + amount;
    }

    const entries = Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);

    const total = entries.reduce((s, e) => s + e.value, 0);
    const maxVal = entries[0]?.value ?? 0;

    return entries.map((entry) => ({
      ...entry,
      pct: total > 0 ? Math.round((entry.value / total) * 100) : 0,
      size:
        maxVal > 0
          ? Math.max(MIN_BUBBLE, (entry.value / maxVal) * MAX_BUBBLE)
          : MIN_BUBBLE,
      emoji: getCategoryEmoji(entry.name),
      rgb: getCategoryRgb(entry.name),
    }));
  }, [transactions, timeRange, displayCurrency]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(184,149,106,0.15)",
        borderRadius: 14,
        padding: 20,
      }}
    >
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

      {categories.length === 0 ? (
        <div
          style={{
            height: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(245,240,232,0.3)" }}>
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
            height: 160,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 16,
            marginTop: 12,
            overflow: "hidden",
          }}
        >
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              variants={bubbleEntrance}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
              }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
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
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: cat.size > 50 ? 16 : 12, lineHeight: 1 }}>
                  {cat.emoji}
                </span>
                {cat.size > 44 && (
                  <>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: `rgba(${cat.rgb}, 0.9)`,
                        lineHeight: 1,
                        marginTop: 2,
                      }}
                    >
                      {formatCurrency(cat.value, displayCurrency)}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        color: "rgba(245,240,232,0.4)",
                        lineHeight: 1,
                      }}
                    >
                      {cat.pct}%
                    </span>
                  </>
                )}
              </motion.div>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(245,240,232,0.4)",
                  textAlign: "center",
                  maxWidth: cat.size + 20,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
