"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWallet } from "@/app/actions/wallets";
import { updateProfilePrimaryCurrency } from "@/app/actions/profiles";
import {
  ONBOARDING_CURRENCIES,
  CURRENCY_DISPLAY,
  type OnboardingCurrency,
} from "@/lib/constants";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** Allow only digits and one decimal separator (dot or comma) while typing */
function sanitizeBalanceInput(value: string): string {
  const parts = value.replace(",", ".").split(".");
  if (parts.length > 2) return value.slice(0, -1);
  const intPart = (parts[0] ?? "").replace(/\D/g, "");
  const decPart = (parts[1] ?? "").replace(/\D/g, "");
  if (decPart.length > 2) return intPart + "." + decPart.slice(0, 2);
  return parts.length === 1 ? intPart : intPart + "." + decPart;
}

function parseBalance(value: string): number {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return 0;
  const num = parseFloat(trimmed);
  return Number.isNaN(num) || num < 0 ? 0 : num;
}

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

  const [balanceInput, setBalanceInput] = useState("");
  const submittingRef = useRef(false);

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateWallet() {
    if (!selectedCurrency) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    const balance = parseBalance(balanceInput);
    try {
      await createWallet(selectedCurrency, { balance });
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("[onboarding] createWallet failed:", err);
      const msg =
        err instanceof Error
          ? err.message.includes("duplicate key")
            ? "You already have a wallet for this currency. Go to dashboard."
            : err.message
          : "Something went wrong. Please try again.";
      toast.error(msg);
      setIsSubmitting(false);
      submittingRef.current = false;
      // Duplicate key = wallet exists, redirect to dashboard (onboarding effectively done)
      if (err instanceof Error && err.message.includes("duplicate key")) {
        window.location.href = "/dashboard";
      }
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
                <div className="mt-6 grid grid-cols-1 gap-3">
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
                        <span className="shrink-0 text-2xl" aria-hidden>
                          {flag}
                        </span>
                        <div className="min-w-0 shrink">
                          <span className="font-medium">{code}</span>
                          <span className="ml-2 text-muted-foreground whitespace-nowrap">
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
                <div className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="balance-input"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {CURRENCY_DISPLAY[selectedCurrency].name} balance
                    </label>
                    <Input
                      id="balance-input"
                      type="text"
                      inputMode="decimal"
                      placeholder={selectedCurrency === "VND" ? "0" : "0.00"}
                      aria-required
                      className="mt-2 min-h-[44px]"
                      value={balanceInput}
                      onChange={(e) =>
                        setBalanceInput(sanitizeBalanceInput(e.target.value))
                      }
                    />
                  </div>
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
                      type="button"
                      className="min-h-[44px] flex-1 gap-2"
                      disabled={isSubmitting}
                      onClick={handleCreateWallet}
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
