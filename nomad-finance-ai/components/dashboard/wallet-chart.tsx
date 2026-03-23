"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
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

const WALLET_FILLS = ["#C9A96E", "#B8944F", "#A07D3A", "#8A6C30", "#735A28"];

const CHART_LIGHT = {
  gridStroke: "oklch(0.88 0.01 55 / 0.4)",
  tickFill: "oklch(0.5 0.02 55)",
};
const CHART_DARK = {
  gridStroke: "oklch(0.25 0.008 55 / 0.15)",
  tickFill: "oklch(0.55 0.02 60)",
};

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
          <Skeleton className="min-h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card flex min-h-[360px] flex-col">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Wallet Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 overflow-hidden">
        {chartData.length === 0 ? (
          <EmptyState
            icon={Wallet}
            heading="No wallets yet"
            subtext="Create a wallet to see your balance breakdown"
            className="min-h-[300px]"
          />
        ) : (
          <div
            ref={ref}
            className="h-[300px] min-w-0 w-full"
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
              const tickFontSize = isNarrow ? 10 : 11;
              const formatTick = (v: number) =>
                isNarrow ? formatCompact(v, displayCurrency) : formatCurrency(v, displayCurrency);
              return (
              <BarChart
                width={width}
                height={height}
                data={chartData}
                margin={{ top: 8, right: 8, left: isNarrow ? 40 : 28, bottom: 0 }}
                barSize={Math.min(
                  52,
                  Math.max(24, Math.floor((width - 60) / Math.max(chartData.length, 1)))
                )}
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
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as (typeof chartData)[number];
                    return (
                      <div className="glass-tooltip rounded-xl px-4 py-3" title="Converted at Frankfurter rate">
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(item.original, item.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          &asymp; {formatCurrency(item.balance, displayCurrency)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="balance"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={WALLET_FILLS[i % WALLET_FILLS.length]}
                    />
                  ))}
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
