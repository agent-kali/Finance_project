"use client";

import { useMemo } from "react";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useChartDimensions } from "@/lib/hooks/use-chart-dimensions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import { CURRENCY_SYMBOLS, type SupportedCurrency } from "@/lib/constants";

const CURRENCY_COLORS: Record<string, string> = {
  USD: "#22d3ee",
  EUR: "#34d399",
  PLN: "#a78bfa",
  VND: "#f59e0b",
  GBP: "#fb923c",
};

const CHART_LIGHT = {
  gridStroke: "oklch(0.88 0.01 270 / 0.6)",
  tickFill: "oklch(0.4 0.02 270)",
};
const CHART_DARK = {
  gridStroke: "oklch(0.3 0.01 270 / 0.3)",
  tickFill: "oklch(0.6 0.02 270)",
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
      <Card className="glass-card glass-card-chart rounded-2xl">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card glass-card-hover glass-card-chart rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Wallet Balances ({displayCurrency} equivalent)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2">
            <p className="text-center text-sm text-muted-foreground">
              No wallets yet
            </p>
            <Button variant="link" asChild>
              <Link href="/wallets">Create a wallet</Link>
            </Button>
          </div>
        ) : (
          <div
            ref={ref}
            className="h-[300px]"
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
            {width > 0 && height > 0 && (
              <BarChart
                width={width}
                height={height}
                data={chartData}
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
                  tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                  tickFormatter={(v: number) => formatCurrency(v, displayCurrency)}
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
                          ≈ {formatCurrency(item.balance, displayCurrency)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="balance"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  shape={(props: { x: number; y: number; width: number; height: number; fill?: string }) => {
                    const { x, y, width, height, fill = "#22d3ee" } = props;
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={fill}
                        rx={6}
                        ry={0}
                      />
                    );
                  }}
                >
                  {chartData.map((w) => (
                    <Cell
                      key={w.currency}
                      fill={CURRENCY_COLORS[w.currency] ?? "#22d3ee"}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
