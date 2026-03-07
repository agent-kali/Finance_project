"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange, type TimeRange } from "@/lib/time-range-context";
import {
  getDateRange,
  getPeriodLabel,
  getSavingsSubtitle,
} from "@/lib/date-utils";
import { useCurrencyConversion } from "@/lib/currency-conversion-context";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import { DefaultWalletSelector } from "@/components/ui/default-wallet-selector";

const CARD_ACCENTS = {
  cyan: "border-l-2 border-l-cyan-400",
  emerald: "border-l-2 border-l-emerald-400",
  amber: "border-l-2 border-l-amber-500",
  violet: "border-l-2 border-l-violet-400",
} as const;

const ICON_COLORS = {
  cyan: "text-cyan-400",
  emerald: "text-emerald-400",
  amber: "text-amber-500",
  violet: "text-violet-400",
} as const;

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

  const isLoading = walletsLoading || txLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card glass-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
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

  const totalBalanceFormatted = formatCurrency(totalBalance, displayCurrency);

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
      value: formatCurrency(incomeInRange, displayCurrency),
      subtitle: `${rangeTransactions.filter((t) => t.type === "income").length} transactions`,
      icon: TrendingUp,
      accent: "emerald" as const,
      showDefaultWalletSelector: false,
    },
    {
      title: `Expenses ${periodLabel}`,
      value: formatCurrency(expensesInRange, displayCurrency),
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
          className="min-w-0"
        >
          <Card className={`glass-card glass-card-hover overflow-hidden ${CARD_ACCENTS[card.accent]}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-full bg-background/50 p-1.5 ${ICON_COLORS[card.accent]}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-w-0">
                <motion.div
                  key={displayCurrency}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0 truncate font-semibold tracking-tight text-foreground"
                  style={{ fontSize: "clamp(1.25rem, 4vw, 2.25rem)", letterSpacing: "-1.5px" }}
                  title={ratesDate ? `Converted at Frankfurter rate. ${formatRatesDate(ratesDate)}` : "Converted amount"}
                >
                  {card.value}
                </motion.div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.subtitle}
                {"showDefaultWalletSelector" in card && card.showDefaultWalletSelector && ratesDate && (
                  <> • <span title="Converted at Frankfurter rate">{formatRatesDate(ratesDate)}</span></>
                )}
              </p>
              {"showDefaultWalletSelector" in card && card.showDefaultWalletSelector && (wallets?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <DefaultWalletSelector variant="compact" showTooltip={true} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
