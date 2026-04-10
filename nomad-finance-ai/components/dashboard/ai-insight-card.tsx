"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useTimeRange, type TimeRange } from "@/lib/time-range-context";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { getDateRange } from "@/lib/date-utils";
import { convertCurrency, formatCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/constants";

const MAX_MESSAGES = 6;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function getPreviousPeriodRange(timeRange: TimeRange): { start: Date; end: Date } {
  const { start, end } = getDateRange(timeRange);
  const durationMs = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - durationMs - 1),
    end: new Date(start.getTime() - 1),
  };
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function trimMessages(msgs: ChatMessage[]): ChatMessage[] {
  return msgs.length <= MAX_MESSAGES ? msgs : msgs.slice(-MAX_MESSAGES);
}

export function AiInsightCard() {
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const todaySpendingAmount = useMemo(() => {
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

  const { insight, topCategory, topCategoryPct } = useMemo(() => {
    const convert = (amount: number, currency: string) =>
      convertCurrency(amount, currency as SupportedCurrency, displayCurrency);

    const periodLabel =
      timeRange === "Today" ? "today" : timeRange === "This Week" ? "this week" : "this month";
    const previousPeriodLabel =
      timeRange === "Today" ? "day" : timeRange === "This Week" ? "week" : "month";

    if (!transactions?.length) {
      return {
        insight: `No activity yet ${periodLabel}. Start tracking your finances.`,
        topCategory: null as string | null,
        topCategoryPct: 0,
      };
    }

    const { start, end } = getDateRange(timeRange);
    const prev = getPreviousPeriodRange(timeRange);

    const currentExpenseTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d >= start && d <= end;
    });
    const currentExpenses = currentExpenseTransactions.reduce(
      (s, t) => s + convert(t.amount, t.currency),
      0,
    );

    const currentIncomeTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === "income" && d >= start && d <= end;
    });
    const currentIncome = currentIncomeTransactions.reduce(
      (s, t) => s + convert(t.amount, t.currency),
      0,
    );

    const previousExpenses = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d >= prev.start && d <= prev.end;
      })
      .reduce((s, t) => s + convert(t.amount, t.currency), 0);

    const currentByCategory: Record<string, number> = {};
    currentExpenseTransactions.forEach((t) => {
      currentByCategory[t.category] =
        (currentByCategory[t.category] || 0) + convert(t.amount, t.currency);
    });

    const categories = Object.entries(currentByCategory).sort(
      (a, b) => b[1] - a[1],
    );
    const topCat = categories[0]?.[0] ?? null;
    const pct =
      categories[0] && currentExpenses > 0
        ? Math.round((categories[0][1] / currentExpenses) * 100)
        : 0;

    if (currentExpenses === 0 && currentIncome > 0) {
      return {
        insight: `Zero expenses ${periodLabel} \u2014 all income saved.`,
        topCategory: topCat,
        topCategoryPct: pct,
      };
    }

    if (currentExpenses === 0 && currentIncome === 0) {
      return {
        insight: `No activity yet ${periodLabel}. Start tracking your finances.`,
        topCategory: topCat,
        topCategoryPct: pct,
      };
    }

    if (previousExpenses > 0 && currentExpenses > 0) {
      const change =
        ((currentExpenses - previousExpenses) / previousExpenses) * 100;
      const changePct = Math.round(Math.abs(change));
      if (changePct > 0 && change < 0) {
        return {
          insight: `Your spending dropped ${changePct}% compared to last ${previousPeriodLabel}.`,
          topCategory: topCat,
          topCategoryPct: pct,
        };
      }
      if (changePct > 0 && change > 0) {
        const driver = topCat ? ` \u2014 ${topCat} is the biggest driver.` : ".";
        return {
          insight: `Spending is up ${changePct}% this ${previousPeriodLabel}${driver}`,
          topCategory: topCat,
          topCategoryPct: pct,
        };
      }
    }

    if (categories[0] && pct >= 50) {
      return {
        insight: `${categories[0][0]} accounts for ${pct}% of your spending this ${previousPeriodLabel}.`,
        topCategory: topCat,
        topCategoryPct: pct,
      };
    }

    if (currentIncome > 0) {
      const txCount = currentIncomeTransactions.length;
      return {
        insight: `You earned ${formatCurrency(currentIncome, displayCurrency)} across ${txCount} transaction${txCount === 1 ? "" : "s"} ${periodLabel}.`,
        topCategory: topCat,
        topCategoryPct: pct,
      };
    }

    return {
      insight: `Track your income and spending to unlock personalised insights.`,
      topCategory: topCat,
      topCategoryPct: pct,
    };
  }, [transactions, timeRange, displayCurrency]);

  const dashboardInlineContext = useMemo(
    () => ({
      balance: formatCurrency(totalBalance, displayCurrency),
      todaySpending: formatCurrency(todaySpendingAmount, displayCurrency),
      topCategory: topCategory ?? "none",
      topPercent: topCategoryPct,
      insightText: insight,
    }),
    [
      totalBalance,
      todaySpendingAmount,
      displayCurrency,
      topCategory,
      topCategoryPct,
      insight,
    ],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  const sendMessage = useCallback(
    async (userContent: string) => {
      if (!userContent.trim() || isStreaming) return;

      setError(null);
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userContent.trim(),
      };

      const withoutEmptyAssistant = messages.filter(
        (m) => !(m.role === "assistant" && m.content === ""),
      );
      const trimmedTurns = trimMessages([...withoutEmptyAssistant, userMsg]);
      const forApi = trimmedTurns.map(({ role, content }) => ({ role, content }));

      const assistantId = `assistant-${Date.now()}`;
      setMessages([
        ...trimmedTurns,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setInput("");

      setIsStreaming(true);

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            messages: forApi,
            dashboardInlineContext,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          let errorMessage = `Request failed (${response.status})`;
          try {
            const data = JSON.parse(text) as { error?: string };
            if (data?.error && typeof data.error === "string") {
              errorMessage = data.error;
            }
          } catch {
            if (text) errorMessage = text.slice(0, 200);
          }
          throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          const current = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: current } : m,
            ),
          );
        }

        if (!accumulated.trim()) {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setError("No response from the advisor. Please try again.");
        } else {
          setMessages((prev) => trimMessages(prev));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, dashboardInlineContext],
  );

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const queueExpandAndSend = useCallback((text: string) => {
    setExpanded(true);
    window.setTimeout(() => {
      void sendMessageRef.current(text);
    }, 0);
  }, []);

  const openExpandedOnly = useCallback(() => {
    setExpanded(true);
  }, []);

  const pillStyle: CSSProperties = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 12,
    color: "#A09080",
    transition: "border-color 0.15s",
    background: "transparent",
    cursor: "pointer",
  };

  const isLoading = txLoading || walletsLoading;

  if (isLoading) {
    return (
      <section aria-label="AI insight" className="min-w-0 max-w-full">
        <div
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div className="space-y-4">
            <Skeleton className="mx-auto h-5 w-5 rounded-full" />
            <Skeleton className="mx-auto h-4 w-72 max-w-full" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const typingDotStyle = (delayMs: number): CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(184,149,106,0.6)",
    animation: "aiInsightDotBounce 0.55s ease-in-out infinite",
    animationDelay: `${delayMs}ms`,
  });

  return (
    <section aria-label="AI insight" className="min-w-0 max-w-full">
      <style>{`
        @keyframes aiInsightDotBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <div
        aria-expanded={expanded}
        className="min-w-0 max-w-full"
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
          position: "relative",
        }}
      >
        <div className="space-y-5">
          <Sparkles className="mx-auto h-5 w-5" style={{ color: "#C8A96E" }} aria-hidden="true" />
          <p
            className="select-text"
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#C8B898",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            {insight}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              style={pillStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
              onClick={() =>
                queueExpandAndSend("Analyze my spending patterns this week")
              }
            >
              Analyze spending
            </button>
            {topCategory ? (
              <button
                type="button"
                style={pillStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
                onClick={() =>
                  queueExpandAndSend(
                    `Help me set a budget for ${topCategory}`,
                  )
                }
              >
                {`Set budget for ${topCategory}`}
              </button>
            ) : (
              <button
                type="button"
                style={pillStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
                onClick={openExpandedOnly}
              >
                Savings tips
              </button>
            )}
            <button
              type="button"
              style={pillStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
              onClick={openExpandedOnly}
            >
              Ask AI advisor
            </button>
          </div>
          <button
            type="button"
            onClick={openExpandedOnly}
            style={{
              display: "block",
              width: "100%",
              marginTop: 4,
              fontSize: 11,
              color: "rgba(184,149,106,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontStyle: "normal",
            }}
          >
            Ask anything →
          </button>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: expanded ? "auto" : 0,
            opacity: expanded ? 1 : 0,
          }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div
            style={{
              position: "relative",
              paddingTop: 20,
              marginTop: 8,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              textAlign: "left",
            }}
          >
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setExpanded(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 0,
                width: 28,
                height: 28,
                border: "none",
                background: "transparent",
                color: "rgba(245,240,232,0.45)",
                fontSize: 20,
                lineHeight: 1,
                cursor: "pointer",
                padding: 0,
              }}
            >
              ×
            </button>

            <div
              ref={scrollRef}
              className="min-h-0"
              style={{
                maxHeight: 280,
                overflowY: "auto",
                paddingRight: 8,
                marginBottom: 12,
              }}
            >
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {messages.map((m, index) => (
                  <motion.li
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: "easeOut",
                      delay: Math.min(index, 5) * 0.06,
                    }}
                    style={{
                      display: "flex",
                      justifyContent:
                        m.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                      {m.role === "assistant" &&
                      m.content === "" &&
                      isStreaming ? (
                        <div
                          role="status"
                          aria-live="polite"
                          aria-label="Advisor is typing"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "10px 14px",
                          }}
                        >
                          <span style={typingDotStyle(0)} />
                          <span style={typingDotStyle(150)} />
                          <span style={typingDotStyle(300)} />
                        </div>
                      ) : (
                        <div
                          className="select-text"
                          style={{
                            maxWidth: "88%",
                            padding: "8px 12px",
                            fontSize: 13,
                            borderRadius:
                              m.role === "user"
                                ? "12px 12px 2px 12px"
                                : "12px 12px 12px 2px",
                            border:
                              m.role === "user"
                                ? "1px solid rgba(184,149,106,0.2)"
                                : "1px solid rgba(255,255,255,0.07)",
                            background:
                              m.role === "user"
                                ? "rgba(184,149,106,0.12)"
                                : "rgba(255,255,255,0.04)",
                            color:
                              m.role === "user"
                                ? "#f5f0e8"
                                : "rgba(245,240,232,0.85)",
                            fontStyle:
                              m.role === "assistant" ? "italic" : "normal",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {m.content}
                        </div>
                      )}
                  </motion.li>
                ))}
              </ul>
            </div>

            {error ? (
              <p
                role="alert"
                className="select-text"
                style={{
                  fontSize: 12,
                  color: "#E07A5F",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <input
                type="text"
                className="select-text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your spending..."
                disabled={isStreaming}
                aria-busy={isStreaming}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(184,149,106,0.2)",
                  borderRadius: 100,
                  padding: "10px 16px",
                  fontSize: 13,
                  color: "#f5f0e8",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                aria-label="Send message"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  background: "#b8956a",
                  color: "#1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    isStreaming || !input.trim() ? "not-allowed" : "pointer",
                  opacity: isStreaming || !input.trim() ? 0.45 : 1,
                  flexShrink: 0,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isStreaming && input.trim()) {
                    e.currentTarget.style.opacity = "0.85";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isStreaming && input.trim()) {
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
