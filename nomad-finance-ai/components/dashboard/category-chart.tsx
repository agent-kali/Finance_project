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

const SEGMENT_COLORS = [
  "#C9A96E",
  "#C27C6B",
  "#7A9B6D",
  "#A78BA5",
  "#CC8844",
  "#8A9BAE",
  "#A89080",
];

export function CategoryChart() {
  const { data: transactions, isLoading } = useTransactions();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();
  const periodText =
    timeRange === "Today" ? "today" : timeRange === "This Week" ? "this week" : "this month";

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

  const total = listData.reduce((s, d) => s + d.value, 0);

  const chartSummary =
    listData.length > 0
      ? `Spending by category: ${listData
          .slice(0, 5)
          .map((e) => `${e.name} ${formatCurrency(e.value, displayCurrency)}`)
          .join("; ")}${listData.length > 5 ? `. ${listData.length - 5} more categories.` : ""}`
      : null;

  if (isLoading) {
    return (
      <Card className="glass-card flex h-full min-h-[360px] flex-col">
        <CardHeader>
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="min-h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card flex h-full min-h-[360px] flex-col">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 overflow-hidden">
        {listData.length === 0 ? (
          <EmptyState
            icon={PieChart}
            heading="No spending data"
            className="min-h-[300px]"
          />
        ) : listData.length === 1 ? (
          <div className="flex min-h-[300px] w-full flex-col items-center justify-center text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              All spending {periodText}:{" "}
              <span className="font-medium text-foreground">
                {listData[0].name} - {formatCurrency(listData[0].value, displayCurrency)}
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Add more transactions to see category breakdown.
            </p>
          </div>
        ) : (
          <div
            className="flex min-h-[300px] min-w-0 w-full flex-col justify-center gap-6"
            role="img"
            aria-label={`Spending by category for ${getPeriodLabel(timeRange)}`}
          >
            {chartSummary && <p className="sr-only">{chartSummary}</p>}

            {/* Horizontal stacked bar */}
            <div className="flex h-6 w-full overflow-hidden rounded-md" role="presentation">
              {listData.map((entry, i) => {
                const pct = total > 0 ? (entry.value / total) * 100 : 0;
                if (pct < 0.5) return null;
                return (
                  <div
                    key={entry.name}
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                    }}
                    title={`${entry.name}: ${formatCurrency(entry.value, displayCurrency)}`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {listData.slice(0, 6).map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
              {listData.length > 6 && (
                <span className="text-xs text-muted-foreground">
                  +{listData.length - 6} more
                </span>
              )}
            </div>

            {/* Detailed list */}
            <ul className="space-y-2">
              {listData.map((entry, i) => {
                const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                return (
                  <li
                    key={entry.name}
                    className="flex min-w-0 items-center gap-2 sm:gap-3"
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground sm:text-sm">
                      {entry.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
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
