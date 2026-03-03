"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { DefaultWalletSelector } from "@/components/ui/default-wallet-selector";
import { Wallet, Plus, Trash2, Loader2, Star } from "lucide-react";
import type { Wallet as WalletType } from "@/types/database.types";

const CURRENCY_ACCENTS: Record<string, { border: string; text: string }> = {
  EUR: { border: "border-l-cyan-400", text: "text-cyan-400" },
  USD: { border: "border-l-emerald-400", text: "text-emerald-400" },
  PLN: { border: "border-l-amber-500", text: "text-amber-500" },
  GBP: { border: "border-l-violet-400", text: "text-violet-400" },
  VND: { border: "border-l-orange-400", text: "text-orange-400" },
};

const DEFAULT_ACCENT = { border: "border-l-cyan-400", text: "text-cyan-400" };

export function WalletsContent() {
  const { data: wallets, isLoading } = useWallets();
  const { isDemo } = useDemoMode();
  const displayCurrency = useDisplayCurrency();
  const { setDefaultWallet } = useDefaultWallet() ?? {};
  const effectiveDefaultId = useEffectiveDefaultWalletId();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency | "">("");

  const existingCurrencies = useMemo(
    () => new Set(wallets?.map((w) => w.currency) ?? []),
    [wallets]
  );

  const availableCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) => !existingCurrencies.has(c)
  );

  const createMutation = useMutation({
    mutationFn: (currency: SupportedCurrency) => createWallet(currency),
    onSuccess: () => {
      toast.success("Wallet created");
      setCreateOpen(false);
      setSelectedCurrency("");
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create wallet");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWallet(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["wallets"] });
      const previous = queryClient.getQueryData<WalletType[]>(["wallets", isDemo]);
      queryClient.setQueryData<WalletType[]>(["wallets", isDemo], (old) =>
        old?.filter((w) => w.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wallets", isDemo], context.previous);
      }
      toast.error("Failed to delete wallet");
    },
    onSuccess: () => toast.success("Wallet deleted"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const totalInDisplay = (wallets ?? []).reduce(
    (sum, w) =>
      sum + convertCurrency(w.balance, w.currency as SupportedCurrency, displayCurrency),
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
          {!isDemo && availableCurrencies.length > 0 && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card glass-card-hover rounded-xl px-5 py-3"
            title="Converted at Frankfurter rate"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Balance
            </p>
            <p
              className="text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl"
              style={{ letterSpacing: "-1.5px" }}
            >
              {formatCurrency(totalInDisplay, displayCurrency)}
            </p>
          </motion.div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="glass-card glass-card-hover">
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
            const accent = CURRENCY_ACCENTS[currency] ?? DEFAULT_ACCENT;

            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={`glass-card glass-card-hover border-l-2 ${accent.border}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {w.currency} Wallet
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${accent.text}`}>{symbol}</span>
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
                      {!isDemo && (
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
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No wallets yet</p>
            {!isDemo && (
              <Button variant="link" onClick={() => setCreateOpen(true)} className="mt-2">
                Create your first wallet
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
