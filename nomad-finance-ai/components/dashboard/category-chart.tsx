"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange } from "@/lib/time-range-context";
import { getDateRange, getPeriodLabel } from "@/lib/date-utils";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { PieChart } from "lucide-react";

const COLORS = [
  "#22d3ee",
  "#34d399",
  "#f59e0b",
  "#a78bfa",
  "#fb923c",
  "#fb7185",
  "#38bdf8",
  "#2dd4bf",
];

export function CategoryChart() {
  const { data: transactions, isLoading } = useTransactions();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();

  const listData = useMemo(() => {
    const txs = transactions ?? [];
    const { start, end } = getDateRange(timeRange);

    const byCategory: Record<string, number> = {};
    for (const tx of txs) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.date);
      if (d < start || d > end) continue;

      const amount = convertCurrency(tx.amount, tx.currency as SupportedCurrency, displayCurrency);
      byCategory[tx.category] = (byCategory[tx.category] || 0) + amount;
    }

    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, timeRange, displayCurrency]);

  const maxValue = listData.length > 0 ? listData[0].value : 0;

  const chartSummary =
    listData.length > 0
      ? `Spending by category: ${listData
          .slice(0, 5)
          .map((e) => `${e.name} ${formatCurrency(e.value, displayCurrency)}`)
          .join("; ")}${listData.length > 5 ? `. ${listData.length - 5} more categories.` : ""}`
      : null;

  if (isLoading) {
    return (
      <Card className="glass-card glass-card-chart rounded-2xl">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="min-h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card glass-card-hover glass-card-chart rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Spending by Category ({getPeriodLabel(timeRange)})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {listData.length === 0 ? (
          <EmptyState
            icon={PieChart}
            heading="No spending data"
            className="min-h-[200px]"
          />
        ) : (
          <div
            role="img"
            aria-label={`Spending by category for ${getPeriodLabel(timeRange)}`}
          >
            {chartSummary && <p className="sr-only">{chartSummary}</p>}
          <ul className="space-y-3">
            {listData.map((entry, i) => {
              const color = COLORS[i % COLORS.length];
              const pct = maxValue > 0 ? (entry.value / maxValue) * 100 : 0;
              return (
                <li
                  key={entry.name}
                  className="flex min-w-0 items-center gap-2 sm:gap-3"
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}40`,
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground sm:text-sm">
                    {entry.name}
                  </span>
                  <div className="flex w-12 shrink-0 items-center sm:w-20">
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="w-14 shrink-0 text-right text-sm font-medium tabular-nums text-foreground sm:w-20"
                    title="Converted at Frankfurter rate"
                  >
                    {formatCurrency(entry.value, displayCurrency)}
                  </span>
                </li>
              );
            })}
          </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
