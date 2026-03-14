"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { TransactionsTable } from "@/components/dashboard/transactions-table";

export function TransactionsContent() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
      <section aria-label="Transactions list">
        <ErrorBoundary fallbackTitle="Failed to load transactions">
          <TransactionsTable />
        </ErrorBoundary>
      </section>
    </div>
  );
}
