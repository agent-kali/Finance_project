"use client";

import dynamic from "next/dynamic";
import { motion, type Variants } from "framer-motion";
import { ErrorBoundary } from "@/components/error-boundary";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { AiInsightCard } from "@/components/dashboard/ai-insight-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { MobileFab } from "@/components/dashboard/mobile-fab";
import { TimeRangeToggle } from "@/components/dashboard/time-range-toggle";
import { useTimeRange } from "@/lib/time-range-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const chartLoadingFallback = (minH = "min-h-[360px]") => (
  <Card className={`glass-card flex h-full ${minH} flex-col`}>
    <CardHeader>
      <Skeleton className="h-3 w-40" />
    </CardHeader>
    <CardContent className="flex-1">
      <Skeleton className="min-h-[300px] w-full rounded-lg" />
    </CardContent>
  </Card>
);

const SpendingChart = dynamic(
  () =>
    import("@/components/dashboard/spending-chart").then((m) => ({
      default: m.SpendingChart,
    })),
  { ssr: false, loading: () => chartLoadingFallback() }
);

const CategoryChart = dynamic(
  () =>
    import("@/components/dashboard/category-chart").then((m) => ({
      default: m.CategoryChart,
    })),
  { ssr: false, loading: () => chartLoadingFallback() }
);

const WalletChart = dynamic(
  () =>
    import("@/components/dashboard/wallet-chart").then((m) => ({
      default: m.WalletChart,
    })),
  { ssr: false, loading: () => chartLoadingFallback() }
);

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: i * 0.15 },
  }),
};

const viewportConfig = { once: true, margin: "-80px" as const };

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
      <ErrorBoundary fallbackTitle="Failed to load AI insight">
        <AiInsightCard />
      </ErrorBoundary>
      <section aria-label="Recent activity">
        <ErrorBoundary fallbackTitle="Failed to load recent activity">
          <RecentActivity />
        </ErrorBoundary>
      </section>
      <motion.section
        aria-label="Spending and category charts"
        className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-stretch"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <motion.div variants={cardVariants} custom={0}>
          <ErrorBoundary fallbackTitle="Failed to load spending chart">
            <SpendingChart />
          </ErrorBoundary>
        </motion.div>
        <motion.div variants={cardVariants} custom={1}>
          <ErrorBoundary fallbackTitle="Failed to load category chart">
            <CategoryChart />
          </ErrorBoundary>
        </motion.div>
      </motion.section>
      <motion.section
        aria-label="Wallet chart"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <motion.div variants={cardVariants} custom={0}>
          <ErrorBoundary fallbackTitle="Failed to load wallet chart">
            <WalletChart />
          </ErrorBoundary>
        </motion.div>
      </motion.section>
    </div>
  );
}

export function DashboardContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="sr-only">Dashboard</h1>
        <TimeRangeToggle />
      </div>
      <TimeRangeContent />
      <MobileFab />
    </div>
  );
}
