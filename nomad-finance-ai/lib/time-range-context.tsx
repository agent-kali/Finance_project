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
    if (s && VALID_RANGES.includes(s as TimeRange)) return s as TimeRange;
  } catch {
    /* ignore */
  }
  return null;
}

type TimeRangeContextValue = {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  isTransitioning: boolean;
};

const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

const DEFAULT_TIME_RANGE: TimeRange = "Today";

export function useTimeRange() {
  const ctx = useContext(TimeRangeContext);
  if (!ctx) {
    throw new Error("useTimeRange must be used within a TimeRangeProvider");
  }
  return ctx;
}

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRangeState] = useState<TimeRange>(DEFAULT_TIME_RANGE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readStored();
    if (stored) setTimeRangeState(stored);
  }, []);

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
