"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useTimeRange, type TimeRange } from "@/lib/time-range-context";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { getDateRange } from "@/lib/date-utils";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";

function getPreviousPeriodRange(timeRange: TimeRange): { start: Date; end: Date } {
  const { start, end } = getDateRange(timeRange);
  const durationMs = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - durationMs - 1),
    end: new Date(start.getTime() - 1),
  };
}

export function AiInsightCard() {
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();

  const insight = useMemo(() => {
    if (!transactions?.length || !wallets?.length) return null;

    const convert = (amount: number, currency: string) =>
      convertCurrency(amount, currency as SupportedCurrency, displayCurrency);

    const { start, end } = getDateRange(timeRange);
    const prev = getPreviousPeriodRange(timeRange);
    const periodLabel = timeRange === "Today" ? "today" : timeRange === "This Week" ? "this week" : "this month";
    const previousLabel = timeRange === "Today" ? "last day" : timeRange === "This Week" ? "last week" : "last month";

    const currentExpenses = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d >= start && d <= end;
      })
      .reduce((s, t) => s + convert(t.amount, t.currency), 0);

    const currentIncomeTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === "income" && d >= start && d <= end;
    });

    const currentIncome = currentIncomeTransactions.reduce(
      (s, t) => s + convert(t.amount, t.currency),
      0
    );

    const previousExpenses = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d >= prev.start && d <= prev.end;
      })
      .reduce((s, t) => s + convert(t.amount, t.currency), 0);

    const currentByCategory: Record<string, number> = {};
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d >= start && d <= end;
      })
      .forEach((t) => {
        currentByCategory[t.category] =
          (currentByCategory[t.category] || 0) + convert(t.amount, t.currency);
      });

    const categories = Object.entries(currentByCategory).sort(
      (a, b) => b[1] - a[1]
    );
    const topCategory = categories[0];
    const topCategoryPct =
      topCategory && currentExpenses > 0
        ? Math.round((topCategory[1] / currentExpenses) * 100)
        : 0;

    if (currentIncome > 0 && currentExpenses === 0) {
      return `Perfect ${timeRange === "Today" ? "day" : timeRange === "This Week" ? "week" : "month"} — all income, zero expenses.`;
    }

    if (previousExpenses > 0 && currentExpenses > 0) {
      const change = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
      if (Math.abs(change) >= 10) {
        const direction = change < 0 ? "dropped" : "increased";
        return `Your spending ${direction} ${Math.abs(Math.round(change))}% compared to ${previousLabel}.`;
      }
    }

    if (topCategory && topCategoryPct >= 50) {
      return `${topCategory[0]} is ${topCategoryPct}% of your spending ${periodLabel}.`;
    }

    if (currentIncome > 0 && currentExpenses > currentIncome) {
      return `You're spending more than you earn ${periodLabel}. Consider reviewing your expenses.`;
    }

    if (currentIncome > 0) {
      return `Strong income ${timeRange === "Today" ? "day" : timeRange === "This Week" ? "week" : "period"} — ${formatCurrency(currentIncome, displayCurrency)} earned across ${currentIncomeTransactions.length} transaction${currentIncomeTransactions.length === 1 ? "" : "s"}.`;
    }

    if (topCategory && currentExpenses > 0) {
      return `${topCategory[0]} is driving most of your spending ${periodLabel}.`;
    }

    return null;
  }, [transactions, wallets, timeRange, displayCurrency]);

  if (txLoading || walletsLoading || !insight) return null;

  return (
    <Card className="glass-card">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <p className="min-w-0 flex-1 text-sm text-foreground">{insight}</p>
        <Link
          href="/ai-advisor"
          className="shrink-0 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Ask AI
        </Link>
      </CardContent>
    </Card>
  );
}
