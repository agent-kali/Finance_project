-- NomadFinance AI — Seed Data for Demo Account
-- Run this AFTER schema.sql and AFTER creating the demo user in Supabase Auth
--
-- IMPORTANT: Before running this script:
-- 1. Go to Supabase → Authentication → Users → Add User
-- 2. Create: email = demo@nomadfinance.app, password = demo123
-- 3. Copy the user's UUID from the Users table
-- 4. Replace EVERY occurrence of 'DEMO_USER_ID' below with that UUID
--
-- Example: if the UUID is a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- then replace 'DEMO_USER_ID' with 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- The profile should auto-create via the trigger, but let's ensure it exists
insert into public.profiles (id, full_name, primary_currency)
values ('DEMO_USER_ID', 'Demo User', 'EUR')
on conflict (id) do update set full_name = 'Demo User', primary_currency = 'EUR';

-- Create 3 wallets (EUR, USD, VND)
insert into public.wallets (id, user_id, currency, balance) values
  ('00000000-0000-0000-0000-000000000001', 'DEMO_USER_ID', 'EUR', 4250.00),
  ('00000000-0000-0000-0000-000000000002', 'DEMO_USER_ID', 'USD', 1820.50),
  ('00000000-0000-0000-0000-000000000003', 'DEMO_USER_ID', 'VND', 45500000.00)
on conflict (user_id, currency) do update set balance = excluded.balance;

-- Transactions: ~45 realistic entries over 3 months (Dec 2025 – Feb 2026)
-- A digital nomad in Ho Chi Minh City earning in EUR/USD, spending in VND/EUR/USD

insert into public.transactions (user_id, wallet_id, type, amount, currency, category, description, date) values
-- === FEBRUARY 2026 ===
-- Income
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'income', 3200.00, 'EUR', 'Salary', 'Monthly salary – remote contract', '2026-02-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'income', 850.00, 'USD', 'Freelance', 'UI audit for SaaS client', '2026-02-05'),

-- Expenses EUR
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 89.00, 'EUR', 'SaaS & Tools', 'Vercel Pro + GitHub Copilot', '2026-02-02'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 210.00, 'EUR', 'Health & Insurance', 'SafetyWing nomad insurance', '2026-02-03'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 45.00, 'EUR', 'Entertainment', 'Spotify + Netflix', '2026-02-04'),

-- Expenses VND
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 8500000.00, 'VND', 'Housing', 'Studio apartment District 1', '2026-02-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 2200000.00, 'VND', 'Coworking', 'Dreamplex coworking monthly', '2026-02-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 350000.00, 'VND', 'Food & Dining', 'Banh mi & pho street food', '2026-02-06'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 890000.00, 'VND', 'Food & Dining', 'Dinner at Noir restaurant', '2026-02-08'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 150000.00, 'VND', 'Transportation', 'Grab rides weekly', '2026-02-10'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 450000.00, 'VND', 'Food & Dining', 'Groceries – Winmart', '2026-02-12'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 200000.00, 'VND', 'Entertainment', 'Cinema CGV', '2026-02-14'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 1500000.00, 'VND', 'Shopping', 'New keyboard – Phong Vu', '2026-02-16'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 380000.00, 'VND', 'Food & Dining', 'Coffee shops (various)', '2026-02-18'),

-- Expenses USD
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'expense', 29.00, 'USD', 'SaaS & Tools', 'Notion Plus', '2026-02-07'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'expense', 14.99, 'USD', 'Education', 'Frontend Masters monthly', '2026-02-09'),

-- === JANUARY 2026 ===
-- Income
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'income', 3200.00, 'EUR', 'Salary', 'Monthly salary – remote contract', '2026-01-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'income', 1200.00, 'USD', 'Freelance', 'Landing page for US startup', '2026-01-10'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'income', 500.00, 'EUR', 'Transfer', 'Wise transfer from savings', '2026-01-15'),

-- Expenses EUR
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 89.00, 'EUR', 'SaaS & Tools', 'Vercel Pro + GitHub Copilot', '2026-01-02'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 210.00, 'EUR', 'Health & Insurance', 'SafetyWing nomad insurance', '2026-01-03'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 45.00, 'EUR', 'Entertainment', 'Spotify + Netflix', '2026-01-04'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 120.00, 'EUR', 'Travel', 'Bus to Da Nang (round trip)', '2026-01-20'),

-- Expenses VND
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 8500000.00, 'VND', 'Housing', 'Studio apartment District 1', '2026-01-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 2200000.00, 'VND', 'Coworking', 'Dreamplex coworking monthly', '2026-01-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 420000.00, 'VND', 'Food & Dining', 'Pho 24 + street food', '2026-01-05'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 750000.00, 'VND', 'Food & Dining', 'Pizza 4Ps date night', '2026-01-12'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 180000.00, 'VND', 'Transportation', 'Grab rides', '2026-01-14'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 3200000.00, 'VND', 'Health & Insurance', 'Dental cleaning FV Hospital', '2026-01-18'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 550000.00, 'VND', 'Food & Dining', 'Groceries – Winmart', '2026-01-22'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 280000.00, 'VND', 'Food & Dining', 'Coffee shops', '2026-01-25'),

-- Expenses USD
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'expense', 29.00, 'USD', 'SaaS & Tools', 'Notion Plus', '2026-01-06'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'expense', 14.99, 'USD', 'Education', 'Frontend Masters monthly', '2026-01-08'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'expense', 49.00, 'USD', 'SaaS & Tools', 'Figma Pro', '2026-01-11'),

-- === DECEMBER 2025 ===
-- Income
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'income', 3200.00, 'EUR', 'Salary', 'Monthly salary – remote contract', '2025-12-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'income', 600.00, 'USD', 'Freelance', 'Code review for agency', '2025-12-15'),

-- Expenses EUR
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 89.00, 'EUR', 'SaaS & Tools', 'Vercel Pro + GitHub Copilot', '2025-12-02'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 210.00, 'EUR', 'Health & Insurance', 'SafetyWing nomad insurance', '2025-12-03'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 45.00, 'EUR', 'Entertainment', 'Spotify + Netflix', '2025-12-04'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 350.00, 'EUR', 'Travel', 'Flight HCMC → Bangkok', '2025-12-20'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000001', 'expense', 180.00, 'EUR', 'Travel', 'Bangkok hotel (2 nights)', '2025-12-21'),

-- Expenses VND
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 8500000.00, 'VND', 'Housing', 'Studio apartment District 1', '2025-12-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 2200000.00, 'VND', 'Coworking', 'Dreamplex coworking monthly', '2025-12-01'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 600000.00, 'VND', 'Food & Dining', 'Weekly street food', '2025-12-07'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 950000.00, 'VND', 'Food & Dining', 'Team dinner – Quan Bui', '2025-12-12'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 250000.00, 'VND', 'Transportation', 'Grab rides', '2025-12-15'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000003', 'expense', 1800000.00, 'VND', 'Shopping', 'Christmas gifts – Takashimaya', '2025-12-18'),

-- Expenses USD
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'expense', 29.00, 'USD', 'SaaS & Tools', 'Notion Plus', '2025-12-05'),
('DEMO_USER_ID', '00000000-0000-0000-0000-000000000002', 'expense', 14.99, 'USD', 'Education', 'Frontend Masters monthly', '2025-12-08');
