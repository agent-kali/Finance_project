-- NomadFinance AI — Database Schema
-- Run this in your Supabase SQL Editor (supabase.com → project → SQL Editor)

-- 1. PROFILES (linked to auth.users via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  primary_currency text default 'EUR' check (primary_currency in ('EUR', 'USD', 'VND', 'GBP', 'PLN')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. WALLETS (one per currency per user)
create table public.wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  currency text not null check (currency in ('EUR', 'USD', 'VND', 'GBP', 'PLN')),
  balance numeric(15,2) default 0,
  created_at timestamptz default now(),
  unique(user_id, currency)
);

alter table public.wallets enable row level security;

create policy "Users can view their own wallets"
  on public.wallets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wallets"
  on public.wallets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own wallets"
  on public.wallets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own wallets"
  on public.wallets for delete
  using (auth.uid() = user_id);

-- 3. TRANSACTIONS
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(15,2) not null,
  currency text not null check (currency in ('EUR', 'USD', 'VND', 'GBP', 'PLN')),
  category text not null,
  description text,
  date date default current_date,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Indexes for common queries
create index idx_transactions_user_date on public.transactions(user_id, date desc);
create index idx_transactions_user_category on public.transactions(user_id, category);
create index idx_wallets_user on public.wallets(user_id);
