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
      className="inline-flex h-10 w-fit shrink-0 items-stretch gap-0 rounded-full border border-border/40 bg-muted/35 p-1"
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
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 sm:px-4 sm:text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
