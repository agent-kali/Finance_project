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
import {
  Activity,
  Home,
  Utensils,
  Car,
  Monitor,
  Heart,
  Film,
  ShoppingBag,
  Wrench,
  Plane,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Landmark,
  ArrowLeftRight,
  Circle,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Housing: Home,
  "Food & Dining": Utensils,
  Transportation: Car,
  Coworking: Monitor,
  "Health & Insurance": Heart,
  Entertainment: Film,
  Shopping: ShoppingBag,
  "SaaS & Tools": Wrench,
  Travel: Plane,
  Education: GraduationCap,
  Salary: Briefcase,
  Freelance: Briefcase,
  Investment: TrendingUp,
  Transfer: ArrowLeftRight,
  Other: Landmark,
};

function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Circle;
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
      <Card className="glass-card min-h-[280px]">
        <CardHeader>
          <Skeleton className="h-3 w-36" />
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/50 space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
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
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </CardTitle>
          <Link href="/transactions" className="text-xs font-medium text-primary">
            View all -&gt;
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
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </CardTitle>
        <Link href="/transactions" className="text-xs font-medium text-primary">
          View all -&gt;
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/30">
          {recent.map((tx) => {
            const isOptimistic = tx.id.startsWith("temp-");
            const Icon = getCategoryIcon(tx.category);
            const merchant = getMerchant(tx);
            const showCategory = merchant !== tx.category;
            return (
            <li
              key={tx.id}
              className={cn(
                "flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-opacity",
                isOptimistic && "opacity-50 animate-pulse pointer-events-none"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block truncate text-sm font-medium text-foreground">
                  {merchant}
                </span>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-muted-foreground">
                  {showCategory && <span>{tx.category}</span>}
                  {showCategory && <span aria-hidden>·</span>}
                  <span className="shrink-0 tabular-nums">{formatTime(tx)}</span>
                </div>
              </div>
              <span
                className={`shrink-0 whitespace-nowrap text-right text-sm font-medium tabular-nums ${
                  tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                }`}
                title="Converted at Frankfurter rate"
              >
                <span className="sr-only">
                  {tx.type === "income" ? "Income" : "Expense"}
                  {" "}
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
      </CardContent>
    </Card>
  );
}
