"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useEffectiveDefaultWalletId } from "@/lib/default-wallet-context";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useDemoMode } from "@/lib/demo-context";
import { useOptimisticMutation } from "@/lib/hooks/use-optimistic-mutation";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from "@/lib/constants";
import { createTransaction } from "@/app/actions/transactions";
import type { Transaction } from "@/types/database.types";
import { X, ChevronDown, Check, Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CATEGORY_EMOJI: Record<string, string> = {
  Housing: "🏠",
  "Food & Dining": "🍽️",
  Transportation: "🚗",
  Coworking: "💻",
  "Health & Insurance": "🏥",
  Entertainment: "🎬",
  Shopping: "🛒",
  "SaaS & Tools": "🛠️",
  Travel: "✈️",
  Education: "📚",
  Utilities: "📱",
  Other: "📦",
  Salary: "💼",
  Freelance: "🎨",
  Investment: "📈",
  Transfer: "💸",
};

const STEP_EASE = [0.32, 0, 0.67, 0] as const;
const SPRING = { type: "spring" as const, damping: 32, stiffness: 380 };
const REDUCED_TRANSITION = { duration: 0.2 } as const;
const TAP_SCALE = 0.94;

type AddTransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddTransactionSheet({ open, onOpenChange }: AddTransactionSheetProps) {
  const { data: wallets } = useWallets();
  const effectiveDefaultWalletId = useEffectiveDefaultWalletId();
  const isDemo = useDemoMode().isDemo;
  const reducedMotion = useReducedMotion();
  const initialDate = new Date().toISOString().split("T")[0];
  const initialTime = (() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  })();

  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(0);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amountStr, setAmountStr] = useState("0");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState(initialDate);
  const [timeStr, setTimeStr] = useState(initialTime);
  const [walletId, setWalletId] = useState(effectiveDefaultWalletId ?? wallets?.[0]?.id ?? "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLInputElement>(null);

  const defaultWalletId =
    effectiveDefaultWalletId ?? wallets?.[0]?.id ?? "";
  const effectiveWalletId = walletId || defaultWalletId;

  const currency =
    (wallets?.find((w) => w.id === effectiveWalletId)
      ?.currency as SupportedCurrency) ?? "EUR";
  const symbol = CURRENCY_SYMBOLS[currency];

  const amountNum = parseFloat(amountStr) || 0;
  const hasDecimal = amountStr.includes(".");

  const mutation = useOptimisticMutation<Transaction, Parameters<typeof createTransaction>[0]>({
    queryKey: ["transactions", isDemo],
    mutationFn: createTransaction,
    updateCache: (old, values) => {
      const walletCurrency =
        wallets?.find((w) => w.id === values.wallet_id)?.currency ?? "EUR";
      const optimistic: Transaction = {
        id: `temp-${Date.now()}`,
        user_id: "",
        wallet_id: values.wallet_id,
        type: values.type,
        amount: values.amount,
        currency: walletCurrency as Transaction["currency"],
        category: values.category,
        description: values.description ?? null,
        date: values.date,
        created_at: new Date().toISOString(),
      };
      return [optimistic, ...(old ?? [])];
    },
    successMessage: "Transaction saved",
    errorMessage: "Failed to save. Please try again.",
    invalidateKeys: [["wallets"]],
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => {
        const height = typeof window !== "undefined" ? window.innerHeight : 800;
        animate(sheetY, height, transition).then(() => {
          onOpenChange(false);
          sheetY.set(0);
        });
      }, 400);
    },
  });

  const sheetY = useMotionValue(0);
  const handleDragStartY = useRef(0);
  const isDraggingFromHandle = useRef(false);

  const transition = reducedMotion ? REDUCED_TRANSITION : SPRING;

  const handlePointerDownOnHandle = useCallback(() => {
    isDraggingFromHandle.current = true;
  }, []);

  const handlePointerDownOnContent = useCallback(() => {
    isDraggingFromHandle.current = false;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingFromHandle.current) return;
      const y = e.clientY - handleDragStartY.current;
      if (y > 0) sheetY.set(y);
    };
    const onPointerUp = () => {
      if (!isDraggingFromHandle.current) return;
      isDraggingFromHandle.current = false;
      const currentY = sheetY.get();
      if (currentY > 120) {
        const height = typeof window !== "undefined" ? window.innerHeight : 800;
        animate(sheetY, height, transition).then(() => {
          onOpenChange(false);
          sheetY.set(0);
        });
      } else {
        animate(sheetY, 0, transition);
      }
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [open, onOpenChange, sheetY, transition]);

  const closeWithAnimation = useCallback(() => {
    const height = typeof window !== "undefined" ? window.innerHeight : 800;
    animate(sheetY, height, transition).then(() => {
      onOpenChange(false);
      setStep(1);
      setType("expense");
      setAmountStr("0");
      setCategory("");
      setDescription("");
      setDateStr(initialDate);
      setTimeStr(initialTime);
      setWalletId(defaultWalletId);
      setSaveSuccess(false);
      sheetY.set(0);
    });
  }, [defaultWalletId, initialDate, initialTime, onOpenChange, sheetY, transition]);

  const handleClose = useCallback(() => {
    closeWithAnimation();
  }, [closeWithAnimation]);

  const addDigit = (d: string) => {
    if (amountStr === "0" && d !== ".") {
      setAmountStr(d === "." ? "0." : d);
      return;
    }
    if (d === ".") {
      if (hasDecimal) return;
      setAmountStr((prev) => prev + ".");
      return;
    }
    const parts = amountStr.split(".");
    if (parts.length === 2 && parts[1].length >= 2) return;
    setAmountStr((prev) => (prev === "0" ? d : prev + d));
  };

  const backspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr("0");
      return;
    }
    setAmountStr((prev) => prev.slice(0, -1));
  };

  const categories =
    type === "income" ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES];

  const handleSave = () => {
    if (!effectiveWalletId || amountNum <= 0 || !category) return;
    const payload = {
      wallet_id: effectiveWalletId,
      amount: amountNum,
      type,
      category,
      description: description.trim() || undefined,
      date: dateStr,
    };
    mutation.mutate(payload);
  };

  useEffect(() => {
    if (step === 3 && descInputRef.current) {
      descInputRef.current.focus();
    }
  }, [step]);

  const hasWallets = wallets && wallets.length > 0;

  useLayoutEffect(() => {
    if (open) {
      const height = typeof window !== "undefined" ? window.innerHeight : 800;
      sheetY.set(height);
      const controls = animate(sheetY, 0, transition);
      return () => controls.stop();
    }
  }, [open, sheetY, transition]);

  if (typeof document === "undefined") return null;
  if (!open) return null;

  const content = (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleClose}
        aria-hidden
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92vh] flex-col rounded-t-3xl sheet-surface backdrop-blur-2xl"
        style={{ y: sheetY }}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("[data-sheet-handle]")) {
            handleDragStartY.current = e.clientY;
            handlePointerDownOnHandle();
          } else {
            handlePointerDownOnContent();
          }
        }}
      >
        <div
          data-sheet-handle
          className="flex shrink-0 cursor-grab active:cursor-grabbing justify-center pt-3 pb-2 touch-none"
          onPointerDown={handlePointerDownOnHandle}
          role="button"
          tabIndex={0}
          aria-label="Drag to close"
        >
          <div className="h-1.5 w-12 rounded-full bg-zinc-600/50" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1Amount
                key="step1"
                direction={stepDirection}
                type={type}
                setType={setType}
                amountStr={amountStr}
                amountNum={amountNum}
                symbol={symbol}
                onClose={handleClose}
                onContinue={() => {
                  setStepDirection(1);
                  setStep(2);
                }}
                addDigit={addDigit}
                backspace={backspace}
                reducedMotion={reducedMotion}
              />
            )}
            {step === 2 && (
              <Step2Category
                key="step2"
                direction={stepDirection}
                category={category}
                setCategory={setCategory}
                categories={categories}
                onBack={() => {
                  setStepDirection(-1);
                  setStep(1);
                }}
                onContinue={() => {
                  setStepDirection(1);
                  setStep(3);
                }}
                reducedMotion={reducedMotion}
              />
            )}
            {step === 3 && (
              <Step3Details
                key="step3"
                direction={stepDirection}
                type={type}
                amountNum={amountNum}
                symbol={symbol}
                category={category}
                description={description}
                setDescription={setDescription}
                dateStr={dateStr}
                setDateStr={setDateStr}
                timeStr={timeStr}
                setTimeStr={setTimeStr}
                dateInputRef={dateInputRef}
                timeInputRef={timeInputRef}
                descInputRef={descInputRef}
                walletId={walletId}
                setWalletId={setWalletId}
                wallets={wallets ?? []}
                onBack={() => {
                  setStepDirection(-1);
                  setStep(2);
                }}
                onSave={handleSave}
                isPending={mutation.isPending}
                saveSuccess={saveSuccess}
                hasWallets={!!hasWallets}
                defaultWalletId={defaultWalletId}
                reducedMotion={reducedMotion}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );

  return createPortal(
    content,
    document.body
  );
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function Step1Amount({
  direction,
  type,
  setType,
  amountStr,
  amountNum,
  symbol,
  onClose,
  onContinue,
  addDigit,
  backspace,
  reducedMotion,
}: {
  direction: number;
  type: "expense" | "income";
  setType: (t: "expense" | "income") => void;
  amountStr: string;
  amountNum: number;
  symbol: string;
  onClose: () => void;
  onContinue: () => void;
  addDigit: (d: string) => void;
  backspace: () => void;
  reducedMotion: boolean;
}) {
  const displayAmount = amountStr === "" || amountStr === "0" ? "0" : amountStr;
  const amountColor =
    amountNum > 0
      ? type === "expense"
        ? "text-amber-400"
        : "text-primary"
      : "text-balance-cream";

  const numpadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "back"],
  ];

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={stepVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: STEP_EASE }}
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-medium transition-all",
            type === "expense"
              ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/50"
              : "bg-transparent text-zinc-500"
          )}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-medium transition-all",
            type === "income"
              ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/50"
              : "bg-transparent text-zinc-500"
          )}
        >
          Income
        </button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-light tabular-nums tracking-tight text-balance-cream">
            {symbol}
          </span>
          <motion.span
            key={displayAmount}
            initial={reducedMotion ? false : { scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={reducedMotion ? undefined : { duration: 0.15 }}
            className={cn(
              "text-6xl font-light tabular-nums tracking-tight",
              amountColor
            )}
          >
            {displayAmount}
          </motion.span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4">
        {numpadRows.map((row) =>
          row.map((key) =>
            key === "back" ? (
              <button
                key="back"
                type="button"
                onClick={backspace}
                className="flex h-[72px] items-center justify-center rounded-[18px] numpad-key text-amber-400"
                aria-label="Backspace"
              >
                <Delete className="h-6 w-6" />
              </button>
            ) : (
              <motion.button
                key={key}
                type="button"
                onClick={() => addDigit(key)}
                className="flex h-[72px] items-center justify-center rounded-[18px] numpad-key text-2xl font-medium text-zinc-100"
                whileTap={reducedMotion ? undefined : { scale: TAP_SCALE }}
                transition={SPRING}
              >
                {key}
              </motion.button>
            )
          )
        )}
      </div>

      <motion.button
        type="button"
        onClick={onContinue}
        disabled={amountNum <= 0}
        className={cn(
          "h-14 w-full rounded-2xl font-semibold transition-colors",
          amountNum <= 0
            ? "bg-amber-500/10 text-amber-500/40"
            : "bg-amber-500 text-black"
        )}
        whileTap={
          amountNum > 0 && !reducedMotion ? { scale: 0.98 } : undefined
        }
        transition={SPRING}
      >
        Continue
      </motion.button>
    </motion.div>
  );
}

function Step2Category({
  direction,
  category,
  setCategory,
  categories,
  onBack,
  onContinue,
  reducedMotion,
}: {
  direction: number;
  category: string;
  setCategory: (c: string) => void;
  categories: readonly string[];
  onBack: () => void;
  onContinue: () => void;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={stepVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: STEP_EASE }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-zinc-400 hover:text-zinc-100"
        >
          ← Back
        </button>
        <span className="text-sm text-zinc-400">2 of 3</span>
        <div className="w-14" />
      </div>

      <div className="grid grid-cols-4 gap-2 overflow-y-auto">
        {categories.map((cat) => {
          const emoji = CATEGORY_EMOJI[cat] ?? "📦";
          const selected = category === cat;
          return (
            <motion.button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-[18px] numpad-key text-center",
                selected &&
                  "border-[1.5px] border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              )}
              whileTap={reducedMotion ? undefined : { scale: 0.92 }}
              transition={SPRING}
            >
              <span className="text-[28px] leading-none">{emoji}</span>
              <span className="max-w-full truncate text-[10px] text-zinc-400">
                {cat}
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        type="button"
        onClick={onContinue}
        disabled={!category}
        className={cn(
          "h-14 w-full rounded-2xl font-semibold transition-colors",
          !category ? "bg-amber-500/10 text-amber-500/40" : "bg-amber-500 text-black"
        )}
        whileTap={category && !reducedMotion ? { scale: 0.98 } : undefined}
        transition={SPRING}
      >
        Continue
      </motion.button>
    </motion.div>
  );
}

function Step3Details({
  direction,
  type,
  amountNum,
  symbol,
  category,
  description,
  setDescription,
  dateStr,
  setDateStr,
  timeStr,
  setTimeStr,
  dateInputRef,
  timeInputRef,
  descInputRef,
  walletId,
  setWalletId,
  wallets,
  onBack,
  onSave,
  isPending,
  saveSuccess,
  hasWallets,
  defaultWalletId,
  reducedMotion,
}: {
  direction: number;
  type: "expense" | "income";
  amountNum: number;
  symbol: string;
  category: string;
  description: string;
  setDescription: (s: string) => void;
  dateStr: string;
  setDateStr: (s: string) => void;
  timeStr: string;
  setTimeStr: (s: string) => void;
  dateInputRef: React.RefObject<HTMLInputElement | null>;
  timeInputRef: React.RefObject<HTMLInputElement | null>;
  descInputRef: React.RefObject<HTMLInputElement | null>;
  walletId: string;
  setWalletId: (s: string) => void;
  wallets: { id: string; currency: string }[];
  onBack: () => void;
  onSave: () => void;
  isPending: boolean;
  saveSuccess: boolean;
  hasWallets: boolean;
  defaultWalletId: string;
  reducedMotion: boolean;
}) {
  const emoji = CATEGORY_EMOJI[category] ?? "📦";
  const amountColor =
    type === "expense" ? "text-amber-400" : "text-primary";
  const formattedDate = (() => {
    const d = new Date(dateStr);
    const today = new Date();
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      return "Today, " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  })();
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const effectiveWalletId = walletId || defaultWalletId;
  const selectedWallet = wallets.find((w) => w.id === effectiveWalletId);

  if (!hasWallets) {
    return (
      <motion.div
        className="flex flex-col gap-6"
        variants={stepVariants}
        custom={direction}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.28, ease: STEP_EASE }}
      >
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="text-zinc-400 hover:text-zinc-100">
            ← Back
          </button>
          <span className="text-sm text-zinc-400">3 of 3</span>
          <div className="w-14" />
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <p className="text-center text-sm text-zinc-400">
            You need at least one wallet before adding transactions.
          </p>
          <Link
            href="/wallets"
            className="inline-block rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-black"
          >
            Create a Wallet
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={stepVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: STEP_EASE }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-zinc-400 hover:text-zinc-100"
        >
          ← Back
        </button>
        <span className="text-sm text-zinc-400">3 of 3</span>
        <div className="w-14" />
      </div>

      <div className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{emoji}</span>
          <span className="text-zinc-300">{category}</span>
          <span className="text-zinc-500">·</span>
          <span className={cn("font-medium tabular-nums", amountColor)}>
            {symbol}
            {amountNum.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <input
        ref={descInputRef}
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a note..."
        className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
      />

      <div className="flex gap-2">
        <input
          ref={dateInputRef}
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="absolute h-0 w-0 opacity-0"
          aria-hidden
        />
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker?.()}
          className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300"
        >
          📅 {formattedDate}
        </button>
        <input
          ref={timeInputRef}
          type="time"
          value={timeStr}
          onChange={(e) => setTimeStr(e.target.value)}
          className="absolute h-0 w-0 opacity-0"
          aria-hidden
        />
        <button
          type="button"
          onClick={() => timeInputRef.current?.showPicker?.()}
          className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300"
        >
          🕐 {timeStr}
        </button>
      </div>

      {wallets.length > 1 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setWalletPickerOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 text-left text-sm text-zinc-300"
          >
            <span>
              💳 {selectedWallet ? CURRENCY_SYMBOLS[selectedWallet.currency as SupportedCurrency] + " " + selectedWallet.currency : "Wallet"}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {walletPickerOpen && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setWalletId(w.id);
                    setWalletPickerOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm",
                    effectiveWalletId === w.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  {CURRENCY_SYMBOLS[w.currency as SupportedCurrency]} {w.currency}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <motion.button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-black",
          type === "expense" ? "bg-amber-500" : "bg-primary"
        )}
        whileTap={
          !isPending && !reducedMotion ? { scale: 0.97 } : undefined
        }
        transition={SPRING}
      >
        {saveSuccess ? (
          <Check className="h-6 w-6" />
        ) : isPending ? (
          <span className="animate-pulse">Saving…</span>
        ) : (
          "Save transaction"
        )}
      </motion.button>
    </motion.div>
  );
}
