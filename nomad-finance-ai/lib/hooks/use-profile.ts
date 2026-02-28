"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/lib/demo-context";
import { DEMO_PRIMARY_CURRENCY } from "@/lib/demo";
import type { SupportedCurrency } from "@/lib/constants";

export function useProfile() {
  const { isDemo } = useDemoMode();

  return useQuery({
    queryKey: ["profile", isDemo] as const,
    queryFn: async (): Promise<{ primary_currency: SupportedCurrency } | null> => {
      if (isDemo) return null;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("primary_currency")
        .eq("id", user.id)
        .single();

      if (error || !data?.primary_currency) return null;
      return { primary_currency: data.primary_currency as SupportedCurrency };
    },
    staleTime: isDemo ? Infinity : 60_000,
  });
}

export function useDisplayCurrency(): SupportedCurrency {
  const { isDemo } = useDemoMode();
  const { data: profile } = useProfile();

  if (isDemo) return DEMO_PRIMARY_CURRENCY;
  if (profile?.primary_currency) return profile.primary_currency as SupportedCurrency;
  return "EUR";
}
