"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Send, Sparkles, AlertCircle, Lock, BarChart3, PieChart, TrendingUp, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo-context";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function AiAdvisor() {
  const { isDemo } = useDemoMode();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userContent: string) => {
      if (!userContent.trim() || isStreaming) return;

      setError(null);
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userContent.trim(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            messages: updatedMessages.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          let errorMessage = `Request failed (${response.status})`;
          try {
            const data = JSON.parse(text);
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
              m.id === assistantId ? { ...m, content: current } : m
            )
          );
        }

        if (!accumulated.trim()) {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setError("No response from the advisor. Please try again.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  function handleAnalyze() {
    sendMessage(
      "Analyze my recent financial data and give me actionable advice on my spending patterns, savings opportunities, and any tax considerations as a digital nomad."
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }


  return (
    <Card className="glass-card flex h-[calc(100svh-10rem)] flex-col">
      <CardHeader className="shrink-0 border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Brain className="h-4 w-4 text-primary" />
          AI Financial Advisor
          <span className="text-xs font-normal text-muted-foreground">
            Powered by Groq
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.length === 0 && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-8">
            {isDemo ? (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                  <Lock className="h-10 w-10 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">AI Advisor &mdash; Demo Mode</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    The AI Financial Advisor requires a Supabase account and a
                    configured GROQ API key. Sign up and add your{" "}
                    <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">GROQ_API_KEY</code>{" "}
                    to <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">.env.local</code>{" "}
                    to unlock personalized insights.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex w-full max-w-lg flex-col items-center gap-8">
                {/* Illustration area */}
                <div className="flex w-full items-center justify-center rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:rounded-2xl dark:border-zinc-700 dark:bg-zinc-900/70 dark:backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-white p-3 text-teal-600 shadow-sm transition-all hover:bg-teal-50 hover:shadow dark:border-zinc-600 dark:bg-background/80 dark:text-primary dark:shadow-lg dark:shadow-cyan-500/30 dark:hover:bg-background/80 dark:hover:shadow-lg dark:hover:shadow-cyan-500/30">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-white p-3 text-teal-600 shadow-sm transition-all hover:bg-teal-50 hover:shadow dark:border-zinc-600 dark:bg-background/80 dark:text-primary dark:shadow-lg dark:shadow-cyan-500/30 dark:hover:bg-background/80 dark:hover:shadow-lg dark:hover:shadow-cyan-500/30">
                      <PieChart className="h-6 w-6" />
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-white p-3 text-teal-600 shadow-sm transition-all hover:bg-teal-50 hover:shadow dark:border-zinc-600 dark:bg-background/80 dark:text-primary dark:shadow-lg dark:shadow-cyan-500/30 dark:hover:bg-background/80 dark:hover:shadow-lg dark:hover:shadow-cyan-500/30">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-white p-3 text-teal-600 shadow-sm transition-all hover:bg-teal-50 hover:shadow dark:border-zinc-600 dark:bg-background/80 dark:text-primary dark:shadow-lg dark:shadow-cyan-500/30 dark:hover:bg-background/80 dark:hover:shadow-lg dark:hover:shadow-cyan-500/30">
                      <Globe className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Copy and CTA */}
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm dark:border-primary/30 dark:bg-primary/10">
                    <Sparkles className="h-9 w-9 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Financial Insights</h3>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Get personalized financial advice based on your actual
                      transaction data. Ask about spending patterns, savings, or EU
                      tax considerations.
                    </p>
                  </div>
                  <Button onClick={handleAnalyze} disabled={isStreaming}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze My Finances
                  </Button>

                  {/* Example prompt suggestions */}
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {[
                      "Analyze my spending patterns",
                      "Find savings opportunities",
                      "EU tax considerations for nomads",
                      "Budget recommendations",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        disabled={isStreaming}
                        className={cn(
                          "rounded-xl border border-border/60 bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 dark:border-border/40 dark:bg-muted/30 dark:hover:border-primary/40 dark:hover:bg-primary/10"
                        )}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="mt-1 shrink-0 rounded-full bg-primary/10 p-1.5">
                <Brain className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.content || (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>

      {messages.length > 0 && (
        <div className="shrink-0 border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isStreaming || !input.trim()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
