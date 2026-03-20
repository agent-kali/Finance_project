"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOptimisticMutation } from "@/lib/hooks/use-optimistic-mutation";
import { useDemoMode } from "@/lib/demo-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWallets } from "@/lib/hooks/use-wallets";
import { useEffectiveDefaultWalletId } from "@/lib/default-wallet-context";
import {
  formatAmountDisplay,
  parseAmountInput,
} from "@/lib/currency";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from "@/lib/constants";
import {
  createTransaction,
  updateTransaction,
} from "@/app/actions/transactions";
import type { Transaction } from "@/types/database.types";
import { Loader2, Wallet } from "lucide-react";
import Link from "next/link";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  wallet_id: z.string().min(1, "Wallet is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

type TransactionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
};

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
}: TransactionModalProps) {
  const { data: wallets } = useWallets();
  const { isDemo } = useDemoMode();
  const effectiveDefaultWalletId = useEffectiveDefaultWalletId();
  const isEditing = !!transaction;
  const initialValues: TransactionFormValues = transaction
    ? {
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        wallet_id: transaction.wallet_id,
        date: transaction.date,
        description: transaction.description ?? "",
      }
    : {
        type: "expense",
        amount: 0,
        category: "",
        wallet_id: effectiveDefaultWalletId ?? wallets?.[0]?.id ?? "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      };

  const mutation = useOptimisticMutation<Transaction, TransactionFormValues>({
    queryKey: ["transactions", isDemo],
    mutationFn: async (values) => {
      if (isEditing && transaction) {
        return updateTransaction(transaction.id, values);
      }
      return createTransaction(values);
    },
    updateCache: (old, values) => {
      const walletCurrency =
        wallets?.find((w) => w.id === values.wallet_id)?.currency ?? "EUR";
      const optimistic: Transaction = {
        id: transaction?.id ?? `temp-${Date.now()}`,
        user_id: transaction?.user_id ?? "",
        wallet_id: values.wallet_id,
        type: values.type,
        amount: values.amount,
        currency: walletCurrency as Transaction["currency"],
        category: values.category,
        description: values.description ?? null,
        date: values.date,
        created_at: transaction?.created_at ?? new Date().toISOString(),
      };
      if (isEditing && transaction) {
        return (old ?? []).map((t) => (t.id === transaction.id ? optimistic : t));
      }
      return [optimistic, ...(old ?? [])];
    },
    successMessage: isEditing ? "Transaction updated" : "Transaction added",
    errorMessage: isEditing
      ? "Failed to update. Changes reverted."
      : "Failed to add transaction. Reverted.",
    invalidateKeys: [["wallets"]],
    onSuccess: () => onOpenChange(false),
  });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialValues,
  });

  const watchedType = useWatch({ control: form.control, name: "type" });

  const [amountDisplay, setAmountDisplay] = useState<string>(
    transaction?.amount ? formatAmountDisplay(transaction.amount) : ""
  );

  function onSubmit(values: TransactionFormValues) {
    mutation.mutate(values);
  }

  const categories =
    watchedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const hasWallets = wallets && wallets.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the transaction details below."
              : "Fill in the details for a new transaction."}
          </DialogDescription>
        </DialogHeader>

        {!hasWallets ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Wallet className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground text-center">
              You need at least one wallet before adding transactions.
            </p>
            <Button asChild size="sm">
              <Link href="/wallets">Create a Wallet</Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("category", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full" aria-required>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          aria-required
                          value={amountDisplay}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d.,]/g, "");
                            const parts = raw.split(/[.,]/);
                            const sane =
                              parts.length > 2
                                ? parts[0] +
                                  (raw.includes(",") ? "," : ".") +
                                  parts.slice(1).join("")
                                : raw;
                            setAmountDisplay(sane);
                            const num = parseAmountInput(sane);
                            field.onChange(num);
                          }}
                          onBlur={(e) => {
                            const raw = e.target.value;
                            const num = parseAmountInput(raw);
                            field.onChange(num);
                            setAmountDisplay(
                              num && Number.isFinite(num)
                                ? formatAmountDisplay(num)
                                : ""
                            );
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="wallet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full" aria-required>
                            <SelectValue placeholder="Select wallet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets?.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {CURRENCY_SYMBOLS[w.currency as SupportedCurrency]}{" "}
                              {w.currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full" aria-required>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" aria-required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Monthly rent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update" : "Add"} Transaction
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
