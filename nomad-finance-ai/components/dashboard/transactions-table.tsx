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
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { formatCurrency } from "@/lib/currency";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { deleteTransaction } from "@/app/actions/transactions";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionModal } from "./transaction-modal";
import { AddTransactionSheet } from "./add-transaction-sheet";
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
  const isMobile = useIsMobile();

  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      router.replace("/transactions");
      queueMicrotask(() => {
        setEditingTx(null);
        if (isMobile) {
          setSheetOpen(true);
        } else {
          setModalOpen(true);
        }
      });
    }
  }, [searchParams, router, isMobile]);

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
    if (isMobile) {
      setSheetOpen(true);
    } else {
      setModalOpen(true);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Card className="glass-card glass-card-hover">
          <CardContent className="p-0">
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-4 py-3">
                      <Skeleton className="h-4 w-12" />
                    </th>
                    <th className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="px-4 py-3">
                      <Skeleton className="h-4 w-14" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-md" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-14" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Skeleton className="ml-auto h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 space-y-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Input
            placeholder="Search description or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-w-0 sm:w-64"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full min-w-0 max-w-full sm:w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full min-w-0 max-w-full sm:w-40">
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
            <SelectTrigger className="w-full min-w-0 max-w-full sm:w-36">
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
          <div className="flex-1 sm:min-w-0" />
          <Button onClick={handleAdd} size="sm" className="w-full sm:w-auto" aria-label="Add Transaction">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Add Transaction</span>
          </Button>
        </div>

        <Card className="glass-card glass-card-hover min-w-0 overflow-hidden">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                heading="No transactions yet"
                subtext="Add your first transaction to start tracking your finances"
                ctaLabel="Add transaction"
                onCtaClick={handleAdd}
              />
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
                      <th className="hidden px-4 py-3 font-medium md:table-cell">Category</th>
                      <th className="hidden px-4 py-3 font-medium md:table-cell">Wallet</th>
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
                          <td className="min-w-0 px-4 py-3">
                            <span className="block truncate max-w-[40ch] md:max-w-none" title={tx.description || undefined}>
                              {tx.description || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </span>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {tx.category}
                            </Badge>
                          </td>
                          <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
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
                                  size="icon-touch"
                                  aria-label="Row actions"
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
      <AddTransactionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
