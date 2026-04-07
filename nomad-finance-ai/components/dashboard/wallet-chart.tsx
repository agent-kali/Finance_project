"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useChartDimensions } from "@/lib/hooks/use-chart-dimensions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { convertCurrency, formatCurrency, formatCompact } from "@/lib/currency";
import { CURRENCY_SYMBOLS, type SupportedCurrency } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet } from "lucide-react";

const CHART_LIGHT = {
  gridStroke: "oklch(0.88 0.01 55 / 0.12)",
  tickFill: "oklch(0.5 0.02 55)",
};
const CHART_DARK = {
  gridStroke: "oklch(0.25 0.008 55 / 0.12)",
  tickFill: "oklch(0.55 0.02 60)",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1814",
  border: "1px solid rgba(184, 149, 106, 0.3)",
  borderRadius: 10,
  padding: "8px 12px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
} as const;

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

export function WalletChart() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_DARK : CHART_LIGHT;
  const { data: wallets, isLoading } = useWallets();
  const displayCurrency = useDisplayCurrency();
  const { ref, width, height } = useChartDimensions();
  const prefersReducedMotion = useReducedMotion();

  const chartData = useMemo(() => {
    if (!wallets?.length) return [];
    return wallets.map((w) => ({
      name: `${w.currency} ${CURRENCY_SYMBOLS[w.currency as SupportedCurrency] ?? ""}`,
      balance: Math.round(convertCurrency(w.balance, w.currency as SupportedCurrency, displayCurrency) * 100) / 100,
      original: w.balance,
      currency: w.currency as SupportedCurrency,
    }));
  }, [wallets, displayCurrency]);

  if (isLoading) {
    return (
      <Card className="glass-card flex min-h-[360px] flex-col">
        <CardHeader>
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="min-h-[220px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card flex min-h-[360px] flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Wallet Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 overflow-hidden px-4 sm:px-6">
        {chartData.length === 0 ? (
          <EmptyState
            icon={Wallet}
            heading="No wallets yet"
            subtext="Create a wallet to see your balance breakdown"
            className="min-h-[220px]"
          />
        ) : chartData.length === 1 ? (
          <div className="flex min-h-[220px] w-full items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-border/30 bg-card/35 px-5 py-5 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {chartData[0].currency} Wallet
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {formatCurrency(chartData[0].original, chartData[0].currency)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {chartData[0].currency} {CURRENCY_SYMBOLS[chartData[0].currency] ?? ""}
              </p>
              {chartData[0].currency !== displayCurrency ? (
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  Approx. {formatCurrency(chartData[0].balance, displayCurrency)}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            ref={ref}
            className="h-[220px] min-w-0 w-full px-1 sm:px-0"
            role="img"
            aria-label={`Wallet balances in ${displayCurrency} equivalent`}
          >
            <p className="sr-only">
              {chartData
                .map(
                  (w) =>
                    `${w.name}: ${formatCurrency(w.balance, displayCurrency)}`
                )
                .join(". ")}
            </p>
            {width > 0 && height > 0 && (() => {
              const isNarrow = width < 400;
              const tickFontSize = isNarrow ? 10 : 12;
              const tickMargin = isNarrow ? 6 : 10;
              const formatTick = (v: number) =>
                isNarrow ? formatCompact(v, displayCurrency) : formatCurrency(v, displayCurrency);
              return (
              <BarChart
                width={width}
                height={height}
                data={chartData}
                margin={{ top: 24, right: isNarrow ? 2 : 8, left: isNarrow ? 30 : 32, bottom: 0 }}
                barSize={48}
                barCategoryGap={isNarrow ? "22%" : "30%"}
              >
                <defs>
                  <linearGradient id="walletBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4b48a" />
                    <stop offset="100%" stopColor="#b8956a" />
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
                  tickFormatter={(v: number) => formatTick(v)}
                  tickMargin={tickMargin}
                />
                <Tooltip
                  cursor={false}
                  wrapperStyle={{ background: "transparent" }}
                  contentStyle={{ background: "transparent", border: "none", padding: 0 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as (typeof chartData)[number];
                    return (
                      <div style={TOOLTIP_STYLE} title="Converted at Frankfurter rate">
                        <p style={{ color: "rgba(245, 240, 232, 0.6)", fontSize: 12, marginBottom: 4 }}>
                          {item.name}
                        </p>
                        <p style={{ color: "#f5f0e8", fontSize: 14, fontWeight: 500 }}>
                          {formatCurrency(item.original, item.currency)}
                        </p>
                        <p style={{ color: "rgba(245, 240, 232, 0.6)", fontSize: 12 }}>
                          &asymp; {formatCurrency(item.balance, displayCurrency)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="balance"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                  minPointSize={6}
                  fill="url(#walletBarGrad)"
                  shape={(
                    props: {
                      x?: number;
                      y?: number;
                      width?: number;
                      height?: number;
                      index?: number;
                    }
                  ) => {
                    const { x = 0, y = 0, width = 0, height: rawH = 0, index = 0 } = props;
                    const h = Math.max(rawH, 4);
                    const ny = rawH > 0 ? y : y + rawH - h;
                    const d = roundedTopRect(x, ny, width, h, 6);

                    if (prefersReducedMotion) {
                      return <path d={d} fill="url(#walletBarGrad)" />;
                    }

                    return (
                      <motion.path
                        d={d}
                        fill="url(#walletBarGrad)"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        style={{ transformOrigin: `${x + width / 2}px ${ny + h}px` }}
                        transition={{
                          type: "spring",
                          stiffness: 120,
                          damping: 20,
                          delay: (index ?? 0) * 0.1,
                        }}
                      />
                    );
                  }}
                >
                  <LabelList
                    dataKey="balance"
                    position="top"
                    style={{ fontSize: 12, fill: "rgba(245, 240, 232, 0.6)" }}
                    formatter={(v: unknown) => formatCompact(Number(v), displayCurrency)}
                  />
                </Bar>
              </BarChart>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
