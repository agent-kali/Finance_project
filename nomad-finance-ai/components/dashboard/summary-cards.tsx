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

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div>
          <Skeleton className="h-14 w-72 sm:h-16 sm:w-96" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="rounded-2xl border border-border/30 bg-card/35 px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-3 divide-x divide-border/30">
          {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-6 sm:first:pl-0 sm:last:pr-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-6 w-16 sm:h-8 sm:w-28" />
            </div>
          ))}
          </div>
        </div>
      </div>
    );
  }

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

  const walletCount = wallets?.length ?? 0;
  const currencyCount = new Set(wallets?.map((w) => w.currency) ?? []).size;

  const contextParts: string[] = [];
  if (walletCount > 0) contextParts.push(`Across ${walletCount} wallet${walletCount !== 1 ? "s" : ""}`);
  if (currencyCount > 1) contextParts.push(`${currencyCount} currencies`);
  if (ratesDate) contextParts.push("Live rates");
  const contextLine = contextParts.join(" \u00B7 ");

  const metrics = [
    {
      id: "income",
      label: "Income",
      value: formatForCard(incomeInRange, displayCurrency),
    },
    {
      id: "expenses",
      label: "Expenses",
      value: formatForCard(expensesInRange, displayCurrency),
    },
    {
      id: "savings",
      label: (
        <>
          <span className="sm:hidden">Savings</span>
          <span className="hidden sm:inline">Savings rate</span>
        </>
      ),
      value: `${Math.round(savingsRate)}%`,
      savingsRate,
    },
  ];

  return (
    <div aria-live="polite" aria-atomic="true" className="space-y-12">
      {/* Hero balance */}
      <div>
        <div
          key={displayCurrency}
          className="text-5xl font-bold tabular-nums tracking-tighter text-foreground sm:text-6xl md:text-7xl"
        >
          {totalBalanceFormatted}
        </div>
        {contextLine ? <p className="mt-1 text-sm text-muted-foreground">{contextLine}</p> : null}
      </div>

      {/* Metrics row */}
      <div className="rounded-2xl border border-border/30 bg-card/35 px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-3 divide-x divide-border/30">
        {metrics.map((m, i) => (
          <div
            key={m.id}
            className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-6 sm:first:pl-0 sm:last:pr-0"
          >
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground sm:text-3xl">
              {m.value}
            </p>
            {m.savingsRate !== undefined && (
              <div
                className="mt-2 w-full"
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
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
