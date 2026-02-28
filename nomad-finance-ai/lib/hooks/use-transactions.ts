"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/lib/demo-context";
import { DEMO_TRANSACTIONS } from "@/lib/demo";
import type { Transaction } from "@/types/database.types";

export function useTransactions() {
  const { isDemo } = useDemoMode();

  return useQuery({
    queryKey: ["transactions", isDemo] as const,
    queryFn: async (): Promise<Transaction[]> => {
      if (isDemo) return DEMO_TRANSACTIONS;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return (data as Transaction[]) ?? [];
    },
    staleTime: isDemo ? Infinity : 60_000,
  });
}
