"use client";

import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/error-boundary";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TimeRangeToggle } from "@/components/dashboard/time-range-toggle";
import { useTimeRange } from "@/lib/time-range-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SpendingChart = dynamic(
  () =>
    import("@/components/dashboard/spending-chart").then((m) => ({
      default: m.SpendingChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>
    ),
  }
);

const CategoryChart = dynamic(
  () =>
    import("@/components/dashboard/category-chart").then((m) => ({
      default: m.CategoryChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>
    ),
  }
);

const WalletChart = dynamic(
  () =>
    import("@/components/dashboard/wallet-chart").then((m) => ({
      default: m.WalletChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </CardContent>
      </Card>
    ),
  }
);

function TimeRangeContent() {
  const { isTransitioning } = useTimeRange();
  return (
    <div
      className={`space-y-8 transition-opacity duration-150 ease-out ${isTransitioning ? "opacity-60" : "opacity-100"}`}
    >
      <section aria-label="Summary">
        <ErrorBoundary fallbackTitle="Failed to load summary">
          <SummaryCards />
        </ErrorBoundary>
      </section>
      <section aria-label="Recent activity">
        <ErrorBoundary fallbackTitle="Failed to load recent activity">
          <RecentActivity />
        </ErrorBoundary>
      </section>
      <section aria-label="Spending and category charts" className="grid gap-6 lg:grid-cols-2">
        <ErrorBoundary fallbackTitle="Failed to load spending chart">
          <SpendingChart />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Failed to load category chart">
          <CategoryChart />
        </ErrorBoundary>
      </section>
      <section aria-label="Wallet chart">
        <ErrorBoundary fallbackTitle="Failed to load wallet chart">
          <WalletChart />
        </ErrorBoundary>
      </section>
    </div>
  );
}

export function DashboardContent() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3">
          <TimeRangeToggle />
        </div>
      </div>
      <TimeRangeContent />
    </div>
  );
}
