"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowUp } from "lucide-react";
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

const KEYFRAMES = `
  @keyframes aiAmbientGlow {
    0%, 100% { opacity: 0.12; }
    50% { opacity: 0.2; }
  }
  @keyframes aiFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes aiOrbit1 {
    from { transform: translate(-50%, -50%) rotate(0deg) translateX(28px) rotate(0deg); }
    to   { transform: translate(-50%, -50%) rotate(360deg) translateX(28px) rotate(-360deg); }
  }
  @keyframes aiOrbit2 {
    from { transform: translate(-50%, -50%) rotate(180deg) translateX(38px) rotate(-180deg); }
    to   { transform: translate(-50%, -50%) rotate(540deg) translateX(38px) rotate(-540deg); }
  }
  @keyframes aiCenterPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  @keyframes aiShimmer {
    from { background-position: 200% center; }
    to   { background-position: 0% center; }
  }
  @keyframes aiInsightDotBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
`;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
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

const shimmerSpanStyle: CSSProperties = {
  background: "linear-gradient(90deg,#b8956a,#d4b48a,#b8956a)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  fontWeight: 500,
  animation: "aiShimmer 3s linear infinite",
};

function insightWithHighlightedCategory(
  insight: string,
  category: string | null,
): ReactNode {
  if (!category) return insight;

  const nodes: ReactNode[] = [];
  let rest = insight;
  let key = 0;

  for (;;) {
    const i = rest.indexOf(category);
    if (i === -1) {
      nodes.push(rest);
      break;
    }
    if (i > 0) {
      nodes.push(rest.slice(0, i));
    }
    nodes.push(
      <span key={`insight-cat-${key}`} style={shimmerSpanStyle}>
        {category}
      </span>,
    );
    key += 1;
    rest = rest.slice(i + category.length);
  }

  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
}

function Divider() {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        height: 1,
        margin: 0,
        background:
          "linear-gradient(90deg, transparent, rgba(184,149,106,0.15), rgba(184,149,106,0.15), transparent)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#b8956a",
          opacity: 0.5,
          boxShadow: "0 0 8px rgba(184,149,106,0.6)",
        }}
      />
    </div>
  );
}

function OrbitIcon() {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: 56,
        height: 56,
        margin: "0 auto 20px",
        animation: "aiFloat 4s ease-in-out infinite",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: -12,
          borderRadius: "50%",
          border: "1px solid rgba(184,149,106,0.12)",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#b8956a",
          boxShadow: "0 0 6px rgba(184,149,106,0.8)",
          opacity: 0.7,
          animation: "aiOrbit1 6s linear infinite",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 3,
          height: 3,
          borderRadius: "50%",
          background: "#b8956a",
          boxShadow: "0 0 6px rgba(184,149,106,0.8)",
          opacity: 0.4,
          animation: "aiOrbit2 9s linear infinite",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 24,
          lineHeight: 1,
          color: "#b8956a",
          animation: "aiCenterPulse 3s ease-in-out infinite",
        }}
      >
        ✦
      </span>
    </div>
  );
}

export function AiInsightCard() {
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { timeRange } = useTimeRange();
  const displayCurrency = useDisplayCurrency();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
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
      timeRange === "Today" ? "today" : timeRange === "Week" ? "this week" : "this month";
    const previousPeriodLabel =
      timeRange === "Today" ? "day" : timeRange === "Week" ? "week" : "month";

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
          insight: `Spending is up ${changePct}% ${periodLabel}${driver}`,
          topCategory: topCat,
          topCategoryPct: pct,
        };
      }
    }

    if (categories[0] && pct >= 50) {
      return {
        insight: `${categories[0][0]} accounts for ${pct}% of your spending ${periodLabel}.`,
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

  const insightContent = useMemo(
    () => insightWithHighlightedCategory(insight, topCategory),
    [insight, topCategory],
  );

  const isLoading = txLoading || walletsLoading;
  const showThread = messages.length > 0 || isStreaming;

  if (isLoading) {
    return (
      <section aria-label="AI insight" className="min-w-0 max-w-full">
        <Divider />
        <div
          style={{
            position: "relative",
            textAlign: "center",
            padding: "40px 0 32px",
          }}
        >
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-[26px] w-full max-w-[420px]" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-40 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full max-w-[480px] rounded-full" />
          </div>
        </div>
        <Divider />
      </section>
    );
  }

  const ghostPillStyle: CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(184,149,106,0.25)",
    color: "rgba(245,240,232,0.6)",
    borderRadius: 100,
    padding: "9px 20px",
    fontSize: 12,
    lineHeight: 1.2,
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
  };

  const inputBaseStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${inputFocused ? "rgba(184,149,106,0.5)" : "rgba(184,149,106,0.2)"}`,
    borderRadius: 100,
    padding: "11px 20px",
    fontSize: 13,
    color: "#f5f0e8",
    outline: "none",
    boxShadow: inputFocused ? "0 0 0 3px rgba(184,149,106,0.08)" : "none",
    transition: "all 0.2s ease",
  };

  const sendButtonDisabled = isStreaming || !input.trim();

  const typingDotStyle = (delayMs: number): CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(184,149,106,0.6)",
    animation: "aiInsightDotBounce 0.55s ease-in-out infinite",
    animationDelay: `${delayMs}ms`,
  });

  const secondaryActionLabel = topCategory
    ? `Set budget for ${topCategory}`
    : "Savings tips";
  const secondaryActionPrompt = topCategory
    ? `Help me set a budget for ${topCategory}`
    : "Give me savings tips";

  return (
    <section aria-label="AI insight" className="min-w-0 max-w-full">
      <style>{KEYFRAMES}</style>

      <Divider />

      <div
        style={{
          position: "relative",
          overflow: "visible",
          textAlign: "center",
          padding: "40px 0 32px",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 280,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(184,149,106,0.1) 0%, transparent 70%)",
            animation: "aiAmbientGlow 4s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 160,
            height: 100,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(184,149,106,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          style={{ position: "relative", zIndex: 1 }}
        >
          <motion.div variants={fadeUp}>
            <OrbitIcon />
          </motion.div>

          <motion.p
            variants={fadeUp}
            style={{
              margin: "0 0 12px",
              fontSize: 9,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(184,149,106,0.5)",
            }}
          >
            AI INSIGHT
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="select-text text-pretty"
            style={{
              fontSize: 20,
              fontWeight: 300,
              color: "#f5f0e8",
              lineHeight: 1.5,
              maxWidth: 520,
              margin: "0 auto 28px",
            }}
          >
            {insightContent}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center"
            style={{ gap: 10 }}
          >
            <button
              type="button"
              style={ghostPillStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(184,149,106,0.45)";
                e.currentTarget.style.color = "rgba(245,240,232,0.85)";
                e.currentTarget.style.background = "rgba(184,149,106,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(184,149,106,0.25)";
                e.currentTarget.style.color = "rgba(245,240,232,0.6)";
                e.currentTarget.style.background = "transparent";
              }}
              onClick={() =>
                void sendMessage("Analyze my spending patterns this week")
              }
            >
              Analyze spending
            </button>
            <button
              type="button"
              style={ghostPillStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(184,149,106,0.45)";
                e.currentTarget.style.color = "rgba(245,240,232,0.85)";
                e.currentTarget.style.background = "rgba(184,149,106,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(184,149,106,0.25)";
                e.currentTarget.style.color = "rgba(245,240,232,0.6)";
                e.currentTarget.style.background = "transparent";
              }}
              onClick={() => void sendMessage(secondaryActionPrompt)}
            >
              {secondaryActionLabel}
            </button>
          </motion.div>

          <motion.form
            variants={fadeUp}
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            style={{
              maxWidth: 480,
              margin: "20px auto 0",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="text"
              className="select-text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask about your finances..."
              disabled={isStreaming}
              aria-busy={isStreaming}
              aria-label="Ask about your finances"
              style={inputBaseStyle}
            />
            <button
              type="submit"
              disabled={sendButtonDisabled}
              aria-label="Send message"
              style={{
                width: 38,
                height: 38,
                flexShrink: 0,
                borderRadius: "50%",
                border: "none",
                background: "#b8956a",
                color: "#0a0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                cursor: sendButtonDisabled ? "not-allowed" : "pointer",
                opacity: sendButtonDisabled ? 0.45 : 1,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!sendButtonDisabled) {
                  e.currentTarget.style.opacity = "0.85";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!sendButtonDisabled) {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
          </motion.form>

          <motion.div
            initial={false}
            animate={{
              height: showThread ? "auto" : 0,
              opacity: showThread ? 1 : 0,
            }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{
              overflow: "hidden",
              maxWidth: 560,
              margin: "16px auto 0",
              textAlign: "left",
            }}
          >
            <div
              ref={scrollRef}
              className="min-h-0"
              style={{
                maxHeight: 280,
                overflowY: "auto",
                paddingRight: 8,
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
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      </div>

      <Divider />
    </section>
  );
}
