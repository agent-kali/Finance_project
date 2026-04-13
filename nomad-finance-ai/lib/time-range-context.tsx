"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type TimeRange = "Today" | "Week" | "Month";

const STORAGE_KEY = "nomad-finance-time-range";
const STORAGE_SYNC_EVENT = "nomad-finance-time-range-change";

const VALID_RANGES: TimeRange[] = ["Today", "Week", "Month"];

const LEGACY_STORED: Record<string, TimeRange> = {
  "This Week": "Week",
  "This Month": "Month",
};

function readStored(): TimeRange | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    const migrated = LEGACY_STORED[s];
    if (migrated) {
      localStorage.setItem(STORAGE_KEY, migrated);
      return migrated;
    }
    if (VALID_RANGES.includes(s as TimeRange)) return s as TimeRange;
  } catch {
    /* ignore */
  }
  return null;
}

function subscribeToStoredTimeRange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleLocalChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_SYNC_EVENT, handleLocalChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_SYNC_EVENT, handleLocalChange);
  };
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
  const storedTimeRange = useSyncExternalStore(
    subscribeToStoredTimeRange,
    () => readStored() ?? SSR_SAFE_DEFAULT,
    () => SSR_SAFE_DEFAULT,
  );
  const [pendingTimeRange, setPendingTimeRange] = useState<TimeRange | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeRange = pendingTimeRange ?? storedTimeRange;

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    if (range === timeRange) return;

    setPendingTimeRange(range);

    try {
      localStorage.setItem(STORAGE_KEY, range);
      window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
    } catch {
      /* ignore */
    }

    setIsTransitioning(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setPendingTimeRange(null);
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, 120);
  }, [timeRange]);

  return (
    <TimeRangeContext.Provider value={{ timeRange, setTimeRange, isTransitioning }}>
      {children}
    </TimeRangeContext.Provider>
  );
}
