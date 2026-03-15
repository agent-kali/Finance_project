"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupportedCurrency } from "@/lib/constants";

async function ensureProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, fullName?: string | null) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!data) {
    await supabase
      .from("profiles")
      .insert({ id: userId, full_name: fullName ?? null, primary_currency: "EUR" });
  }
}

export async function createWallet(
  currency: SupportedCurrency,
  options?: { balance?: number }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  await ensureProfile(supabase, user.id, user.user_metadata?.full_name as string | undefined);

  const balance = options?.balance ?? 0;
  const { data, error } = await supabase
    .from("wallets")
    .insert({ user_id: user.id, currency, balance })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateWallet(id: string, updates: { currency?: SupportedCurrency }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("wallets")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWallet(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}
