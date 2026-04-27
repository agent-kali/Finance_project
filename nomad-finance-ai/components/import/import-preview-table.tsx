"use client";

import { Pencil } from "lucide-react";
import {
  IMPORT_CATEGORIES,
  type ImportCategory,
  type ParsedTransaction,
} from "@/lib/csv/types";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ImportPreviewRow = ParsedTransaction & {
  category: ImportCategory;
  needs_review?: boolean;
};

type ImportPreviewTableProps = {
  transactions: ImportPreviewRow[];
  onCategoryChange: (index: number, category: ImportCategory) => void;
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(Math.abs(amount));
}

export function ImportPreviewTable({
  transactions,
  onCategoryChange,
}: ImportPreviewTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#b8956a]/20 bg-[#171412]">
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#211d1a] text-xs uppercase tracking-[0.18em] text-[#f7efe3]/50">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Currency</th>
              <th className="px-4 py-3 font-medium">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7efe3]/10">
            {transactions.map((tx, index) => (
              <tr
                key={`${tx.date}-${tx.amount}-${tx.description}-${index}`}
                className={cn(
                  "text-[#f7efe3]/80",
                  tx.needs_review && "border-l-2 border-l-[#b8956a] bg-[#b8956a]/5"
                )}
              >
                <td className="whitespace-nowrap px-4 py-3 text-[#f7efe3]/65">
                  {formatDate(tx.date)}
                </td>
                <td className="max-w-[280px] truncate px-4 py-3">
                  {tx.description}
                </td>
                <td
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-right tabular-nums",
                    tx.type === "income" ? "text-emerald-300" : "text-[#f7efe3]"
                  )}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatAmount(tx.amount, tx.currency)}
                </td>
                <td className="px-4 py-3 text-[#f7efe3]/65">{tx.currency}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {tx.needs_review && (
                      <Pencil
                        className="size-3 shrink-0 text-[#b8956a]"
                        aria-label="Needs review"
                      />
                    )}
                    <Select
                      value={tx.category}
                      onValueChange={(value) =>
                        onCategoryChange(index, value as ImportCategory)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="h-8 min-w-32 border-[#b8956a]/25 bg-[#b8956a]/10 text-xs font-medium text-[#f7efe3] hover:bg-[#b8956a]/15"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#b8956a]/20 bg-[#211d1a] text-[#f7efe3]">
                        {IMPORT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
