"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/lib/demo-context";
import { DEMO_WALLETS } from "@/lib/demo";
import type { Wallet } from "@/types/database.types";

export function useWallets() {
  const { isDemo } = useDemoMode();

  return useQuery({
    queryKey: ["wallets", isDemo] as const,
    queryFn: async (): Promise<Wallet[]> => {
      if (isDemo) return DEMO_WALLETS;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as Wallet[]) ?? [];
    },
    staleTime: isDemo ? Infinity : 60_000,
  });
}
