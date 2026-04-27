-- Migration: add external_id to transactions for CSV duplicate detection
-- Adds a nullable text column that stores a deterministic hash of
-- (date + amount + description) and a partial unique index per user
-- so the same imported row cannot be inserted twice.

alter table public.transactions
  add column if not exists external_id text;

create unique index if not exists idx_transactions_user_external_id
  on public.transactions(user_id, external_id)
  where external_id is not null;
