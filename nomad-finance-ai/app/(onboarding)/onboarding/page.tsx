"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createWallet } from "@/app/actions/wallets";
import { updateProfilePrimaryCurrency } from "@/app/actions/profiles";
import {
  ONBOARDING_CURRENCIES,
  CURRENCY_DISPLAY,
  type OnboardingCurrency,
} from "@/lib/constants";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { formatAmountDisplay, parseAmountInput } from "@/lib/currency";
import { cn } from "@/lib/utils";

const walletSchema = z.object({
  balance: z.number().min(0, "Balance cannot be negative"),
});

type WalletValues = z.infer<typeof walletSchema>;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [selectedCurrency, setSelectedCurrency] =
    useState<OnboardingCurrency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();

  const form = useForm<WalletValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: { balance: 0 as number },
  });

  const goNext = (dir: number) => {
    setDirection(dir);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  async function handleCurrencyContinue() {
    if (!selectedCurrency) return;
    setIsSubmitting(true);
    try {
      await updateProfilePrimaryCurrency(selectedCurrency);
      goNext(1);
    } catch {
      // TODO: toast error
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWalletSubmit(values: WalletValues) {
    if (!selectedCurrency) return;
    setIsSubmitting(true);
    // #region agent log
    fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "749418" },
      body: JSON.stringify({
        sessionId: "749418",
        location: "onboarding/page.tsx:handleWalletSubmit",
        message: "handleWalletSubmit entered",
        data: { selectedCurrency, balance: values.balance },
        timestamp: Date.now(),
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    try {
      await createWallet(selectedCurrency, { balance: values.balance });
      // #region agent log
      fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "749418" },
        body: JSON.stringify({
          sessionId: "749418",
          location: "onboarding/page.tsx:handleWalletSubmit",
          message: "createWallet succeeded, before router",
          data: {},
          timestamp: Date.now(),
          hypothesisId: "C",
        }),
      }).catch(() => {});
      // #endregion
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      // #region agent log
      fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "749418" },
        body: JSON.stringify({
          sessionId: "749418",
          location: "onboarding/page.tsx:handleWalletSubmit",
          message: "createWallet catch",
          data: { errMsg: String(err), errName: err instanceof Error ? err.name : "unknown" },
          timestamp: Date.now(),
          hypothesisId: "B",
        }),
      }).catch(() => {});
      // #endregion
      form.setError("balance", {
        message: "Something went wrong. Please try again.",
      });
      setIsSubmitting(false);
    } finally {
      // #region agent log
      fetch("http://127.0.0.1:7859/ingest/b30ba92e-e835-4f4c-893f-e95fcfbd0e5b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "749418" },
        body: JSON.stringify({
          sessionId: "749418",
          location: "onboarding/page.tsx:handleWalletSubmit",
          message: "handleWalletSubmit finally",
          data: {},
          timestamp: Date.now(),
          hypothesisId: "D",
        }),
      }).catch(() => {});
      // #endregion
      setIsSubmitting(false);
    }
  }

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.25 };

  return (
    <div className="flex min-h-svh flex-col items-center px-4 py-8">
      <p className="mb-8 text-sm text-muted-foreground" aria-live="polite">
        Step {step} of 3
      </p>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="flex flex-col items-center"
            >
              <div className="glass-card glass-card-cyan-border glass-card-hover rounded-2xl p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <Brain className="h-20 w-20 text-primary" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome to NomadFinance AI
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Built for digital nomads like you. Let&apos;s set up your
                  account in 30 seconds.
                </p>
                <Button
                  size="lg"
                  className="mt-8 min-h-[44px] gap-2"
                  onClick={() => goNext(1)}
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="flex flex-col"
            >
              <div className="glass-card glass-card-cyan-border glass-card-hover rounded-2xl p-8">
                <h2 className="text-xl font-bold tracking-tight">
                  Where do you spend most?
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Pick your primary currency. You can always change this later.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {ONBOARDING_CURRENCIES.map((code) => {
                    const { flag, name } = CURRENCY_DISPLAY[code];
                    const isSelected = selectedCurrency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setSelectedCurrency(code)}
                        className={cn(
                          "glass-card glass-card-hover flex min-h-[60px] items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors",
                          isSelected
                            ? "glass-card-cyan-border border-primary/50"
                            : "border-transparent"
                        )}
                        aria-pressed={isSelected}
                        aria-label={`Select ${name}`}
                      >
                        <span className="text-2xl" aria-hidden>
                          {flag}
                        </span>
                        <div>
                          <span className="font-medium">{code}</span>
                          <span className="ml-2 text-muted-foreground">
                            {name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={goPrev}
                    disabled={isSubmitting}
                    className="min-h-[44px]"
                  >
                    Back
                  </Button>
                  <Button
                    className="min-h-[44px] flex-1 gap-2"
                    onClick={handleCurrencyContinue}
                    disabled={!selectedCurrency || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && selectedCurrency && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="flex flex-col"
            >
              <div className="glass-card glass-card-cyan-border glass-card-hover rounded-2xl p-8">
                <h2 className="text-xl font-bold tracking-tight">
                  Create your first wallet
                </h2>
                <p className="mt-2 text-muted-foreground">
                  This is where your money lives. Add more wallets anytime.
                </p>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleWalletSubmit)}
                    className="mt-6 space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="balance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CURRENCY_DISPLAY[selectedCurrency].name} balance
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              aria-required
                              className="min-h-[44px]"
                              value={
                                Number.isNaN(field.value) || field.value === 0
                                  ? ""
                                  : formatAmountDisplay(field.value)
                              }
                              onChange={(e) => {
                                const num = parseAmountInput(e.target.value);
                                field.onChange(num);
                              }}
                              onBlur={(e) => {
                                field.onBlur();
                                const num = parseAmountInput(e.target.value);
                                field.onChange(num);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-sm text-muted-foreground">
                      Currency: {selectedCurrency} —{" "}
                      {CURRENCY_DISPLAY[selectedCurrency].name}
                    </p>
                    <div className="mt-8 flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goPrev}
                        disabled={isSubmitting}
                        className="min-h-[44px]"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="min-h-[44px] flex-1 gap-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Create wallet & go to dashboard
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
