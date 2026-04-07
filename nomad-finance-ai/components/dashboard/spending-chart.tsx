"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

const ACCENT = "#C9A96E";
const ACCENT_60 = "#B08D4A";
const ACCENT_35 = "#8B7039";
const MIN_BAR_HEIGHT_PX = 4;

const CHART_LIGHT = {
  gridStroke: "oklch(0.88 0.01 55 / 0.12)",
  tickFill: "oklch(0.5 0.02 55)",
};
const CHART_DARK = {
  gridStroke: "oklch(0.25 0.008 55 / 0.12)",
  tickFill: "oklch(0.55 0.02 60)",
};

function roundedTopRect(x: number, y: number, w: number, h: number, r: number): string {
  const cr = Math.min(r, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + cr}`,
    `Q${x},${y} ${x + cr},${y}`,
    `H${x + w - cr}`,
    `Q${x + w},${y} ${x + w},${y + cr}`,
    `V${y + h}`,
    `Z`,
  ].join(" ");
}

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1814",
  border: "1px solid rgba(184, 149, 106, 0.3)",
  borderRadius: 10,
  padding: "8px 12px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
} as const;

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

  const todaySparseState = useMemo(() => {
    if (chartType !== "today" || !todayData) return null;
    const today = todayData.find((d) => d.name === "Today")?.value ?? 0;
    const dailyAvg = todayData.find((d) => d.name === "Daily Avg")?.value ?? 0;
    const meaningfulBars = [today, dailyAvg].filter((value) => value > 0).length;

    if (meaningfulBars > 1) return null;

    return {
      today,
      dailyAvg,
      heading: "Not enough data yet",
      subtext:
        meaningfulBars === 0
          ? "Check back after a few days of tracking."
          : "Track spending across a few more days to make this comparison useful.",
    };
  }, [chartType, todayData]);

  if (isLoading) {
    return (
      <Card className="glass-card flex h-full min-h-[360px] flex-col">
        <CardHeader>
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="min-h-[220px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const title = getChartTitle(timeRange);

  const isNarrow = width > 0 && width < 400;
  const chartMargin = { top: 8, right: isNarrow ? 2 : 8, left: isNarrow ? 30 : 32, bottom: 0 };
  const tickFontSize = isNarrow ? 10 : 12;
  const tickMargin = isNarrow ? 6 : 10;
  const formatTick = (v: number) =>
    isNarrow ? formatCompact(v, displayCurrency) : formatCurrency(v, displayCurrency);

  const sharedChartProps = {
    width,
    height,
    margin: chartMargin,
    isAnimationActive: !prefersReducedMotion,
  };

  return (
    <Card className="glass-card flex h-full min-h-[360px] flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 overflow-hidden px-4 sm:px-6">
        <div
          ref={ref}
          className="h-[220px] min-w-0 w-full px-1 sm:px-0"
          role="img"
          aria-label={chartAriaLabel}
        >
          {chartSummary && (
            <p className="sr-only">{chartSummary}</p>
          )}
          {todaySparseState ? (
            <div className="flex min-h-[220px] w-full flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-foreground">{todaySparseState.heading}</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {todaySparseState.subtext}
              </p>
              {(todaySparseState.today > 0 || todaySparseState.dailyAvg > 0) && (
                <p className="mt-3 text-xs tabular-nums text-muted-foreground">
                  Today {formatCurrency(todaySparseState.today, displayCurrency)} · Daily avg{" "}
                  {formatCurrency(todaySparseState.dailyAvg, displayCurrency)}
                </p>
              )}
            </div>
          ) : !hasAnyData ? (
            <EmptyState
              icon={BarChart3}
              heading="No spending data"
              subtext={getEmptyMessage(timeRange)}
              className="min-h-[220px]"
            />
          ) : width > 0 && height > 0 && chartData.length > 0 ? (
            <>
              {chartType === "today" && (
                <BarChart
                  {...sharedChartProps}
                  data={chartData}
                  barSize={64}
                  barCategoryGap="35%"
                  barGap={8}
                >
                  <defs>
                    <linearGradient id="spendingBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4b48a" />
                      <stop offset="100%" stopColor="#b8956a" />
                    </linearGradient>
                    <linearGradient id="spendingBarGradDim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8956a" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#8B7039" stopOpacity={0.7} />
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
                    tickMargin={tickMargin}
                    tickFormatter={(name) =>
                      name === "Today" && todayValueZero ? "No data yet" : name
                    }
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                    tickMargin={tickMargin}
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
                        <div style={TOOLTIP_STYLE}>
                          <p style={{ color: "rgba(245, 240, 232, 0.6)", fontSize: 12, marginBottom: 4 }}>
                            {displayLabel}
                          </p>
                          {payload.map((entry) => (
                            <p key={entry.name} style={{ color: "#f5f0e8", fontSize: 14 }}>
                              <span style={{ textTransform: "capitalize" }}>
                                {entry.name === "value" ? "Spending" : entry.name}
                              </span>
                              :{" "}
                              <span style={{ fontWeight: 500 }}>
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
                    minPointSize={6}
                    isAnimationActive={false}
                    shape={(
                      props: {
                        x?: number;
                        y?: number;
                        width?: number;
                        height?: number;
                        index?: number;
                        payload?: { name: string };
                      }
                    ) => {
                      const { x = 0, y = 0, width = 0, height: rawH = 0, index = 0, payload } = props;
                      const h = Math.max(rawH, MIN_BAR_HEIGHT_PX);
                      const ny = rawH > 0 ? y : y + rawH - h;
                      const isDailyAvg = payload?.name === "Daily Avg";
                      const fill = isDailyAvg ? "url(#spendingBarGradDim)" : "url(#spendingBarGrad)";
                      const d = roundedTopRect(x, ny, width, h, 6);

                      if (prefersReducedMotion) {
                        return <path d={d} fill={fill} />;
                      }

                      return (
                        <motion.path
                          d={d}
                          fill={fill}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          style={{ transformOrigin: `${x + width / 2}px ${ny + h}px` }}
                          transition={{
                            type: "spring",
                            stiffness: 120,
                            damping: 20,
                            delay: (index ?? 0) * 0.15,
                          }}
                        />
                      );
                    }}
                  />
                </BarChart>
              )}

              {chartType === "week" && (
                <BarChart
                  {...sharedChartProps}
                  data={chartData}
                  maxBarSize={isNarrow ? 10 : 14}
                  barGap={isNarrow ? 4 : 8}
                  barCategoryGap={isNarrow ? "18%" : "28%"}
                >
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
                    tickMargin={tickMargin}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                    tickMargin={tickMargin}
                    tickFormatter={(v: number) => formatTick(v)}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    wrapperStyle={{ background: "transparent" }}
                    contentStyle={{ background: "transparent", border: "none", padding: 0 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={TOOLTIP_STYLE} title="Converted at Frankfurter rate">
                          <p style={{ color: "rgba(245, 240, 232, 0.6)", fontSize: 12, marginBottom: 4 }}>
                            {label}
                          </p>
                          {payload.map((entry) => (
                            <p key={entry.name} style={{ color: "#f5f0e8", fontSize: 14 }}>
                              <span style={{ textTransform: "capitalize" }}>{entry.name}</span>:{" "}
                              <span style={{ fontWeight: 500 }}>
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
                    radius={[4, 4, 0, 0]}
                    strokeWidth={0}
                    minPointSize={5}
                  />
                  <Bar
                    dataKey="lastWeek"
                    name="Last Week"
                    fill={ACCENT_35}
                    radius={[4, 4, 0, 0]}
                    strokeWidth={0}
                    minPointSize={5}
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
                    tickMargin={tickMargin}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tickFill, fontSize: tickFontSize }}
                    tickMargin={tickMargin}
                    tickFormatter={(v: number) => formatTick(v)}
                  />
                  <Tooltip
                    cursor={false}
                    wrapperStyle={{ background: "transparent" }}
                    contentStyle={{ background: "transparent", border: "none", padding: 0 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={TOOLTIP_STYLE} title="Converted at Frankfurter rate">
                          <p style={{ color: "rgba(245, 240, 232, 0.6)", fontSize: 12, marginBottom: 4 }}>
                            {label}
                          </p>
                          {payload.map((entry) => (
                            <p key={entry.name} style={{ color: "#f5f0e8", fontSize: 14 }}>
                              <span style={{ textTransform: "capitalize" }}>{entry.name}</span>:{" "}
                              <span style={{ fontWeight: 500 }}>
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
