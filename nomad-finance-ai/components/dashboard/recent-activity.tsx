"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange } from "@/lib/time-range-context";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";
import type { Transaction } from "@/types/database.types";

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
    return firstPart.length > 40 ? firstPart.slice(0, 37) + "…" : firstPart;
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
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recent.length === 0) {
    return (
      <Card className="glass-card glass-card-hover">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-center text-sm text-muted-foreground">
              No recent transactions
            </p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/transactions">Add transaction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/50">
          {recent.map((tx) => {
            const isOptimistic = tx.id.startsWith("temp-");
            return (
            <li
              key={tx.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0 transition-opacity",
                isOptimistic && "opacity-50 animate-pulse pointer-events-none"
              )}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {getMerchant(tx)}
              </span>
              <span className="inline-flex shrink-0 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {tx.category}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatTime(tx)}
              </span>
              <span
                className={`shrink-0 text-right text-sm font-medium tabular-nums ${
                  tx.type === "income" ? "text-emerald-400" : "text-amber-500"
                }`}
                title="Converted at Frankfurter rate"
              >
                {tx.type === "income" ? "+" : "-"}
                {formatCurrency(
                  convertCurrency(tx.amount, tx.currency as SupportedCurrency, displayCurrency),
                  displayCurrency
                )}
              </span>
            </li>
          );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
