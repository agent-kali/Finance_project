"use client";

import type { CSSProperties, ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import { CURRENCY_SYMBOLS, type SupportedCurrency } from "@/lib/constants";
import {
  SPENDING_BREAKDOWN_ICONS,
  getSpendingCategoryVisual,
  type SpendingBreakdownIconName,
} from "@/components/dashboard/spending-breakdown-config";

type DeltaDirection = "up" | "down" | "flat" | "new";

interface SpendingBreakdownTransaction {
  readonly name: string;
  readonly amountValue: number;
}

export interface SpendingBreakdownCategory {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly pct: number;
  readonly color: string;
  readonly bg: string;
  readonly delta: string;
  readonly deltaDir: DeltaDirection;
  readonly deltaPoints: number;
  readonly showDeltaBadge: boolean;
  readonly transactionCount: number;
  readonly transactions: SpendingBreakdownTransaction[];
  readonly icon: SpendingBreakdownIconName;
}

interface SpendingBreakdownProps {
  readonly categories: SpendingBreakdownCategory[];
  readonly total: number;
  readonly period: string;
}

interface RawCategoryGroup {
  amount: number;
  transactions: Array<{
    name: string;
    amountValue: number;
  }>;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PROGRESS_BAR_TRANSITION = "width 1000ms cubic-bezier(0.22, 1, 0.36, 1)";
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCurrencyTight(amount: number, currency: SupportedCurrency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return formatCurrency(amount, currency).replace(
    new RegExp(`^(${symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s+`),
    "$1",
  );
}

function splitCurrencyTightParts(
  amount: number,
  currency: SupportedCurrency,
): { symbol: string; value: string } {
  const tight = formatCurrencyTight(amount, currency);
  const symbol = CURRENCY_SYMBOLS[currency];
  if (symbol && tight.startsWith(symbol)) {
    return { symbol, value: tight.slice(symbol.length) };
  }
  return { symbol: "", value: tight };
}

/** Symbol + figures in one line; avoids $/€ sitting high vs digits in tight layouts. */
function CurrencyTightText({
  amount,
  currency,
  style,
}: {
  amount: number;
  currency: SupportedCurrency;
  style?: CSSProperties;
}) {
  const { symbol, value } = splitCurrencyTightParts(amount, currency);
  const bareDollar = symbol === "$";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        minWidth: 0,
        ...style,
      }}
    >
      {symbol ? (
        <span
          style={{
            display: "inline-block",
            lineHeight: 1,
            ...(bareDollar ? { transform: "translateY(0.06em)" } : null),
          }}
        >
          {symbol}
        </span>
      ) : null}
      <span style={{ display: "inline-block", lineHeight: 1 }}>{value}</span>
    </span>
  );
}

function parseDateOnly(value: string): Date {
  return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isBetween(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function getTransactionLabel(description: string | null, fallback: string): string {
  if (description?.trim()) {
    const firstPart = description.split("—")[0]?.trim() ?? description.trim();
    return firstPart.length > 44 ? `${firstPart.slice(0, 41)}...` : firstPart;
  }

  return fallback;
}

function formatCurrencyDelta(
  amountChange: number,
  currency: SupportedCurrency,
): { delta: string; deltaDir: DeltaDirection } {
  const rounded = roundCurrency(amountChange);
  if (rounded > 0) {
    return { delta: `+${formatCurrencyTight(rounded, currency)}`, deltaDir: "up" };
  }
  if (rounded < 0) {
    return {
      delta: `−${formatCurrencyTight(Math.abs(rounded), currency)}`,
      deltaDir: "down",
    };
  }
  return { delta: "flat", deltaDir: "flat" };
}

function ProportionalStripSegment({
  category,
  segmentIndex,
  segmentCount,
  displayCurrency,
  highlightedId,
  selectedId,
  setHover,
  toggleSelection,
  prefersReducedMotion,
}: {
  category: SpendingBreakdownCategory;
  segmentIndex: number;
  segmentCount: number;
  displayCurrency: SupportedCurrency;
  highlightedId: string | null;
  selectedId: string | null;
  setHover: (id: string | null) => void;
  toggleSelection: (id: string) => void;
  prefersReducedMotion: boolean;
}) {
  const isActive = highlightedId === category.id;
  const isDimmed = Boolean(highlightedId) && !isActive;

  return (
    <button
      type="button"
      aria-pressed={selectedId === category.id}
      onMouseEnter={() => setHover(category.id)}
      onMouseLeave={() => setHover(null)}
      onFocus={() => setHover(category.id)}
      onBlur={() => setHover(null)}
      onClick={() => toggleSelection(category.id)}
      style={{
        position: "relative",
        boxSizing: "border-box",
        flexGrow: category.pct,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 0,
        height: "100%",
        alignSelf: "stretch",
        overflow: "hidden",
        border: "none",
        outline: "none",
        padding: "10px 12px",
        background: category.bg,
        color: category.color,
        opacity: isDimmed ? 0.52 : 1,
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "stretch",
        cursor: "pointer",
        transition: "opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)",
        borderTopLeftRadius: segmentIndex === 0 ? 10 : 0,
        borderBottomLeftRadius: segmentIndex === 0 ? 10 : 0,
        borderTopRightRadius: segmentIndex === segmentCount - 1 ? 10 : 0,
        borderBottomRightRadius: segmentIndex === segmentCount - 1 ? 10 : 0,
      }}
    >
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 3,
        }}
      >
        <div
          style={{
            width: "100%",
            minWidth: 0,
            flexShrink: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "clamp(11px, 2.8vw, 13px)",
            lineHeight: 1.2,
          }}
        >
          <CurrencyTightText
            amount={category.amount}
            currency={displayCurrency}
            style={{
              fontWeight: 600,
              color: "#faf7f2",
              textShadow: "0 1px 2px rgba(0,0,0,0.45)",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          />
        </div>
        <span
          style={{
            display: "block",
            width: "100%",
            minWidth: 0,
            flexShrink: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(245,240,232,0.88)",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            lineHeight: 1.2,
          }}
        >
          {category.name}
        </span>
      </div>
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ scaleX: isActive ? 1 : 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: EASE }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: category.color,
          transformOrigin: "center",
        }}
      />
    </button>
  );
}

function getInsightLine(
  categories: SpendingBreakdownCategory[],
  total: number,
  currency: SupportedCurrency,
): ReactElement {
  if (total <= 0 || categories.length === 0) {
    return (
      <>
        <span style={{ fontWeight: 600 }}>
          <CurrencyTightText amount={total} currency={currency} />
        </span>{" "}
        spent this week. No category movement yet.
      </>
    );
  }

  const topCategory = categories[0];
  const share = Math.round(topCategory.pct);
  const deltaText =
    !topCategory.showDeltaBadge
      ? "no last-week comparison yet"
      : topCategory.deltaDir === "flat"
        ? "flat vs last week"
        : topCategory.deltaDir === "new"
          ? "new this week"
          : `${topCategory.deltaDir} ${Math.abs(topCategory.deltaPoints)} points from last week`;

  return (
    <>
      <span style={{ fontWeight: 600 }}>
        <CurrencyTightText amount={total} currency={currency} />
      </span>{" "}
      spent -{" "}
      <span style={{ fontWeight: 600 }}>{topCategory.name}</span> took{" "}
      <span style={{ fontWeight: 600 }}>{share}%</span>, {deltaText}
    </>
  );
}

export function SpendingBreakdown({
  categories,
  total,
  period,
}: SpendingBreakdownProps) {
  const displayCurrency = useDisplayCurrency();
  const prefersReducedMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hasPlayedInitialProgressAnimationRef = useRef(false);
  const [areProgressBarsAtTargetWidth, setAreProgressBarsAtTargetWidth] = useState(false);
  const [hasCompletedInitialProgressAnimation, setHasCompletedInitialProgressAnimation] =
    useState(false);

  const progressBarWidthAtTarget = prefersReducedMotion || areProgressBarsAtTargetWidth;
  const progressBarTransitionOff =
    prefersReducedMotion || hasCompletedInitialProgressAnimation;

  const highlightedId = selectedId ?? hoveredId;

  const setHover = (id: string | null) => {
    if (selectedId) return;
    setHoveredId(id);
  };

  const toggleSelection = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
    setHoveredId(null);
  };

  useEffect(() => {
    if (prefersReducedMotion) {
      hasPlayedInitialProgressAnimationRef.current = true;
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    if (hasPlayedInitialProgressAnimationRef.current) {
      queueMicrotask(() => {
        setAreProgressBarsAtTargetWidth(true);
        setHasCompletedInitialProgressAnimation(true);
      });
      return;
    }

    if (categories.length === 0) {
      queueMicrotask(() => {
        setAreProgressBarsAtTargetWidth(false);
      });
      return;
    }

    queueMicrotask(() => {
      setAreProgressBarsAtTargetWidth(false);
      setHasCompletedInitialProgressAnimation(false);
    });

    const frameId = window.requestAnimationFrame(() => {
      setAreProgressBarsAtTargetWidth(true);
    });

    const timeoutId = window.setTimeout(() => {
      hasPlayedInitialProgressAnimationRef.current = true;
      setHasCompletedInitialProgressAnimation(true);
    }, 1000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [categories.length, prefersReducedMotion]);

  return (
    <div className="min-w-0 max-w-full" style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            color: "#8B7355",
          }}
        >
          WHERE IT WENT
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "rgba(245,240,232,0.35)",
            whiteSpace: "nowrap",
          }}
        >
          {period}
        </p>
      </div>

      <p
        style={{
          margin: "10px 0 0",
          fontSize: 14,
          lineHeight: 1.6,
          color: "rgba(245,240,232,0.72)",
        }}
      >
        {getInsightLine(categories, total, displayCurrency)}
      </p>

      {categories.length === 0 ? (
        <div
          style={{
            padding: "28px 0 8px",
            color: "rgba(245,240,232,0.3)",
            fontSize: 14,
          }}
        >
          No spending data yet.
        </div>
      ) : (
        <>
          <div className="hidden w-full min-w-0 flex-col overflow-hidden pt-5 md:flex">
            <div
              className="flex h-14 w-full min-w-0 gap-0.5 overflow-hidden"
              style={{
                boxSizing: "border-box",
              }}
            >
              {categories.map((category, index) => (
                <ProportionalStripSegment
                  key={category.id}
                  category={category}
                  segmentIndex={index}
                  segmentCount={categories.length}
                  displayCurrency={displayCurrency}
                  highlightedId={highlightedId}
                  selectedId={selectedId}
                  setHover={setHover}
                  toggleSelection={toggleSelection}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            {categories.map((category, index) => {
              const Icon = SPENDING_BREAKDOWN_ICONS[category.icon];
              const isActive = highlightedId === category.id;
              const isSelected = selectedId === category.id;
              const isLast = index === categories.length - 1;
              const badgeColors =
                category.deltaDir === "up"
                  ? {
                      color: "#D4A054",
                      background: "rgba(212,160,84,0.07)",
                    }
                  : category.deltaDir === "new"
                    ? {
                        color: "#D4A054",
                        background: "rgba(212,160,84,0.07)",
                      }
                  : category.deltaDir === "down"
                    ? {
                        color: "#4ECDC4",
                        background: "rgba(78,205,196,0.07)",
                      }
                    : {
                        color: "#58524A",
                        background: "rgba(88,82,74,0.07)",
                      };

              return (
                <div
                  key={category.id}
                  style={{
                    position: "relative",
                    borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <motion.div
                    aria-hidden="true"
                    initial={false}
                    animate={{ scaleY: isActive ? 1 : 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: EASE }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 14,
                      bottom: 14,
                      width: 3,
                      borderRadius: 999,
                      background: category.color,
                      transformOrigin: "top",
                    }}
                  />

                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onMouseEnter={() => setHover(category.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(category.id)}
                    onBlur={() => setHover(null)}
                    onClick={() => toggleSelection(category.id)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "14px 0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 0,
                        paddingLeft: isActive ? 8 : 0,
                        transition:
                          "padding-left 350ms cubic-bezier(0.22, 1, 0.36, 1), color 250ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      <motion.div
                        animate={{ scale: isActive ? 1.5 : 1 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: EASE }}
                        style={{
                          width: 8,
                          height: 8,
                          flexShrink: 0,
                          borderRadius: "50%",
                          background: category.color,
                        }}
                      />

                      <motion.div
                        animate={{ scale: isActive ? 1.06 : 1 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: EASE }}
                        style={{
                          width: 28,
                          height: 28,
                          flexShrink: 0,
                          borderRadius: 8,
                          background: category.bg,
                          color: category.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={14} strokeWidth={2} />
                      </motion.div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 16,
                            minWidth: 0,
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 500,
                                color: isActive ? "#fff" : "rgba(245,240,232,0.9)",
                                transition: "color 250ms cubic-bezier(0.22, 1, 0.36, 1)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                minWidth: 0,
                              }}
                            >
                              {category.name}
                            </p>
                            <div
                              style={{
                                marginTop: 4,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "rgba(245,240,232,0.38)",
                                }}
                              >
                                {category.transactionCount} transaction
                                {category.transactionCount !== 1 ? "s" : ""}
                              </span>
                              {category.showDeltaBadge ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    ...badgeColors,
                                  }}
                                >
                                  {category.delta}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div
                            style={{
                              flexShrink: 0,
                              textAlign: "right",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: 15,
                                fontWeight: 500,
                                color: isActive ? "#fff" : "rgba(245,240,232,0.9)",
                                transition: "color 250ms cubic-bezier(0.22, 1, 0.36, 1)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <CurrencyTightText
                                amount={category.amount}
                                currency={displayCurrency}
                              />
                            </p>
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: 11,
                                color: "rgba(245,240,232,0.35)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {Math.round(category.pct)}%
                            </p>
                          </div>
                        </div>

                        <div
                          aria-hidden="true"
                          style={{
                            marginTop: 10,
                            width: "100%",
                            height: 3,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: progressBarWidthAtTarget
                                ? `${Math.max(category.pct, 0)}%`
                                : "0%",
                              height: "100%",
                              borderRadius: 999,
                              background: category.color,
                              transition: progressBarTransitionOff
                                ? "none"
                                : PROGRESS_BAR_TRANSITION,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isSelected ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: EASE }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="pt-1 pb-4 pl-0 sm:pl-11">
                          <div
                            style={{
                              borderTop: "0.5px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            {category.transactions.slice(0, 3).map((transaction, txIndex) => (
                              <div
                                key={`${category.id}-${transaction.name}-${txIndex}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  padding: "10px 0",
                                  borderBottom:
                                    txIndex === Math.min(category.transactions.length, 3) - 1
                                      ? "none"
                                      : "0.5px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                <span
                                  style={{
                                    minWidth: 0,
                                    fontSize: 12,
                                    color: "rgba(245,240,232,0.72)",
                                  }}
                                >
                                  {transaction.name}
                                </span>
                                <CurrencyTightText
                                  amount={transaction.amountValue}
                                  currency={displayCurrency}
                                  style={{
                                    flexShrink: 0,
                                    fontSize: 12,
                                    color: "rgba(245,240,232,0.88)",
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardSpendingBreakdown() {
  const { data: transactions } = useTransactions();
  const displayCurrency = useDisplayCurrency();

  const { categories, total } = useMemo(() => {
    const currentGroups = new Map<string, RawCategoryGroup>();
    const previousAmounts = new Map<string, number>();
    const txs = transactions ?? [];
    const today = startOfDay(new Date());
    const currentStart = addDays(today, -6);
    const previousStart = addDays(currentStart, -7);
    const currentEnd = new Date();
    const previousEnd = new Date(currentStart.getTime() - 1);

    let currentTotal = 0;
    let previousTotal = 0;

    for (const tx of txs) {
      if (tx.type !== "expense") continue;

      const txDate = parseDateOnly(tx.date);
      const amount = roundCurrency(
        convertCurrency(
          tx.amount,
          tx.currency as SupportedCurrency,
          displayCurrency,
        ),
      );

      if (isBetween(txDate, currentStart, currentEnd)) {
        const group = currentGroups.get(tx.category) ?? {
          amount: 0,
          transactions: [],
        };

        group.amount += amount;
        group.transactions.push({
          name: getTransactionLabel(tx.description, tx.category),
          amountValue: amount,
        });

        currentGroups.set(tx.category, group);
        currentTotal += amount;
        continue;
      }

      if (isBetween(txDate, previousStart, previousEnd)) {
        previousAmounts.set(
          tx.category,
          (previousAmounts.get(tx.category) ?? 0) + amount,
        );
        previousTotal += amount;
      }
    }

    const categories = Array.from(currentGroups.entries())
      .map(([rawName, group]) => {
        const visual = getSpendingCategoryVisual(rawName);
        const amount = roundCurrency(group.amount);
        const pct = currentTotal > 0 ? (amount / currentTotal) * 100 : 0;
        const roundedPct = Math.round(pct);
        const previousAmount = previousAmounts.get(rawName) ?? 0;
        const previousPct =
          previousTotal > 0
            ? (previousAmount / previousTotal) * 100
            : 0;
        const roundedPreviousPct = Math.round(previousPct);

        const deltaPoints = roundedPct - roundedPreviousPct;
        const deltaAmount = roundCurrency(amount - previousAmount);
        let delta = "flat";
        let deltaDir: DeltaDirection = "flat";
        let showDeltaBadge = true;

        if (previousTotal <= 0) {
          showDeltaBadge = false;
        } else if (previousAmount <= 0) {
          delta = "new";
          deltaDir = "new";
        } else {
          const formatted = formatCurrencyDelta(deltaAmount, displayCurrency);
          delta = formatted.delta;
          deltaDir = formatted.deltaDir;
        }

        return {
          id: rawName,
          name: visual.label,
          amount,
          pct,
          color: visual.color,
          bg: visual.bg,
          delta,
          deltaDir,
          deltaPoints,
          showDeltaBadge,
          transactionCount: group.transactions.length,
          transactions: group.transactions
            .slice()
            .sort((a, b) => b.amountValue - a.amountValue)
            .slice(0, 3)
            .map((transaction) => ({
              name: transaction.name,
              amountValue: transaction.amountValue,
            })),
          icon: visual.icon,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      categories,
      total: roundCurrency(currentTotal),
    };
  }, [transactions, displayCurrency]);

  return <SpendingBreakdown categories={categories} total={total} period="this week" />;
}
