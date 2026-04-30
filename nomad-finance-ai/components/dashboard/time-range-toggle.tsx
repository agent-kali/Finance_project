"use client";

import { useTimeRange, type TimeRange } from "@/lib/time-range-context";
import { cn } from "@/lib/utils";

const OPTIONS: TimeRange[] = ["Today", "Week", "Month"];

export function TimeRangeToggle() {
  const { timeRange, setTimeRange } = useTimeRange();

  // #region agent log
  fetch('http://127.0.0.1:7275/ingest/7034276d-4c3f-45c5-87de-28cdb9aa5856',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'84e12d'},body:JSON.stringify({sessionId:'84e12d',runId:'pre-fix',hypothesisId:'H2',location:'components/dashboard/time-range-toggle.tsx:TimeRangeToggle:render',message:'TimeRangeToggle render',data:{runtime:typeof window==='undefined'?'server':'client',timeRange},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <div
      role="group"
      aria-label="Time range"
      className="inline-flex h-10 w-fit shrink-0 items-stretch gap-0 rounded-full p-1"
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
                ? "bg-[rgba(255,255,255,0.06)] text-[#E0D8C8]"
                : "text-[#6B6560] hover:text-[#A09080]"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
