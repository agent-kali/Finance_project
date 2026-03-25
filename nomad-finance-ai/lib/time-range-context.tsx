"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export type TimeRange = "Today" | "This Week" | "This Month";

const STORAGE_KEY = "nomad-finance-time-range";

const VALID_RANGES: TimeRange[] = ["Today", "This Week", "This Month"];

function readStored(): TimeRange | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    // #region agent log
    fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "4346b3",
      },
      body: JSON.stringify({
        sessionId: "4346b3",
        runId: "initial-hydration",
        hypothesisId: "H1",
        location: "lib/time-range-context.tsx:19",
        message: "readStored localStorage value",
        data: { storedValue: s, ssrSafeDefault: SSR_SAFE_DEFAULT },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (s && VALID_RANGES.includes(s as TimeRange)) return s as TimeRange;
  } catch {
    /* ignore */
  }
  return null;
}

/** Initial value must be the same on server and first client render to avoid hydration mismatch. */
const SSR_SAFE_DEFAULT: TimeRange = "Today";

type TimeRangeContextValue = {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  isTransitioning: boolean;
};

const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

export function useTimeRange() {
  const ctx = useContext(TimeRangeContext);
  if (!ctx) {
    throw new Error("useTimeRange must be used within a TimeRangeProvider");
  }
  return ctx;
}

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRangeState] = useState<TimeRange>(SSR_SAFE_DEFAULT);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "4346b3",
      },
      body: JSON.stringify({
        sessionId: "4346b3",
        runId: "initial-hydration",
        hypothesisId: "H2",
        location: "lib/time-range-context.tsx:49",
        message: "TimeRangeProvider mounted",
        data: {
          timeRange,
          storedValue:
            typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [timeRange]);
  // #endregion

  // #region agent log
  useEffect(() => {
    const stored = readStored();
    fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "4346b3",
      },
      body: JSON.stringify({
        sessionId: "4346b3",
        runId: "post-fix",
        hypothesisId: "H4",
        location: "lib/time-range-context.tsx:67",
        message: "post-mount stored range sync",
        data: {
          storedValue: stored,
          currentTimeRange: timeRange,
          willSync: Boolean(stored && stored !== timeRange),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});

    if (stored && stored !== timeRange) {
      setTimeRangeState(stored);
    }
  }, []);
  // #endregion

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    setTimeRangeState((prev) => {
      if (range === prev) return prev;
      try {
        localStorage.setItem(STORAGE_KEY, range);
      } catch {
        /* ignore */
      }
      return range;
    });
    setIsTransitioning(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, 120);
  }, []);

  return (
    <TimeRangeContext.Provider value={{ timeRange, setTimeRange, isTransitioning }}>
      {children}
    </TimeRangeContext.Provider>
  );
}
