import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Wallet, Transaction } from "@/types/database.types";

export async function prefetchDashboardData(
  supabase: SupabaseClient<Database>
) {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["wallets"] as const,
      queryFn: async (): Promise<Wallet[]> => {
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data as Wallet[]) ?? [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["transactions"] as const,
      queryFn: async (): Promise<Transaction[]> => {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });
        if (error) throw error;
        return (data as Transaction[]) ?? [];
      },
    }),
  ]);

  return dehydrate(queryClient);
}
