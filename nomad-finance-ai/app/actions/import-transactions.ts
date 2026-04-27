"use server";

import { revalidatePath } from "next/cache";
import { generateExternalId } from "@/lib/csv/dedupe";
import type { ParsedTransaction } from "@/lib/csv/types";
import { createClient } from "@/lib/supabase/server";
import type { SupportedCurrency } from "@/lib/constants";

export type ImportTransactionsResult = {
  inserted: number;
  skipped: number;
  errors: string[];
};

type WalletLookup = {
  id: string;
  currency: SupportedCurrency;
};

export async function importTransactions(
  parsed: ParsedTransaction[]
): Promise<ImportTransactionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  if (parsed.length === 0) {
    return { inserted: 0, skipped: 0, errors: ["No transactions to import."] };
  }

  const { data: wallets, error: walletsError } = await supabase
    .from("wallets")
    .select("id, currency")
    .eq("user_id", user.id);

  if (walletsError) {
    throw new Error(walletsError.message);
  }

  const walletByCurrency = new Map<string, WalletLookup>();
  for (const wallet of wallets ?? []) {
    walletByCurrency.set(wallet.currency, {
      id: wallet.id,
      currency: wallet.currency as SupportedCurrency,
    });
  }

  const errors: string[] = [];
  const rows = await Promise.all(
    parsed.map(async (tx, index) => {
      const wallet = walletByCurrency.get(tx.currency);
      if (!wallet) {
        errors.push(
          `Row ${index + 1}: no wallet found for ${tx.currency}; skipped.`
        );
        return null;
      }

      return {
        user_id: user.id,
        wallet_id: wallet.id,
        type: tx.type,
        amount: Math.abs(tx.amount),
        currency: wallet.currency,
        category: tx.category ?? "Other",
        description: tx.description || null,
        date: tx.date.slice(0, 10),
        external_id: await generateExternalId(tx),
      };
    })
  );

  const insertRows = rows.filter((row): row is NonNullable<typeof row> => !!row);
  if (insertRows.length === 0) {
    return { inserted: 0, skipped: parsed.length, errors };
  }

  const { data, error } = await supabase
    .from("transactions")
    .upsert(insertRows, {
      onConflict: "user_id,external_id",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    return {
      inserted: 0,
      skipped: parsed.length,
      errors: [...errors, error.message],
    };
  }

  const inserted = data?.length ?? 0;
  const skipped = parsed.length - inserted;

  revalidatePath("/dashboard");

  return { inserted, skipped, errors };
}
