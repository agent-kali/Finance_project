"use client";

import { useTimeRange, type TimeRange } from "@/lib/time-range-context";
import { cn } from "@/lib/utils";

const OPTIONS: TimeRange[] = ["Today", "This Week", "This Month"];

export function TimeRangeToggle() {
  const { timeRange, setTimeRange } = useTimeRange();

  return (
    <div
      role="group"
      aria-label="Time range"
      className="inline-flex h-9 w-fit shrink-0 items-stretch gap-0 rounded-lg border border-border bg-muted/40 p-0.5 dark:border-border dark:bg-muted/20"
    >
      {OPTIONS.map((option) => {
        const isActive = timeRange === option;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setTimeRange(option)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-all duration-150 sm:px-4 sm:text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:hover:bg-muted/40"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
