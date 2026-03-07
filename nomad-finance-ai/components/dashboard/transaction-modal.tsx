"use client";

import { useEffect } from "react";
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

/** Format number with period as thousands separator (e.g. 1000000 → "1.000.000") */
function formatAmountDisplay(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  if (value === 0) return "";
  const [intPart, decPart] = value.toFixed(2).split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart && parseFloat(decPart) > 0
    ? `${formattedInt},${decPart.replace(/0+$/, "") || "0"}`
    : formattedInt;
}

/** Parse formatted amount string back to number */
function parseAmountInput(input: string): number {
  const trimmed = input.replace(/\s/g, "");
  if (!trimmed) return 0;
  const withDecimal =
    trimmed.indexOf(",") >= 0
      ? trimmed.replace(/\./g, "").replace(",", ".")
      : trimmed.replace(/\./g, "");
  const num = parseFloat(withDecimal);
  return Number.isNaN(num) ? 0 : num;
}

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
    defaultValues: {
      type: "expense",
      amount: 0,
      category: "",
      wallet_id: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const watchedType = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        wallet_id: transaction.wallet_id,
        date: transaction.date,
        description: transaction.description ?? "",
      });
    } else {
      form.reset({
        type: "expense",
        amount: 0,
        category: "",
        wallet_id: effectiveDefaultWalletId ?? wallets?.[0]?.id ?? "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
  }, [transaction, wallets, effectiveDefaultWalletId, form]);

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
              <div className="grid grid-cols-2 gap-4">
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
                          <SelectTrigger className="w-full">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                          <SelectTrigger className="w-full">
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
                          <SelectTrigger className="w-full">
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
                      <Input type="date" {...field} />
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
