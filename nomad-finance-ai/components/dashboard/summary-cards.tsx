"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange } from "@/lib/time-range-context";
import {
  getDateRange,
  getPeriodLabel,
  getSavingsSubtitle,
} from "@/lib/date-utils";
import { useCurrencyConversion } from "@/lib/currency-conversion-context";
import { convertCurrency, formatForCard } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";

const SAVINGS_GOAL_PCT = 30;

export function SummaryCards() {
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();
  const { ratesDate } = useCurrencyConversion() ?? { ratesDate: null };

  const isLoading = walletsLoading || txLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-14 w-72 sm:h-16 sm:w-96" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-0 sm:divide-x sm:divide-border/30">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sm:px-6 first:sm:pl-0 last:sm:pr-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-28" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
          ))}
        </div>
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

  const walletCount = wallets?.length ?? 0;
  const currencyCount = new Set(wallets?.map((w) => w.currency) ?? []).size;

  const contextParts: string[] = [];
  if (walletCount > 0) contextParts.push(`Across ${walletCount} wallet${walletCount !== 1 ? "s" : ""}`);
  if (currencyCount > 1) contextParts.push(`${currencyCount} currencies`);
  if (ratesDate) contextParts.push("Live rates");
  const contextLine = contextParts.join(" \u00B7 ");

  const metrics = [
    {
      label: `Income ${periodLabel.toLowerCase()}`,
      value: formatForCard(incomeInRange, displayCurrency),
      detail: `${rangeTransactions.filter((t) => t.type === "income").length} transactions`,
      extra: `This week: ${thisWeekIncomeFormatted}`,
    },
    {
      label: `Expenses ${periodLabel.toLowerCase()}`,
      value: formatForCard(expensesInRange, displayCurrency),
      detail: `${rangeTransactions.filter((t) => t.type === "expense").length} transactions`,
      extra: `This week: ${thisWeekExpensesFormatted}`,
    },
    {
      label: "Savings rate",
      value: `${savingsRate.toFixed(1)}%`,
      detail: getSavingsSubtitle(timeRange, incomeInRange > 0),
      extra: null as string | null,
      savingsRate,
    },
  ];

  return (
    <div aria-live="polite" aria-atomic="true" className="space-y-6">
      {/* Hero balance */}
      <div>
        <div
          key={displayCurrency}
          className="text-5xl font-bold tabular-nums tracking-tighter text-foreground sm:text-6xl md:text-7xl"
        >
          {totalBalanceFormatted}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {contextLine}
          {walletCount > 0 && (
            <>
              {" \u00B7 "}
              <Link href="/wallets" className="underline-offset-2 hover:underline hover:text-foreground transition-colors">
                View wallets
              </Link>
            </>
          )}
          {walletCount === 0 && (
            <>
              {" "}
              <Link href="/wallets" className="underline-offset-2 hover:underline hover:text-foreground transition-colors">
                Create a wallet to get started
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Metrics row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-0 sm:divide-x sm:divide-border/30">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className="min-w-0 sm:px-6 first:sm:pl-0 last:sm:pr-0"
          >
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
              {m.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.detail}</p>
            {m.extra && (
              <p className="text-xs text-muted-foreground">{m.extra}</p>
            )}
            {m.savingsRate !== undefined && (
              <div
                className="mt-2 w-full max-w-[200px]"
                role="progressbar"
                aria-valuenow={m.savingsRate}
                aria-valuemin={0}
                aria-valuemax={SAVINGS_GOAL_PCT}
                aria-label="Savings rate toward 30% goal"
              >
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-[width] duration-200"
                    style={{ width: `${Math.min(100, (m.savingsRate / SAVINGS_GOAL_PCT) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Toward {SAVINGS_GOAL_PCT}% goal
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
