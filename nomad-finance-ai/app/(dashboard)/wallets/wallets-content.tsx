"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useOptimisticMutation } from "@/lib/hooks/use-optimistic-mutation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useDemoMode } from "@/lib/demo-context";
import { useDefaultWallet, useEffectiveDefaultWalletId } from "@/lib/default-wallet-context";
import { useDisplayCurrency } from "@/lib/hooks/use-profile";
import { formatCurrency, convertCurrency } from "@/lib/currency";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createWallet, deleteWallet } from "@/app/actions/wallets";
import { EmptyState } from "@/components/ui/empty-state";
import { DefaultWalletSelector } from "@/components/ui/default-wallet-selector";
import { Wallet, Plus, Trash2, Loader2, Star } from "lucide-react";
import type { Wallet as WalletType } from "@/types/database.types";
import { MobileFab } from "@/components/dashboard/mobile-fab";


export function WalletsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: wallets, isLoading } = useWallets();
  const { isDemo } = useDemoMode();
  const displayCurrency = useDisplayCurrency();
  const { setDefaultWallet } = useDefaultWallet() ?? {};
  const effectiveDefaultId = useEffectiveDefaultWalletId();
  const prefersReducedMotion = useReducedMotion();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency | "">("");

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      router.replace("/wallets");
      queueMicrotask(() => setCreateOpen(true));
    }
  }, [searchParams, router]);

  const existingCurrencies = useMemo(
    () => new Set(wallets?.map((w) => w.currency) ?? []),
    [wallets]
  );

  const availableCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) => !existingCurrencies.has(c)
  );

  const createMutation = useOptimisticMutation<WalletType, SupportedCurrency>({
    queryKey: ["wallets", isDemo],
    mutationFn: (currency) => createWallet(currency),
    updateCache: (old, currency) => [
      {
        id: `temp-${Date.now()}`,
        user_id: "",
        currency,
        balance: 0,
        created_at: new Date().toISOString(),
      },
      ...(old ?? []),
    ],
    successMessage: "Wallet created",
    errorMessage: "Failed to create wallet. Reverted.",
    invalidateKeys: [["transactions"]],
    onSuccess: () => {
      setCreateOpen(false);
      setSelectedCurrency("");
    },
  });

  const deleteMutation = useOptimisticMutation<WalletType, string>({
    queryKey: ["wallets", isDemo],
    mutationFn: deleteWallet,
    updateCache: (old, id) => (old ?? []).filter((w) => w.id !== id),
    successMessage: "Wallet deleted",
    errorMessage: "Failed to delete wallet. Restored.",
    invalidateKeys: [["transactions"]],
  });

  const totalInDisplay = (wallets ?? []).reduce(
    (sum, w) =>
      sum + convertCurrency(w.balance, w.currency as SupportedCurrency, displayCurrency),
    0
  );

  return (
    <div className="min-w-0 space-y-8">
      <section aria-label="Wallets overview" className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wallets</h1>
          {!isDemo && availableCurrencies.length > 0 && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-1 h-4 w-4" />
              Add Wallet
            </Button>
          )}
          {wallets && wallets.length > 0 && (
            <DefaultWalletSelector />
          )}
        </div>
        {!isLoading && wallets && wallets.length > 0 && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="glass-card min-w-0 overflow-hidden rounded-xl px-5 py-3"
            title="Converted at Frankfurter rate"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Balance
            </p>
            <p
              className="min-w-0 truncate text-3xl font-semibold text-foreground sm:text-5xl md:text-6xl"
              style={{ letterSpacing: "-1.5px" }}
              title={formatCurrency(totalInDisplay, displayCurrency)}
            >
              {formatCurrency(totalInDisplay, displayCurrency)}
            </p>
          </motion.div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="glass-card min-h-[140px]">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-40" />
                <Skeleton className="mt-2 h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wallets && wallets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((w, i) => {
            const currency = w.currency as SupportedCurrency;
            const symbol = CURRENCY_SYMBOLS[currency] ?? "";
            const displayValue = convertCurrency(w.balance, currency, displayCurrency);
            const isOptimistic = w.id.startsWith("temp-");

            return (
              <motion.div
                key={w.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                whileHover={prefersReducedMotion || isOptimistic ? undefined : { scale: 1.02 }}
                className={cn(
                  "transition-opacity",
                  isOptimistic && "opacity-50 animate-pulse pointer-events-none"
                )}
              >
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {w.currency} Wallet
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-muted-foreground">{symbol}</span>
                      {!isOptimistic && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          effectiveDefaultId === w.id
                            ? "text-amber-500 [&>svg]:fill-amber-400 dark:[&>svg]:fill-amber-500"
                            : "text-muted-foreground hover:text-amber-500"
                        )}
                        onClick={() => setDefaultWallet?.(w.id)}
                        aria-label={effectiveDefaultId === w.id ? "Default wallet" : "Make default"}
                      >
                        <Star className={cn("h-3.5 w-3.5", effectiveDefaultId === w.id && "fill-current")} />
                      </Button>
                      )}
                      {!isDemo && !isOptimistic && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate(w.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete wallet</span>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-3xl font-semibold text-foreground sm:text-4xl"
                      style={{ letterSpacing: "-1.5px" }}
                    >
                      {formatCurrency(w.balance, currency)}
                    </div>
                    <p
                      className="mt-1 text-sm text-muted-foreground"
                      title="Converted at Frankfurter rate"
                    >
                      ≈ {formatCurrency(displayValue, displayCurrency)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-0">
            <EmptyState
              icon={Wallet}
              heading="No wallets yet"
              subtext="Create a wallet for each currency you use"
              ctaLabel={!isDemo ? "Create wallet" : undefined}
              onCtaClick={!isDemo ? () => setCreateOpen(true) : undefined}
            />
          </CardContent>
        </Card>
      )}

      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Wallet</DialogTitle>
            <DialogDescription>
              Choose a currency for your new wallet.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedCurrency}
            onValueChange={(v) => setSelectedCurrency(v as SupportedCurrency)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedCurrency || createMutation.isPending}
              onClick={() => {
                if (selectedCurrency) createMutation.mutate(selectedCurrency);
              }}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MobileFab />
    </div>
  );
}
