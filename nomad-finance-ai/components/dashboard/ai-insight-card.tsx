"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
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

  const { insight, topCategory } = useMemo(() => {
    const convert = (amount: number, currency: string) =>
      convertCurrency(amount, currency as SupportedCurrency, displayCurrency);

    const periodLabel =
      timeRange === "Today" ? "today" : timeRange === "This Week" ? "this week" : "this month";
    const previousPeriodLabel =
      timeRange === "Today" ? "day" : timeRange === "This Week" ? "week" : "month";

    if (!transactions?.length) {
      return {
        insight: `No activity yet ${periodLabel}. Start tracking your finances.`,
        topCategory: null,
      };
    }

    const { start, end } = getDateRange(timeRange);
    const prev = getPreviousPeriodRange(timeRange);

    const currentExpenseTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d >= start && d <= end;
    });
    const currentExpenses = currentExpenseTransactions.reduce(
      (s, t) => s + convert(t.amount, t.currency),
      0
    );

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
    currentExpenseTransactions.forEach((t) => {
      currentByCategory[t.category] =
        (currentByCategory[t.category] || 0) + convert(t.amount, t.currency);
    });

    const categories = Object.entries(currentByCategory).sort(
      (a, b) => b[1] - a[1]
    );
    const topCat = categories[0]?.[0] ?? null;
    const topCategoryPct =
      categories[0] && currentExpenses > 0
        ? Math.round((categories[0][1] / currentExpenses) * 100)
        : 0;

    // (a) Zero expenses, positive income
    if (currentExpenses === 0 && currentIncome > 0) {
      return {
        insight: `Zero expenses ${periodLabel} \u2014 all income saved.`,
        topCategory: topCat,
      };
    }

    // (b) No activity at all in range
    if (currentExpenses === 0 && currentIncome === 0) {
      return {
        insight: `No activity yet ${periodLabel}. Start tracking your finances.`,
        topCategory: topCat,
      };
    }

    // (c) / (d) Expense change vs previous period
    if (previousExpenses > 0 && currentExpenses > 0) {
      const change =
        ((currentExpenses - previousExpenses) / previousExpenses) * 100;
      const changePct = Math.round(Math.abs(change));
      if (changePct > 0 && change < 0) {
        return {
          insight: `Your spending dropped ${changePct}% compared to last ${previousPeriodLabel}.`,
          topCategory: topCat,
        };
      }
      if (changePct > 0 && change > 0) {
        const driver = topCat ? ` \u2014 ${topCat} is the biggest driver.` : ".";
        return {
          insight: `Spending is up ${changePct}% this ${previousPeriodLabel}${driver}`,
          topCategory: topCat,
        };
      }
    }

    // (e) One category dominates
    if (categories[0] && topCategoryPct >= 50) {
      return {
        insight: `${categories[0][0]} accounts for ${topCategoryPct}% of your spending this ${previousPeriodLabel}.`,
        topCategory: topCat,
      };
    }

    // (f) Fallback — earned income
    if (currentIncome > 0) {
      const txCount = currentIncomeTransactions.length;
      return {
        insight: `You earned ${formatCurrency(currentIncome, displayCurrency)} across ${txCount} transaction${txCount === 1 ? "" : "s"} ${periodLabel}.`,
        topCategory: topCat,
      };
    }

    // Final safety net — always produce text
    return {
      insight: `Track your income and spending to unlock personalised insights.`,
      topCategory: topCat,
    };
  }, [transactions, timeRange, displayCurrency]);

  if (txLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 py-6 text-center">
        <Skeleton className="mx-auto h-5 w-5 rounded-full" />
        <Skeleton className="mx-auto h-4 w-72" />
        <div className="flex justify-center gap-2">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>
      </div>
    );
  }

  const pills = [
    { label: "Analyze spending", href: "/ai-advisor" },
    ...(topCategory
      ? [{ label: `Set budget for ${topCategory}`, href: "/ai-advisor" }]
      : [{ label: "Savings tips", href: "/ai-advisor" }]),
    { label: "Ask AI advisor", href: "/ai-advisor" },
  ];

  return (
    <section aria-label="AI insight" className="py-6">
      <div className="mx-auto w-full max-w-2xl space-y-5 text-center">
        <span className="block text-lg text-[#C9A96E]" aria-hidden="true">
          &#10022;
        </span>
        <p className="text-sm leading-relaxed italic text-[#C9A96E]">
          {insight}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {pills.map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              className="rounded-full border border-border/20 px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border/40 hover:text-foreground"
            >
              {pill.label}
            </Link>
          ))}
        </div>
        <hr className="border-border/15" />
      </div>
    </section>
  );
}
