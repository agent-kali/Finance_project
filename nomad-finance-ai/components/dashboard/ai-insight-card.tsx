"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTransactions } from "@/lib/hooks/use-transactions";
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
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();

  const insight = useMemo(() => {
    if (!transactions?.length) return null;

    const convert = (amount: number, currency: string) =>
      convertCurrency(amount, currency as SupportedCurrency, displayCurrency);

    const { start, end } = getDateRange(timeRange);
    const prev = getPreviousPeriodRange(timeRange);
    const periodLabel = timeRange === "Today" ? "today" : timeRange === "This Week" ? "this week" : "this month";
    const previousLabel =
      timeRange === "Today" ? "the previous day" : timeRange === "This Week" ? "last week" : "last month";

    const currentExpenseTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d >= start && d <= end;
    });
    const currentExpenses = currentExpenseTransactions
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

    const savingsRate =
      currentIncome > 0 ? Math.round(((currentIncome - currentExpenses) / currentIncome) * 100) : 0;

    const currentByCategory: Record<string, number> = {};
    currentExpenseTransactions.forEach((t) => {
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

    if (previousExpenses > 0 && currentExpenses > 0) {
      const change = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
      const changePct = Math.round(Math.abs(change));
      if (changePct > 0 && change < 0) {
        return `Your spending is down ${changePct}% compared to ${previousLabel}.`;
      }
      if (changePct > 0 && change > 0) {
        return topCategory
          ? `Spending is up ${changePct}% ${periodLabel}, and ${topCategory[0]} is the biggest driver.`
          : `Spending is up ${changePct}% ${periodLabel}.`;
      }
    }

    if (savingsRate === 100) {
      return `Zero expenses ${periodLabel} - all income saved.`;
    }

    if (topCategory && topCategoryPct >= 50) {
      return `${topCategory[0]} accounts for ${topCategoryPct}% of your spending.`;
    }

    if (currentIncome > 0) {
      return `You earned ${formatCurrency(currentIncome, displayCurrency)} across ${currentIncomeTransactions.length} transaction${currentIncomeTransactions.length === 1 ? "" : "s"} ${periodLabel}.`;
    }

    return null;
  }, [transactions, timeRange, displayCurrency]);

  if (txLoading || !insight) return null;

  return (
    <div className="w-full max-w-2xl">
      <Card className="glass-card">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="min-w-0 flex-1 text-sm text-foreground">{insight}</p>
          <Link
            href="/ai-advisor"
            className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Ask AI -&gt;
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
