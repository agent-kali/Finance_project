"use server";

import { createClient } from "@/lib/supabase/server";

type TransactionInput = {
  wallet_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string;
  date: string;
};

export async function createTransaction(input: TransactionInput) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("currency, balance")
    .eq("id", input.wallet_id)
    .single();
  if (walletError || !wallet) throw new Error("Wallet not found");

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      wallet_id: input.wallet_id,
      amount: input.amount,
      type: input.type,
      currency: wallet.currency,
      category: input.category,
      description: input.description || null,
      date: input.date,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const delta = input.type === "income" ? input.amount : -input.amount;
  await supabase
    .from("wallets")
    .update({ balance: Number(wallet.balance) + delta })
    .eq("id", input.wallet_id);

  return data;
}

export async function updateTransaction(
  id: string,
  input: Partial<TransactionInput>
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = {};
  if (input.wallet_id) updateData.wallet_id = input.wallet_id;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.type) updateData.type = input.type;
  if (input.category) updateData.category = input.category;
  if (input.description !== undefined)
    updateData.description = input.description || null;
  if (input.date) updateData.date = input.date;

  if (input.wallet_id) {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("currency")
      .eq("id", input.wallet_id)
      .single();
    if (wallet) updateData.currency = wallet.currency;
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { data: tx } = await supabase
    .from("transactions")
    .select("wallet_id, amount, type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  if (tx) {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("id", tx.wallet_id)
      .single();

    if (wallet) {
      const reversal = tx.type === "income" ? -tx.amount : tx.amount;
      await supabase
        .from("wallets")
        .update({ balance: Number(wallet.balance) + reversal })
        .eq("id", tx.wallet_id);
    }
  }

}
