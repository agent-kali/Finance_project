"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupportedCurrency } from "@/lib/constants";

export async function updateProfilePrimaryCurrency(currency: SupportedCurrency) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) ?? null,
      primary_currency: currency,
    },
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);
}
