"use client";

import { motion, type Variants } from "framer-motion";
import { ErrorBoundary } from "@/components/error-boundary";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { AiInsightCard } from "@/components/dashboard/ai-insight-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { MobileFab } from "@/components/dashboard/mobile-fab";
import { RunwayCard } from "@/components/dashboard/runway-card";
import { DashboardSpendingBreakdown } from "@/components/dashboard/spending-breakdown";
import { WalletChart } from "@/components/dashboard/wallet-chart";
import { TimeRangeToggle } from "@/components/dashboard/time-range-toggle";
import { useTimeRange } from "@/lib/time-range-context";

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
      className={`min-w-0 max-w-full space-y-8 transition-opacity duration-150 ease-out ${isTransitioning ? "opacity-60" : "opacity-100"}`}
    >
      {/* 1. Balance hero, recent activity, AI insight */}
      <section aria-label="Summary" className="min-w-0 max-w-full">
        <ErrorBoundary fallbackTitle="Failed to load summary">
          <SummaryCards />
        </ErrorBoundary>
      </section>
      <ErrorBoundary fallbackTitle="Failed to load recent activity">
        <RecentActivity />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Failed to load AI insight">
        <AiInsightCard />
      </ErrorBoundary>

      {/* 2. Wallet balances */}
      <motion.section
        aria-label="Wallets"
        className="min-w-0 max-w-full"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          alignItems: "stretch",
        }}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <motion.div variants={cardVariants} custom={0}>
          <ErrorBoundary fallbackTitle="Failed to load wallet balances">
            <WalletChart />
          </ErrorBoundary>
        </motion.div>
      </motion.section>

      {/* 3. Where it went — full width */}
      <motion.section
        aria-label="Spending breakdown"
        className="min-w-0 max-w-full"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <motion.div variants={cardVariants} custom={0}>
          <ErrorBoundary fallbackTitle="Failed to load spending breakdown">
            <DashboardSpendingBreakdown />
          </ErrorBoundary>
        </motion.div>
      </motion.section>

      {/* 4. Your Runway — full width, bottom */}
      <motion.section
        aria-label="Runway"
        className="min-w-0 max-w-full"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <motion.div variants={cardVariants} custom={0}>
          <ErrorBoundary fallbackTitle="Failed to load runway">
            <RunwayCard />
          </ErrorBoundary>
        </motion.div>
      </motion.section>
    </div>
  );
}

export function DashboardContent() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1200px] overflow-hidden px-4 md:px-6">
      <div className="min-w-0 max-w-full space-y-8">
        <div className="flex min-w-0 max-w-full items-center gap-3">
          <h1 className="sr-only">Dashboard</h1>
          <TimeRangeToggle />
        </div>
        <TimeRangeContent />
        <MobileFab />
      </div>
    </div>
  );
}
