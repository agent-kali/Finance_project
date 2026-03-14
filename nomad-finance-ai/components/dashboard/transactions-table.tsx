"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOptimisticMutation } from "@/lib/hooks/use-optimistic-mutation";
import { useDemoMode } from "@/lib/demo-context";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useWallets } from "@/lib/hooks/use-wallets";
import { formatCurrency } from "@/lib/currency";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { deleteTransaction } from "@/app/actions/transactions";
import { TransactionModal } from "./transaction-modal";
import type { Transaction } from "@/types/database.types";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowLeftRight,
} from "lucide-react";

type SortField = "date" | "amount";
type SortDir = "asc" | "desc";

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const UNIQUE_CATEGORIES = Array.from(new Set(ALL_CATEGORIES));

export function TransactionsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: transactions, isLoading } = useTransactions();
  const { data: wallets } = useWallets();
  const { isDemo } = useDemoMode();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      router.replace("/transactions");
      queueMicrotask(() => {
        setEditingTx(null);
        setModalOpen(true);
      });
    }
  }, [searchParams, router]);

  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const deleteMutation = useOptimisticMutation<Transaction, string>({
    queryKey: ["transactions", isDemo],
    mutationFn: deleteTransaction,
    updateCache: (old, id) => (old ?? []).filter((t) => t.id !== id),
    successMessage: "Transaction deleted",
    errorMessage: "Failed to delete. Transaction restored.",
    invalidateKeys: [["wallets"]],
  });

  const filtered = useMemo(() => {
    let result = transactions ?? [];

    if (filterType !== "all") result = result.filter((t) => t.type === filterType);
    if (filterCategory !== "all")
      result = result.filter((t) => t.category === filterCategory);
    if (filterWallet !== "all")
      result = result.filter((t) => t.wallet_id === filterWallet);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else cmp = a.amount - b.amount;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [transactions, filterType, filterCategory, filterWallet, search, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function handleEdit(tx: Transaction) {
    setEditingTx(tx);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingTx(null);
    setModalOpen(true);
  }

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search description or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {UNIQUE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterWallet} onValueChange={setFilterWallet}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Wallet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wallets</SelectItem>
              {wallets?.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {CURRENCY_SYMBOLS[w.currency as SupportedCurrency]} {w.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <Card className="glass-card glass-card-hover">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No transactions found</p>
                <Button variant="link" onClick={handleAdd} className="mt-2">
                  Add your first transaction
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("date")}
                          aria-label={`Sort by date${sortField === "date" ? `, ${sortDir === "asc" ? "ascending" : "descending"}` : ""}`}
                          aria-sort={sortField === "date" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                        >
                          Date
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Wallet</th>
                      <th className="px-4 py-3 font-medium text-right">
                        <button
                          type="button"
                          className="ml-auto flex items-center gap-1"
                          onClick={() => toggleSort("amount")}
                          aria-label={`Sort by amount${sortField === "amount" ? `, ${sortDir === "asc" ? "ascending" : "descending"}` : ""}`}
                          aria-sort={sortField === "amount" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                        >
                          Amount
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => {
                      const currency = tx.currency as SupportedCurrency;
                      const wallet = wallets?.find(
                        (w) => w.id === tx.wallet_id
                      );
                      const isOptimistic = tx.id.startsWith("temp-");
                      return (
                        <tr
                          key={tx.id}
                          className={cn(
                            "border-b last:border-0 transition-colors hover:bg-muted/50",
                            isOptimistic &&
                              "opacity-50 animate-pulse pointer-events-none"
                          )}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            {tx.description || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {tx.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {wallet
                              ? `${CURRENCY_SYMBOLS[wallet.currency as SupportedCurrency]} ${wallet.currency}`
                              : tx.currency}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                            <span
                              className={
                                tx.type === "income"
                                  ? "text-emerald-500"
                                  : "text-red-400"
                              }
                            >
                              <span className="sr-only">
                                {tx.type === "income" ? "Income" : "Expense"}
                                {" "}
                              </span>
                              {tx.type === "income" ? "+" : "−"}
                              {formatCurrency(tx.amount, currency)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(tx)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteMutation.mutate(tx.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={editingTx}
      />
    </>
  );
}
