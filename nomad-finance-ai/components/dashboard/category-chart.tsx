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

const ACCENT = "#2dd4bf";

function accentAtOpacity(opacity: number): string {
  return `rgba(45, 212, 191, ${opacity})`;
}

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
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 overflow-hidden">
        {listData.length === 0 ? (
          <EmptyState
            icon={PieChart}
            heading="No spending data"
            className="min-h-[300px]"
          />
        ) : (
          <div
            className="flex min-h-[300px] min-w-0 w-full flex-col justify-center"
            role="img"
            aria-label={`Spending by category for ${getPeriodLabel(timeRange)}`}
          >
            {chartSummary && <p className="sr-only">{chartSummary}</p>}
            <ul className="space-y-3">
              {listData.map((entry, i) => {
                const opacity = Math.max(0.2, 1 - i * 0.15);
                const color = i === 0 ? ACCENT : accentAtOpacity(opacity);
                const pct = maxValue > 0 ? (entry.value / maxValue) * 100 : 0;
                return (
                  <li
                    key={entry.name}
                    className="flex min-w-0 items-center gap-2 sm:gap-3"
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground sm:text-sm">
                      {entry.name}
                    </span>
                    <div className="flex w-12 shrink-0 items-center sm:w-20">
                      <div
                        className="h-1 w-full overflow-hidden rounded-full bg-muted/60"
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
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
