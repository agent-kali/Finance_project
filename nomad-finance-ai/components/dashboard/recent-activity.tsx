"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange } from "@/lib/time-range-context";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";
import type { Transaction } from "@/types/database.types";
import { Activity } from "lucide-react";

const CATEGORY_DOT_COLORS: Record<string, string> = {
  Housing: "#C9A96E",
  "Food & Dining": "#CC8844",
  Transportation: "#A89080",
  Coworking: "#8A9BAE",
  "Health & Insurance": "#7A9B6D",
  Entertainment: "#A78BA5",
  Shopping: "#CC8844",
  "SaaS & Tools": "#8A9BAE",
  Travel: "#C27C6B",
  Education: "#7A9B6D",
  Salary: "#7A9B6D",
  Freelance: "#A78BA5",
  Investment: "#C9A96E",
  Transfer: "#8A9BAE",
  Other: "#808080",
};

function getDotColor(category: string): string {
  return CATEGORY_DOT_COLORS[category] ?? "#808080";
}

function formatTime(tx: Transaction): string {
  const d = new Date(tx.date);
  const created = new Date(tx.created_at);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = created.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return timeStr;
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

function getMerchant(tx: Transaction): string {
  if (tx.description?.trim()) {
    const firstPart = tx.description.split("—")[0]?.trim() ?? tx.description;
    return firstPart.length > 40 ? firstPart.slice(0, 37) + "\u2026" : firstPart;
  }
  return tx.category;
}

export function RecentActivity() {
  const { data: transactions, isLoading } = useTransactions();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();

  const recent = useMemo(() => {
    if (!transactions?.length) return [];
    const sorted = [...transactions].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da !== db) return db - da;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return sorted.slice(0, 5);
  }, [transactions]);

  if (timeRange === "This Month") return null;

  if (isLoading) {
    return (
      <Card className="glass-card min-h-[280px]">
        <CardHeader>
          <Skeleton className="h-3 w-36" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-0 divide-y divide-border/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (recent.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Recent Activity
          </CardTitle>
          <Link href="/transactions" className="text-xs font-medium text-primary">
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={Activity}
            heading="No recent activity"
            subtext="Your latest transactions will appear here"
            ctaLabel="Add transaction"
            ctaHref="/transactions?action=create"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Recent Activity
        </CardTitle>
        <Link href="/transactions" className="text-xs font-medium text-primary">
          View all &rarr;
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/30">
          {recent.map((tx) => {
            const isOptimistic = tx.id.startsWith("temp-");
            const merchant = getMerchant(tx);
            const showCategory = merchant !== tx.category;
            return (
              <li
                key={tx.id}
                className={cn(
                  "flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-opacity",
                  isOptimistic && "animate-pulse pointer-events-none opacity-50"
                )}
              >
                <div
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getDotColor(tx.category) }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {merchant}
                  </span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-muted-foreground">
                    {showCategory && <span>{tx.category}</span>}
                    {showCategory && <span aria-hidden>&middot;</span>}
                    <span className="shrink-0 tabular-nums">{formatTime(tx)}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap text-right text-sm font-medium tabular-nums ${
                    tx.type === "income" ? "text-primary" : "text-foreground"
                  }`}
                >
                  <span className="sr-only">
                    {tx.type === "income" ? "Income" : "Expense"}{" "}
                  </span>
                  {tx.type === "income" ? "+" : "\u2212"}
                  {formatCurrency(
                    convertCurrency(tx.amount, tx.currency as SupportedCurrency, displayCurrency),
                    displayCurrency
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {recent.length <= 2 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Add more transactions to see trends and insights.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
