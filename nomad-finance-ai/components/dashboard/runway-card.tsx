"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";

interface CityConfig {
  readonly city: string;
  readonly flag: string;
  readonly dailyCostUSD: number;
  readonly rgb: string;
  readonly numberColor: string;
}

/* --- Mock data: estimated daily living costs (USD) per city --- */
const CITY_COSTS: readonly CityConfig[] = [
  {
    city: "Ho Chi Minh City",
    flag: "\u{1F1FB}\u{1F1F3}",
    dailyCostUSD: 38,
    rgb: "74,222,128",
    numberColor: "#4ade80",
  },
  {
    city: "Bangkok",
    flag: "\u{1F1F9}\u{1F1ED}",
    dailyCostUSD: 65,
    rgb: "251,191,36",
    numberColor: "#fbbf24",
  },
  {
    city: "Berlin",
    flag: "\u{1F1E9}\u{1F1EA}",
    dailyCostUSD: 120,
    rgb: "248,113,113",
    numberColor: "#f87171",
  },
];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RunwayCard() {
  const { data: wallets } = useWallets();
  const { data: transactions } = useTransactions();
  const displayCurrency = useDisplayCurrency();

  const totalBalance = useMemo(
    () =>
      (wallets ?? []).reduce(
        (sum, w) =>
          sum +
          convertCurrency(
            w.balance,
            w.currency as SupportedCurrency,
            displayCurrency,
          ),
        0,
      ),
    [wallets, displayCurrency],
  );

  const balanceInUSD = useMemo(
    () => convertCurrency(totalBalance, displayCurrency, "USD"),
    [totalBalance, displayCurrency],
  );

  const todaySpending = useMemo(() => {
    const txs = transactions ?? [];
    const todayKey = toDateKey(new Date());
    return txs
      .filter(
        (t) =>
          t.type === "expense" &&
          toDateKey(new Date(t.date)) === todayKey,
      )
      .reduce(
        (sum, t) =>
          sum +
          convertCurrency(
            t.amount,
            t.currency as SupportedCurrency,
            displayCurrency,
          ),
        0,
      );
  }, [transactions, displayCurrency]);

  return (
    <div
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(184,149,106,0.15)",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <p
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(184,149,106,0.6)",
          margin: 0,
        }}
      >
        YOUR RUNWAY
      </p>
      <p
        style={{
          fontSize: 12,
          color: "rgba(245,240,232,0.35)",
          margin: "2px 0 0",
        }}
      >
        how long your balance lasts
      </p>
      <p
        style={{
          fontSize: 12,
          color: "rgba(245,240,232,0.3)",
          margin: "6px 0 0",
        }}
      >
        balance {formatCurrency(totalBalance, displayCurrency)} &middot; spending{" "}
        {formatCurrency(todaySpending, displayCurrency)} today
      </p>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginTop: 16,
        }}
      >
        {CITY_COSTS.map((city, i) => {
          const days =
            balanceInUSD > 0 && city.dailyCostUSD > 0
              ? Math.floor(balanceInUSD / city.dailyCostUSD)
              : 0;

          return (
            <motion.div
              key={city.city}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{
                minHeight: 160,
                borderRadius: 12,
                background: `rgba(${city.rgb}, 0.08)`,
                border: `1px solid rgba(${city.rgb}, 0.25)`,
                padding: "16px 20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(245,240,232,0.75)",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {city.flag} {city.city}
              </p>
              <p
                style={{
                  fontSize: 64,
                  fontWeight: 300,
                  color: city.numberColor,
                  margin: "8px 0 0",
                  lineHeight: 1.1,
                }}
              >
                {days}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(245,240,232,0.35)",
                  margin: "4px 0 0",
                }}
              >
                ${city.dailyCostUSD} / day
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
