"use client";

import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error-boundary";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { WalletChart } from "@/components/dashboard/wallet-chart";
import { TimeRangeToggle } from "@/components/dashboard/time-range-toggle";
import { useTimeRange } from "@/lib/time-range-context";

function TimeRangeContent() {
  const { isTransitioning } = useTimeRange();
  return (
    <motion.div
      animate={{ opacity: isTransitioning ? 0.6 : 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="space-y-8"
    >
      <ErrorBoundary fallbackTitle="Failed to load summary">
        <SummaryCards />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Failed to load recent activity">
        <RecentActivity />
      </ErrorBoundary>
      <div className="grid gap-6 lg:grid-cols-2">
        <ErrorBoundary fallbackTitle="Failed to load spending chart">
          <SpendingChart />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Failed to load category chart">
          <CategoryChart />
        </ErrorBoundary>
      </div>
      <ErrorBoundary fallbackTitle="Failed to load wallet chart">
        <WalletChart />
      </ErrorBoundary>
    </motion.div>
  );
}

export function DashboardContent() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <TimeRangeToggle />
      </div>
      <TimeRangeContent />
    </div>
  );
}
