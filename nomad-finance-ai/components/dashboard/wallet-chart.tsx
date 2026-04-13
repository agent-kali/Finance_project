"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import { type SupportedCurrency } from "@/lib/constants";

interface WalletPalette {
  readonly background: string;
  readonly border: string;
  readonly barGradient: string;
  readonly glow: string;
  readonly tag: string;
}

interface WalletCardData {
  readonly id: string;
  readonly currency: SupportedCurrency;
  readonly name: string;
  readonly flag: string;
  readonly tag: string;
  readonly originalBalance: number;
  readonly comparableBalance: number;
  readonly width: number;
  readonly todayActivity: number;
  readonly hasTodayActivity: boolean;
  readonly lastUsedLabel: string;
  readonly palette: WalletPalette;
}

const defaultPalette: WalletPalette = {
  background: "linear-gradient(135deg,#1a1710,#221e12)",
  border: "rgba(184,149,106,0.2)",
  barGradient: "linear-gradient(90deg, #b8956a, #d4b48a)",
  glow: "rgba(184,149,106,0.1)",
  tag: "Primary",
};

const walletPalettes: Partial<Record<SupportedCurrency, WalletPalette>> = {
  EUR: defaultPalette,
  USD: {
    background: "linear-gradient(135deg,#111209,#161a0e)",
    border: "rgba(99,153,34,0.15)",
    barGradient: "linear-gradient(90deg, #639922, #97c459)",
    glow: "rgba(99,153,34,0.07)",
    tag: "Freelance",
  },
  PLN: {
    background: "linear-gradient(135deg,#120f11,#1a1218)",
    border: "rgba(167,139,250,0.12)",
    barGradient: "linear-gradient(90deg, #a78bfa, #c4b5fd)",
    glow: "rgba(167,139,250,0.06)",
    tag: "Local cash",
  },
};

const currencyFlags: Partial<Record<SupportedCurrency, string>> = {
  EUR: "🇪🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  VND: "🇻🇳",
  PLN: "🇵🇱",
  THB: "🇹🇭",
  IDR: "🇮🇩",
  MYR: "🇲🇾",
  SGD: "🇸🇬",
  JPY: "🇯🇵",
  TRY: "🇹🇷",
  AED: "🇦🇪",
  MXN: "🇲🇽",
  BRL: "🇧🇷",
  CHF: "🇨🇭",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  HKD: "🇭🇰",
  KRW: "🇰🇷",
  INR: "🇮🇳",
  PHP: "🇵🇭",
  NZD: "🇳🇿",
  ZAR: "🇿🇦",
};

const currencyDisplayNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "currency" })
    : null;

function getCurrencyName(currency: SupportedCurrency): string {
  return currencyDisplayNames?.of(currency) ?? currency;
}

function getWalletPalette(currency: SupportedCurrency): WalletPalette {
  return walletPalettes[currency] ?? defaultPalette;
}

function parseTxDate(value: string): Date {
  return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getLastUsedLabel(lastUsedAt?: string): string {
  if (!lastUsedAt) return "last used never";

  const now = new Date();
  const used = parseTxDate(lastUsedAt);
  const diffMs = now.getTime() - used.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const dayDiff = Math.max(0, Math.floor(diffMs / dayMs));

  if (dayDiff === 0) return "last used today";
  if (dayDiff === 1) return "last used 1d ago";
  if (dayDiff < 7) return `last used ${dayDiff}d ago`;

  const weekDiff = Math.floor(dayDiff / 7);
  if (weekDiff < 5) return `last used ${weekDiff}w ago`;

  const monthDiff =
    (now.getFullYear() - used.getFullYear()) * 12 + (now.getMonth() - used.getMonth());
  if (monthDiff <= 1) return "last used 1mo ago";
  return `last used ${monthDiff}mo ago`;
}

export function WalletChart() {
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const displayCurrency = useDisplayCurrency();
  const prefersReducedMotion = useReducedMotion();

  const stripVariants: Variants = prefersReducedMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

  const cardVariants: Variants = prefersReducedMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: "easeOut" },
        },
      };

  const walletCards = useMemo((): WalletCardData[] => {
    if (!wallets?.length) return [];

    const txsByWallet = new Map<string, typeof transactions>();
    for (const tx of transactions ?? []) {
      const walletTxs = txsByWallet.get(tx.wallet_id) ?? [];
      walletTxs.push(tx);
      txsByWallet.set(tx.wallet_id, walletTxs);
    }

    const comparableBalances = wallets.map((wallet) =>
      Math.max(
        convertCurrency(
          wallet.balance,
          wallet.currency as SupportedCurrency,
          displayCurrency
        ),
        0
      )
    );
    const maxBalance = Math.max(...comparableBalances, 0);
    const today = new Date();

    return wallets
      .map((wallet, index) => {
        const currency = wallet.currency as SupportedCurrency;
        const walletTxs = txsByWallet.get(wallet.id) ?? [];

        let todayActivity = 0;
        let hasTodayActivity = false;
        let lastUsedAt: string | undefined;
        let lastUsedTime = -Infinity;

        for (const tx of walletTxs) {
          const txDate = parseTxDate(tx.date);

          if (isSameDay(txDate, today)) {
            hasTodayActivity = true;
            todayActivity += tx.type === "income" ? tx.amount : -tx.amount;
          }

          const txTime = txDate.getTime();
          if (txTime > lastUsedTime) {
            lastUsedTime = txTime;
            lastUsedAt = tx.date;
          }
        }

        const comparableBalance = comparableBalances[index];

        return {
          id: wallet.id,
          currency,
          name: getCurrencyName(currency),
          flag: currencyFlags[currency] ?? "💱",
          tag: getWalletPalette(currency).tag,
          originalBalance: wallet.balance,
          comparableBalance,
          width: maxBalance > 0 ? (comparableBalance / maxBalance) * 100 : 0,
          todayActivity,
          hasTodayActivity,
          lastUsedLabel: getLastUsedLabel(lastUsedAt),
          palette: getWalletPalette(currency),
        };
      })
      .sort((a, b) => b.comparableBalance - a.comparableBalance)
      .slice(0, 3);
  }, [wallets, transactions, displayCurrency]);

  const accessibilitySummary = useMemo(
    () =>
      walletCards
        .map((card) => {
          const activityText = !card.hasTodayActivity
            ? "quiet today"
            : card.todayActivity > 0
              ? `up ${formatCurrency(card.todayActivity, card.currency)} today`
              : card.todayActivity < 0
                ? `down ${formatCurrency(Math.abs(card.todayActivity), card.currency)} today`
                : "flat today";

          return `${card.name}: balance ${formatCurrency(card.originalBalance, card.currency)}, ${activityText}, ${card.lastUsedLabel}.`;
        })
        .join(" "),
    [walletCards]
  );

  const isLoading = walletsLoading || transactionsLoading;

  return (
    <motion.div
      className="min-w-0 max-w-full w-full"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
    >
      {isLoading ? (
        <div className="grid w-full grid-cols-1 gap-[10px] md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Skeleton className="h-5 w-5 rounded-full" />
                <div style={{ flex: 1 }}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-2 w-14" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-6 h-7 w-24" />
              <Skeleton className="mt-4 h-[3px] w-full rounded-full" />
              <Skeleton className="mt-4 h-2 w-20" />
            </div>
          ))}
        </div>
      ) : walletCards.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <EmptyState
            icon={Wallet}
            heading="No wallets yet"
            subtext="Create a wallet to see your balance breakdown"
            className="min-h-[220px]"
          />
        </div>
      ) : (
        <motion.div
          role="list"
          aria-label="Top wallet balances"
          variants={stripVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid w-full grid-cols-1 gap-[10px] md:grid-cols-3"
        >
          <p className="sr-only">{accessibilitySummary}</p>
          {walletCards.map((card, index) => {
            const showActivityBadge = card.todayActivity !== 0;

            const activityBadge =
              showActivityBadge && card.todayActivity > 0 ? (
                <span
                  style={{
                    marginLeft: "auto",
                    position: "relative",
                    zIndex: 1,
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    background: "rgba(74, 222, 128, 0.08)",
                    border: "1px solid rgba(74, 222, 128, 0.16)",
                    color: "#86efac",
                  }}
                >
                  {`+${formatCurrency(card.todayActivity, card.currency)}`}
                </span>
              ) : showActivityBadge ? (
                <span
                  style={{
                    marginLeft: "auto",
                    position: "relative",
                    zIndex: 1,
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    background: "rgba(224,122,95,0.08)",
                    border: "1px solid rgba(224,122,95,0.16)",
                    color: "#E07A5F",
                  }}
                >
                  {`−${formatCurrency(Math.abs(card.todayActivity), card.currency)}`}
                </span>
              ) : null;

            return (
              <motion.article
                key={card.id}
                role="listitem"
                variants={cardVariants}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 12,
                  padding: 16,
                  background: card.palette.background,
                  border: `1px solid ${card.palette.border}`,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: card.palette.glow,
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{card.flag}</span>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#f5f0e8",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "visible",
                      }}
                    >
                      {card.name}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 9,
                        color: "rgba(245,240,232,0.35)",
                        lineHeight: 1.2,
                      }}
                    >
                      {card.tag}
                    </p>
                  </div>
                  {activityBadge}
                </div>

                <p
                  style={{
                    position: "relative",
                    zIndex: 1,
                    margin: "18px 0 10px",
                    fontSize: 22,
                    fontWeight: 300,
                    color: "#f5f0e8",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  {formatCurrency(card.originalBalance, card.currency)}
                </p>

                <div
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    height: 2,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={prefersReducedMotion ? false : { width: 0 }}
                    whileInView={{ width: `${card.width}%` }}
                    viewport={{ once: true }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.9,
                      ease: "easeOut",
                      delay: prefersReducedMotion ? 0 : index * 0.15,
                    }}
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background: card.palette.barGradient,
                      opacity: 0.4,
                      minWidth: card.width > 0 ? 4 : 0,
                    }}
                  />
                </div>

                <p
                  style={{
                    position: "relative",
                    zIndex: 1,
                    margin: "10px 0 0",
                    fontSize: 9,
                    color: "rgba(245,240,232,0.2)",
                    lineHeight: 1.2,
                  }}
                >
                  {card.lastUsedLabel}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
