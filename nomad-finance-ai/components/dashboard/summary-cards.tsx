"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange } from "@/lib/time-range-context";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  getDateRange,
  getPeriodLabel,
  getSavingsSubtitle,
} from "@/lib/date-utils";
import { useCurrencyConversion } from "@/lib/currency-conversion-context";
import { convertCurrency, formatForCard } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import { DefaultWalletSelector } from "@/components/ui/default-wallet-selector";
import { cn } from "@/lib/utils";

type AccentKey = "cyan" | "emerald" | "amber" | "violet";

/** Left-edge neon: inset bar + glow. Hover = 1.5x glow opacity. */
const NEON_GLOW: Record<AccentKey, { rest: string; hover: string }> = {
  cyan: {
    rest: "inset 3px 0 0 #22d3ee, -2px 0 12px rgba(34,211,238,0.3)",
    hover: "inset 3px 0 0 #22d3ee, -2px 0 12px rgba(34,211,238,0.45)",
  },
  emerald: {
    rest: "inset 3px 0 0 #34d399, -2px 0 12px rgba(52,211,153,0.25)",
    hover: "inset 3px 0 0 #34d399, -2px 0 12px rgba(52,211,153,0.375)",
  },
  amber: {
    rest: "inset 3px 0 0 #f59e0b, -2px 0 12px rgba(245,158,11,0.25)",
    hover: "inset 3px 0 0 #f59e0b, -2px 0 12px rgba(245,158,11,0.375)",
  },
  violet: {
    rest: "inset 3px 0 0 #a78bfa, -2px 0 12px rgba(167,139,250,0.25)",
    hover: "inset 3px 0 0 #a78bfa, -2px 0 12px rgba(167,139,250,0.375)",
  },
};

const ICON_COLORS: Record<AccentKey, string> = {
  cyan: "text-cyan-400",
  emerald: "text-emerald-400",
  amber: "text-amber-500",
  violet: "text-violet-400",
} as const;

const SAVINGS_GOAL_PCT = 30;

function formatRatesDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Rates updated today";
  return `Rates from ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function SummaryCards() {
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();
  const { ratesDate } = useCurrencyConversion() ?? { ratesDate: null };
  const prefersReducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isLoading = walletsLoading || txLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 items-stretch min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card glass-card-hover flex flex-col h-full min-h-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent className="flex-1">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const periodLabel = getPeriodLabel(timeRange);
  const { start: rangeStart, end: rangeEnd } = getDateRange(timeRange);
  const { start: weekStart, end: weekEnd } = getDateRange("This Week");

  const totalBalance = (wallets ?? []).reduce(
    (sum, w) =>
      sum + convertCurrency(w.balance, w.currency as SupportedCurrency, displayCurrency),
    0
  );

  const rangeTransactions = (transactions ?? []).filter((t) => {
    const d = new Date(t.date);
    return d >= rangeStart && d <= rangeEnd;
  });

  const incomeInRange = rangeTransactions
    .filter((t) => t.type === "income")
    .reduce(
      (sum, t) =>
        sum + convertCurrency(t.amount, t.currency as SupportedCurrency, displayCurrency),
      0
    );

  const expensesInRange = rangeTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (sum, t) =>
        sum + convertCurrency(t.amount, t.currency as SupportedCurrency, displayCurrency),
      0
    );

  const savingsRate =
    incomeInRange > 0
      ? ((incomeInRange - expensesInRange) / incomeInRange) * 100
      : 0;

  const weekTransactions = (transactions ?? []).filter((t) => {
    const d = new Date(t.date);
    return d >= weekStart && d <= weekEnd;
  });
  const incomeThisWeek = weekTransactions
    .filter((t) => t.type === "income")
    .reduce(
      (sum, t) =>
        sum + convertCurrency(t.amount, t.currency as SupportedCurrency, displayCurrency),
      0
    );
  const expensesThisWeek = weekTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (sum, t) =>
        sum + convertCurrency(t.amount, t.currency as SupportedCurrency, displayCurrency),
      0
    );

  const totalBalanceFormatted = formatForCard(totalBalance, displayCurrency);
  const thisWeekIncomeFormatted = formatForCard(incomeThisWeek, displayCurrency);
  const thisWeekExpensesFormatted = formatForCard(expensesThisWeek, displayCurrency);

  const totalBalanceCard = {
    title: "Total Balance",
    value: totalBalanceFormatted,
    subtitle: `Across ${wallets?.length ?? 0} wallets`,
    icon: Banknote,
    accent: "cyan" as const,
    showDefaultWalletSelector: true,
  };

  const otherCards = [
    {
      title: `Income ${periodLabel}`,
      value: formatForCard(incomeInRange, displayCurrency),
      subtitle: `${rangeTransactions.filter((t) => t.type === "income").length} transactions`,
      icon: TrendingUp,
      accent: "emerald" as const,
      showDefaultWalletSelector: false,
    },
    {
      title: `Expenses ${periodLabel}`,
      value: formatForCard(expensesInRange, displayCurrency),
      subtitle: `${rangeTransactions.filter((t) => t.type === "expense").length} transactions`,
      icon: TrendingDown,
      accent: "amber" as const,
      showDefaultWalletSelector: false,
    },
    {
      title: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      subtitle: getSavingsSubtitle(timeRange, incomeInRange > 0),
      icon: PiggyBank,
      accent: "violet" as const,
      showDefaultWalletSelector: false,
    },
  ];

  const cards = [totalBalanceCard, ...otherCards];

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 items-stretch min-w-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {cards.map((card, i) => {
        const isTotalBalance = card.title === "Total Balance";
        const isIncome = card.title.startsWith("Income");
        const isExpenses = card.title.startsWith("Expenses");
        const isSavings = card.title === "Savings Rate";
        const hovered = hoveredIndex === i && !prefersReducedMotion;
        const glow = NEON_GLOW[card.accent];
        return (
          <motion.div
            key={card.title}
            className="min-w-0 h-full flex animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDuration: "400ms",
              animationDelay: `${i * 80}ms`,
              animationFillMode: "backwards",
            }}
            whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
            transition={{ type: "tween", duration: 0.2 }}
            onHoverStart={() => setHoveredIndex(i)}
            onHoverEnd={() => setHoveredIndex(null)}
          >
            <Card className="glass-card glass-card-hover relative min-h-0 overflow-hidden flex flex-col flex-1">
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-4 rounded-l-xl pointer-events-none"
                style={{ boxShadow: glow.rest }}
                animate={{
                  boxShadow: hovered ? glow.hover : glow.rest,
                }}
                transition={{ duration: 0.2 }}
                aria-hidden
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={cn("rounded-full bg-background/50 p-1.5 shrink-0", ICON_COLORS[card.accent])}>
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 flex flex-col">
                <div className="min-w-0 overflow-visible">
                  <div
                    key={displayCurrency}
                    className={cn(
                      "min-w-0 font-semibold tabular-nums text-foreground animate-in fade-in duration-200 tracking-tight wrap-break-word",
                      isTotalBalance
                        ? "text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl"
                        : "text-4xl"
                    )}
                    style={{ letterSpacing: "-1.5px" }}
                  >
                    {card.value}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.subtitle}
                  {"showDefaultWalletSelector" in card && card.showDefaultWalletSelector && ratesDate && (
                    <> • {formatRatesDate(ratesDate)}</>
                  )}
                </p>
                {isTotalBalance && ratesDate && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Converted at Frankfurter rate.
                  </p>
                )}
                {isIncome && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    This week: {thisWeekIncomeFormatted}
                  </p>
                )}
                {isExpenses && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    This week: {thisWeekExpensesFormatted}
                  </p>
                )}
                {isSavings && (
                  <div className="mt-2 w-full" role="progressbar" aria-valuenow={savingsRate} aria-valuemin={0} aria-valuemax={SAVINGS_GOAL_PCT} aria-label="Savings rate toward 30% goal">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-400 transition-[width] duration-200"
                        style={{ width: `${Math.min(100, (savingsRate / SAVINGS_GOAL_PCT) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Toward {SAVINGS_GOAL_PCT}% goal</p>
                  </div>
                )}
                {"showDefaultWalletSelector" in card && card.showDefaultWalletSelector && (wallets?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <DefaultWalletSelector variant="compact" showTooltip={true} />
                  </div>
                )}
                {"showDefaultWalletSelector" in card && card.showDefaultWalletSelector && (wallets?.length ?? 0) === 0 && (
                  <Button variant="link" asChild className="mt-2 h-auto p-0 text-xs font-medium text-muted-foreground hover:text-foreground">
                    <Link href="/wallets">Create a wallet to get started</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
