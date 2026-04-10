"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { convertCurrency, formatCurrency, formatForCard } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";

const MAX_BUBBLE = 120;
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

export function SpendingBubbles() {
  const { data: transactions } = useTransactions();
  const displayCurrency = useDisplayCurrency();

  const { categories, total } = useMemo(() => {
    const txs = transactions ?? [];
    const byCategory: Record<string, number> = {};
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    for (const tx of txs) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.date);
      if (d < weekStart || d > now) continue;
      const amount = convertCurrency(
        tx.amount,
        tx.currency as SupportedCurrency,
        displayCurrency,
      );
      byCategory[tx.category] = (byCategory[tx.category] || 0) + amount;
    }

    const sortedEntries = Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);

    const limitedEntries =
      sortedEntries.length > 5
        ? [
            ...sortedEntries.slice(0, 4),
            {
              name: "Other",
              value:
                Math.round(
                  sortedEntries
                    .slice(4)
                    .reduce((sum, entry) => sum + entry.value, 0) * 100
                ) / 100,
            },
          ]
        : sortedEntries.slice(0, 5);

    const total = limitedEntries.reduce((sum, entry) => sum + entry.value, 0);
    const maxVal = limitedEntries[0]?.value ?? 0;

    const categories = limitedEntries.map((entry, index) => {
      let size = MAX_BUBBLE;
      if (index === 1) {
        size = maxVal > 0 ? Math.max(64, (entry.value / maxVal) * MAX_BUBBLE) : 64;
      } else if (index === 2) {
        size = maxVal > 0 ? Math.max(52, (entry.value / maxVal) * MAX_BUBBLE) : 52;
      } else if (index >= 3) {
        size = maxVal > 0 ? Math.max(44, (entry.value / maxVal) * MAX_BUBBLE) : 44;
      }

      return {
        ...entry,
        pct: total > 0 ? Math.round((entry.value / total) * 100) : 0,
        size,
        alias: getCategoryAlias(entry.name),
        emoji: getCategoryEmoji(entry.name),
        rgb: getCategoryRgb(entry.name),
      };
    });

    return { categories, total };
  }, [transactions, displayCurrency]);

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
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
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          this week &middot; {formatCurrency(total, displayCurrency)} total
        </p>
      </div>

      {categories.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 0",
            minHeight: 80,
          }}
        >
          <p style={{ fontSize: 14, color: "rgba(245,240,232,0.3)" }}>
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
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 20,
            padding: "20px 0",
          }}
        >
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              variants={bubbleEntrance}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                padding: 4,
                textAlign: "center",
              }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.emoji}</span>
                <span
                  style={{
                    marginTop: 3,
                    fontSize: 13,
                    fontWeight: 500,
                    color: `rgba(${cat.rgb}, 0.95)`,
                    lineHeight: 1,
                    maxWidth: cat.size - 10,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatForCard(cat.value, displayCurrency)}
                </span>
                <span
                  style={{
                    marginTop: 3,
                    fontSize: 10,
                    color: "rgba(245,240,232,0.72)",
                    lineHeight: 1.1,
                    maxWidth: cat.size - 14,
                  }}
                >
                  {cat.alias}
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

