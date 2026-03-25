"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange } from "@/lib/time-range-context";
import { getDateRange } from "@/lib/date-utils";
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

  const totalBalanceFormatted = formatForCard(totalBalance, displayCurrency);
  const incomeFormatted = formatForCard(incomeInRange, displayCurrency);
  const expensesFormatted = formatForCard(expensesInRange, displayCurrency);

  const walletCount = wallets?.length ?? 0;
  const currencyCount = new Set(wallets?.map((w) => w.currency) ?? []).size;

  const contextParts: string[] = [];
  if (walletCount > 0) contextParts.push(`Across ${walletCount} wallet${walletCount !== 1 ? "s" : ""}`);
  if (currencyCount > 1) contextParts.push(`${currencyCount} currencies`);
  if (ratesDate) contextParts.push("Live rates");
  const contextLine = contextParts.join(" \u00B7 ");

  const incomeTrend = incomeInRange >= 0;
  const expenseTrend = expensesInRange > 0;
  const savingsTrend = savingsRate >= 0;

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-4 h-16 w-72 sm:h-20 sm:w-96" />
          <Skeleton className="mt-3 h-4 w-56" />
        </div>
        <div className="mx-auto max-w-lg">
          <div className="grid grid-cols-3 divide-x divide-border/30">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-0 px-3 text-center first:pl-0 last:pr-0 sm:px-6">
                <Skeleton className="mx-auto h-3 w-16" />
                <Skeleton className="mx-auto mt-2 h-6 w-12 sm:h-8 sm:w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-live="polite" aria-atomic="true" className="space-y-12">
      {/* Hero balance with warm glow */}
      <div className="relative flex flex-col items-center text-center">
        <div className="balance-glow" aria-hidden="true" />
        <p className="relative z-10 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Balance
        </p>
        <div
          key={displayCurrency}
          className="relative z-10 mt-2 text-5xl font-light tabular-nums tracking-tight text-balance-cream sm:text-7xl md:text-8xl"
        >
          {totalBalanceFormatted}
        </div>
        {contextLine ? (
          <p className="relative z-10 mt-3 text-sm text-muted-foreground">{contextLine}</p>
        ) : null}
      </div>

      {/* Metrics row */}
      <div className="mx-auto max-w-lg">
        <div className="grid grid-cols-3 divide-x divide-border/30">
          <div className="min-w-0 px-3 text-center first:pl-0 last:pr-0 sm:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Income
            </p>
            <p
              className="mt-1 whitespace-nowrap text-base font-semibold tabular-nums text-foreground sm:text-xl"
            >
              {incomeFormatted}
              <span className={`ml-1 text-xs ${incomeTrend ? "text-primary" : "text-destructive/70"}`}>
                {incomeTrend ? "\u2191" : "\u2193"}
              </span>
            </p>
          </div>
          <div className="min-w-0 px-3 text-center sm:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Expenses
            </p>
            <p
              className="mt-1 whitespace-nowrap text-base font-semibold tabular-nums text-foreground sm:text-xl"
            >
              {expensesFormatted}
              <span className={`ml-1 text-xs ${expenseTrend ? "text-destructive/70" : "text-primary"}`}>
                {expenseTrend ? "\u2193" : "\u2191"}
              </span>
            </p>
          </div>
          <div className="min-w-0 px-3 text-center last:pr-0 sm:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              <span className="sm:hidden">Savings</span>
              <span className="hidden sm:inline">Savings</span>
            </p>
            <p
              className="mt-1 whitespace-nowrap text-base font-semibold tabular-nums text-foreground sm:text-xl"
            >
              {Math.round(savingsRate)}%
              <span className={`ml-1 text-xs ${savingsTrend ? "text-primary" : "text-destructive/70"}`}>
                {savingsTrend ? "\u2191" : "\u2193"}
              </span>
            </p>
            <div
              className="mt-2 w-full"
              role="progressbar"
              aria-valuenow={savingsRate}
              aria-valuemin={0}
              aria-valuemax={SAVINGS_GOAL_PCT}
              aria-label="Savings rate toward 30% goal"
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60 transition-[width] duration-200"
                  style={{ width: `${Math.min(100, (savingsRate / SAVINGS_GOAL_PCT) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
