import type { TimeRange } from "@/lib/time-range-context";

/**
 * Returns start and end Date for the given time range (start of day to end of day).
 */
export function getDateRange(timeRange: TimeRange): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  switch (timeRange) {
    case "Today": {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
      return { start, end };
    }
    case "Week": {
      const day = now.getDay();
      const mondayOffset = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      const start = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate(),
        0,
        0,
        0,
        0
      );
      return { start, end };
    }
    case "Month": {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      );
      return { start, end };
    }
  }
}

/**
 * Returns a display label for the time range.
 */
export function getPeriodLabel(timeRange: TimeRange): string {
  switch (timeRange) {
    case "Today":
      return "Today";
    case "Week":
      return "Week";
    case "Month":
      return "Month";
  }
}

/**
 * Returns the savings rate subtitle based on time range and whether income exists.
 */
export function getSavingsSubtitle(
  timeRange: TimeRange,
  hasIncome: boolean
): string {
  if (!hasIncome) return "No income yet";
  switch (timeRange) {
    case "Today":
      return "Of daily income";
    case "Week":
      return "Of weekly income";
    case "Month":
      return "Of monthly income";
  }
}

/**
 * Returns an empty-state message for spending by category.
 */
export function getEmptyMessage(timeRange: TimeRange): string {
  switch (timeRange) {
    case "Today":
      return "No spending today yet!";
    case "Week":
      return "No spending this week yet!";
    case "Month":
      return "No spending this month yet!";
  }
}
