import type { SupportedCurrency } from "@/lib/constants";

export type Profile = {
  id: string;
  full_name: string | null;
  primary_currency: SupportedCurrency;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  currency: SupportedCurrency;
  balance: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  wallet_id: string;
  type: "income" | "expense";
  amount: number;
  currency: SupportedCurrency;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Wallet, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Omit<Transaction, "id" | "user_id" | "created_at">
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
