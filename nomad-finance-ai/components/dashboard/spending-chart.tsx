"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useChartDimensions } from "@/lib/hooks/use-chart-dimensions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useTimeRange, type TimeRange } from "@/lib/time-range-context";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { getEmptyMessage } from "@/lib/date-utils";
import { convertCurrency, formatCurrency, formatCompact } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";

const ACCENT = "#2dd4bf";
const ACCENT_60 = "rgba(45, 212, 191, 0.6)";
const ACCENT_30 = "rgba(45, 212, 191, 0.3)";
const MIN_BAR_HEIGHT_PX = 4;

const CHART_LIGHT = {
  gridStroke: "oklch(0.88 0.01 270 / 0.4)",
  tickFill: "oklch(0.5 0.02 270)",
};
const CHART_DARK = {
  gridStroke: "oklch(0.3 0.01 270 / 0.15)",
  tickFill: "oklch(0.55 0.02 270)",
};

function getChartTitle(timeRange: TimeRange): string {
  switch (timeRange) {
    case "Today":
      return "Today vs Daily Average";
    case "This Week":
      return "This Week vs Last Week";
    case "This Month":
      return "Income vs Expenses (6 months)";
  }
}

function getStartOfWeek(d: Date): Date {
  const day = d.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildTodayData(
  transactions: { date: string; type: string; amount: number; currency: string }[],
  convert: (amount: number, currency: string) => number
) {
  const now = new Date();
  const todayKey = toDateKey(now);

  const todayExpenses = transactions
    .filter((t) => t.type === "expense" && toDateKey(new Date(t.date)) === todayKey)
    .reduce((sum, t) => sum + convert(t.amount, t.currency), 0);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const pastExpenses = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d >= thirtyDaysAgo && d < todayStart;
    })
    .reduce((sum, t) => sum + convert(t.amount, t.currency), 0);
  const dayCount = 30;
  const dailyAvg = dayCount > 0 ? pastExpenses / dayCount : 0;

  return [
    { name: "Today", value: Math.round(todayExpenses * 100) / 100 },
    { name: "Daily Avg", value: Math.round(dailyAvg * 100) / 100 },
  ];
}

function buildWeekData(
  transactions: { date: string; type: string; amount: number; currency: string }[],
  convert: (amount: number, currency: string) => number
) {
  const now = new Date();
  const thisWeekStart = getStartOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows: { name: string; thisWeek: number; lastWeek: number }[] = [];

  for (let i = 0; i < 7; i++) {
    const thisDay = new Date(thisWeekStart);
    thisDay.setDate(thisWeekStart.getDate() + i);
    const lastDay = new Date(lastWeekStart);
    lastDay.setDate(lastWeekStart.getDate() + i);

    const thisDayKey = toDateKey(thisDay);
    const lastDayKey = toDateKey(lastDay);

    const thisVal = transactions
      .filter((t) => t.type === "expense" && toDateKey(new Date(t.date)) === thisDayKey)
      .reduce((sum, t) => sum + convert(t.amount, t.currency), 0);
    const lastVal = transactions
      .filter((t) => t.type === "expense" && toDateKey(new Date(t.date)) === lastDayKey)
      .reduce((sum, t) => sum + convert(t.amount, t.currency), 0);

    rows.push({
      name: dayLabels[i],
      thisWeek: Math.round(thisVal * 100) / 100,
      lastWeek: Math.round(lastVal * 100) / 100,
    });
  }
  return rows;
}

function buildMonthData(
  transactions: { date: string; type: string; amount: number; currency: string }[],
  convert: (amount: number, currency: string) => number
) {
  const now = new Date();
  const months: { key: string; label: string; income: number; expenses: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    months.push({ key, label, income: 0, expenses: 0 });
  }

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (!bucket) continue;

    const eur = convert(tx.amount, tx.currency);
    if (tx.type === "income") bucket.income += eur;
    else bucket.expenses += eur;
  }

  return months.map((m) => ({
    name: m.label,
    income: Math.round(m.income * 100) / 100,
    expenses: Math.round(m.expenses * 100) / 100,
  }));
}

export function SpendingChart() {
  const { resolvedTheme } = useTheme();
  const chartColors = resolvedTheme === "dark" ? CHART_DARK : CHART_LIGHT;
  const { data: transactions, isLoading } = useTransactions();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();
  const { ref, width, height } = useChartDimensions();
  const prefersReducedMotion = useReducedMotion();

  const convert = useMemo(
    () => (amount: number, currency: string) =>
      convertCurrency(amount, currency as SupportedCurrency, displayCurrency),
    [displayCurrency]
  );

  const { chartData, chartType } = useMemo(() => {
    const txs = transactions ?? [];

    switch (timeRange) {
      case "Today": {
        const data = buildTodayData(txs, convert);
        return { chartData: data, chartType: "today" as const };
      }
      case "This Week": {
        const data = buildWeekData(txs, convert);
        return { chartData: data, chartType: "week" as const };
      }
      case "This Month": {
        const data = buildMonthData(txs, convert);
        return { chartData: data, chartType: "area" as const };
      }
    }
  }, [transactions, timeRange, convert]);

  const todayData = useMemo(
    () => (chartType === "today" ? (chartData as { name: string; value: number }[]) : null),
    [chartType, chartData]
  );
  const todayValueZero = useMemo(
    () => todayData?.find((d) => d.name === "Today")?.value === 0,
    [todayData]
  );

  const hasAnyData = useMemo(() => {
    if (chartType === "today")
      return (chartData as { value: number }[]).some((d) => d.value > 0) || todayValueZero;
    if (chartType === "week")
      return (chartData as { thisWeek: number; lastWeek: number }[]).some(
        (d) => d.thisWeek > 0 || d.lastWeek > 0
      );
    return (chartData as { income: number; expenses: number }[]).some(
      (d) => d.income > 0 || d.expenses > 0
    );
  }, [chartData, chartType, todayValueZero]);

  const chartAriaLabel = useMemo(() => {
    if (chartType === "today") return "Today vs daily average spending";
    if (chartType === "week") return "This week vs last week spending by day";
    return "Income vs expenses over the last 6 months";
  }, [chartType]);

  const chartSummary = useMemo(() => {
    if (!hasAnyData || chartData.length === 0) return null;
    if (chartType === "today") {
      const d = chartData as { name: string; value: number }[];
      const today = d.find((x) => x.name === "Today")?.value ?? 0;
      const avg = d.find((x) => x.name === "Daily Avg")?.value ?? 0;
      return `Today: ${formatCurrency(today, displayCurrency)}. Daily average: ${formatCurrency(avg, displayCurrency)}.`;
    }
    if (chartType === "week") {
      const d = chartData as { thisWeek: number; lastWeek: number }[];
      const thisTotal = d.reduce((s, x) => s + x.thisWeek, 0);
      const lastTotal = d.reduce((s, x) => s + x.lastWeek, 0);
      return `This week total: ${formatCurrency(thisTotal, displayCurrency)}. Last week: ${formatCurrency(lastTotal, displayCurrency)}.`;
    }
    const d = chartData as { income: number; expenses: number }[];
    const totalIncome = d.reduce((s, x) => s + x.income, 0);
    const totalExpenses = d.reduce((s, x) => s + x.expenses, 0);
    return `Total income: ${formatCurrency(totalIncome, displayCurrency)}. Total expenses: ${formatCurrency(totalExpenses, displayCurrency)}.`;
  }, [chartType, chartData, hasAnyData, displayCurrency]);

  if (isLoading) {
    return (
      <Card className="glass-card flex h-full min-h-[360px] flex-col">
        <CardHeader>
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="min-h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const title = getChartTitle(timeRange);

  const isNarrow = width > 0 && width < 400;
  const chartMargin = { top: 8, right: 8, left: isNarrow ? 40 : 28, bottom: 0 };
  const tickFontSize = isNarrow ? 10 : 11;
  const formatTick = (v: number) =>
    isNarrow ? formatCompact(v, displayCurrency) : formatCurrency(v, displayCurrency);

  const sharedChartProps = {
    width,
    height,
    margin: chartMargin,
    isAnimationActive: !prefersReducedMotion,
  };

  return (
    <Card className="glass-card flex h-full min-h-[360px] flex-col">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 overflow-hidden">
        <div
          ref={ref}
          className="h-[300px] min-w-0 w-full"
          role="img"
          aria-label={chartAriaLabel}
        >
          {chartSummary && (
            <p className="sr-only">{chartSummary}</p>
          )}
          {!hasAnyData ? (
            <EmptyState
              icon={BarChart3}
              heading="No spending data"
              subtext={getEmptyMessage(timeRange)}
              className="min-h-[300px]"
            />
          ) : width > 0 && height > 0 && chartData.length > 0 ? (
            <>
              {chartType === "today" && (
                <BarChart {...sharedChartProps} data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.gridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                    tickFormatter={(name) =>
                      name === "Today" && todayValueZero ? "No data yet" : name
                    }
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                    tickFormatter={(v: number) => formatTick(v)}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    wrapperStyle={{ background: "transparent" }}
                    contentStyle={{ background: "transparent", border: "none", padding: 0 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const rawLabel = (payload[0].payload as { name: string }).name;
                      const displayLabel = rawLabel === "Today" && todayValueZero ? "No data yet" : rawLabel;
                      return (
                        <div className="glass-tooltip rounded-xl px-4 py-3">
                          <p className="mb-1 text-sm font-semibold text-foreground">{displayLabel}</p>
                          {payload.map((entry) => (
                            <p key={entry.name} className="text-sm text-muted-foreground">
                              <span className="capitalize text-foreground">
                                {entry.name === "value" ? "Spending" : entry.name}
                              </span>
                              :{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(entry.value as number, displayCurrency)}
                              </span>
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    strokeWidth={0}
                    shape={(
                      props: {
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                        fill?: string;
                        payload?: { name: string };
                      }
                    ) => {
                      const { x, y, width, height, payload } = props;
                      const h = Math.max(height, MIN_BAR_HEIGHT_PX);
                      const ny = height > 0 ? y : y + height - h;
                      const isDailyAvg = payload?.name === "Daily Avg";
                      const barFill = isDailyAvg ? ACCENT_30 : ACCENT;
                      return (
                        <rect
                          x={x}
                          y={ny}
                          width={width}
                          height={h}
                          fill={barFill}
                          rx={6}
                          ry={0}
                        />
                      );
                    }}
                  >
                    {(chartData as { name: string }[]).map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.name === "Today" ? ACCENT : ACCENT_30}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}

              {chartType === "week" && (
                <BarChart {...sharedChartProps} data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.gridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                    tickFormatter={(v: number) => formatTick(v)}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    wrapperStyle={{ background: "transparent" }}
                    contentStyle={{ background: "transparent", border: "none", padding: 0 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="glass-tooltip rounded-xl px-4 py-3" title="Converted at Frankfurter rate">
                          <p className="mb-1 text-sm font-semibold text-foreground">{label}</p>
                          {payload.map((entry) => (
                            <p key={entry.name} className="text-sm text-muted-foreground">
                              <span className="capitalize text-foreground">{entry.name}</span>:{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(entry.value as number, displayCurrency)}
                              </span>
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="thisWeek"
                    name="This Week"
                    fill={ACCENT}
                    radius={[6, 6, 0, 0]}
                    strokeWidth={0}
                  />
                  <Bar
                    dataKey="lastWeek"
                    name="Last Week"
                    fill={ACCENT_30}
                    radius={[6, 6, 0, 0]}
                    strokeWidth={0}
                  />
                </BarChart>
              )}

              {chartType === "area" && (
                <AreaChart {...sharedChartProps} data={chartData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.gridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                    tickFormatter={(v: number) => formatTick(v)}
                  />
                  <Tooltip
                    cursor={false}
                    wrapperStyle={{ background: "transparent" }}
                    contentStyle={{ background: "transparent", border: "none", padding: 0 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="glass-tooltip rounded-xl px-4 py-3" title="Converted at Frankfurter rate">
                          <p className="mb-1 text-sm font-semibold text-foreground">{label}</p>
                          {payload.map((entry) => (
                            <p key={entry.name} className="text-sm text-muted-foreground">
                              <span className="capitalize text-foreground">{entry.name}</span>:{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(entry.value as number, displayCurrency)}
                              </span>
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke={ACCENT}
                    fill="url(#incomeGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke={ACCENT_60}
                    fill="url(#expenseGrad)"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                </AreaChart>
              )}
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
