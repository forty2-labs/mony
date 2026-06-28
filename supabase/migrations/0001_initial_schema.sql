-- ============================================================================
-- Vault — Personal Expense Tracker
-- Migration 0001: initial schema, indexes, RLS, triggers
-- ============================================================================
-- Run this in the Supabase SQL editor (or via the Supabase CLI) against a fresh
-- project. It is idempotent enough to re-run on a clean DB but assumes the
-- standard Supabase `auth` schema exists.
--
-- Design rules encoded here:
--   * Single user per row: every table carries user_id = auth.uid().
--   * RLS is enabled and FORCED on every table; there are NO public policies.
--   * Money is stored as numeric(14,2); FX rates as numeric(18,8) and are FROZEN
--     per transaction (amount_base is the converted, immutable value).
--   * Soft deletion (deleted_at) on high-churn transactional tables.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type billing_cycle as enum ('weekly', 'monthly', 'quarterly', 'yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type loan_status as enum ('outstanding', 'partially_repaid', 'repaid', 'written_off');
exception when duplicate_object then null; end $$;

do $$ begin
  create type income_source as enum ('salary', 'freelance', 'investment', 'interest', 'refund', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type category_kind as enum ('expense', 'income');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  base_currency char(3) not null default 'GBP',
  inactivity_timeout_minutes int not null default 30 check (inactivity_timeout_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-provision a profile row when a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind category_kind not null default 'expense',
  color text,
  icon text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, kind)
);
create index if not exists categories_user_idx on categories(user_id) where is_archived = false;

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount_original numeric(14,2) not null check (amount_original >= 0),
  currency_original char(3) not null,
  exchange_rate numeric(18,8) not null default 1 check (exchange_rate > 0),
  amount_base numeric(14,2) not null check (amount_base >= 0),
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists expenses_user_date_idx on expenses(user_id, occurred_on desc) where deleted_at is null;
create index if not exists expenses_category_idx on expenses(category_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- income
-- ---------------------------------------------------------------------------
create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  source income_source not null default 'salary',
  amount_original numeric(14,2) not null check (amount_original >= 0),
  currency_original char(3) not null,
  exchange_rate numeric(18,8) not null default 1 check (exchange_rate > 0),
  amount_base numeric(14,2) not null check (amount_base >= 0),
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists income_user_date_idx on income(user_id, occurred_on desc) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- budgets (one row per category per month)
-- ---------------------------------------------------------------------------
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  period_month date not null, -- normalised to first day of month
  amount_base numeric(14,2) not null check (amount_base >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, period_month)
);
create index if not exists budgets_user_period_idx on budgets(user_id, period_month);

-- ---------------------------------------------------------------------------
-- savings_goals
-- ---------------------------------------------------------------------------
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount_base numeric(14,2) not null check (target_amount_base > 0),
  current_amount_base numeric(14,2) not null default 0 check (current_amount_base >= 0),
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists savings_goals_user_idx on savings_goals(user_id);

-- ---------------------------------------------------------------------------
-- loans (money lent to others)
-- ---------------------------------------------------------------------------
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null,
  amount_original numeric(14,2) not null check (amount_original >= 0),
  currency_original char(3) not null,
  exchange_rate numeric(18,8) not null default 1 check (exchange_rate > 0),
  amount_base numeric(14,2) not null check (amount_base >= 0),
  amount_repaid_base numeric(14,2) not null default 0 check (amount_repaid_base >= 0),
  expected_return_date date,
  status loan_status not null default 'outstanding',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists loans_user_status_idx on loans(user_id, status);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cost_original numeric(14,2) not null check (cost_original >= 0),
  currency_original char(3) not null,
  exchange_rate numeric(18,8) not null default 1 check (exchange_rate > 0),
  cost_base numeric(14,2) not null check (cost_base >= 0),
  billing_cycle billing_cycle not null default 'monthly',
  next_payment_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_active_idx on subscriptions(user_id) where is_active = true;

-- ---------------------------------------------------------------------------
-- exchange_rates (user-scoped snapshot cache; transactions freeze their own)
-- ---------------------------------------------------------------------------
create table if not exists exchange_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  base_currency char(3) not null,
  quote_currency char(3) not null,
  rate numeric(18,8) not null check (rate > 0),
  as_of date not null,
  created_at timestamptz not null default now(),
  unique (user_id, base_currency, quote_currency, as_of)
);

-- ---------------------------------------------------------------------------
-- audit_logs (append-only)
-- ---------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_user_idx on audit_logs(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','categories','expenses','income','budgets',
    'savings_goals','loans','subscriptions'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on %I', t);
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function set_updated_at()',
      t
    );
  end loop;
end $$;

-- ============================================================================
-- Row Level Security — enable + force + owner-only policies on EVERY table.
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','categories','expenses','income','budgets','savings_goals',
    'loans','subscriptions','exchange_rates','audit_logs'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

-- profiles: id IS the user id
drop policy if exists "profiles owner" on profiles;
create policy "profiles owner" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Generic owner-only policy for all user_id-scoped tables.
do $$
declare t text;
begin
  foreach t in array array[
    'categories','expenses','income','budgets','savings_goals',
    'loans','subscriptions','exchange_rates'
  ]
  loop
    execute format('drop policy if exists "%s owner" on %I', t, t);
    execute format(
      'create policy "%s owner" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t, t
    );
  end loop;
end $$;

-- audit_logs: owner may read and insert, but never update/delete (append-only).
drop policy if exists "audit_logs select" on audit_logs;
drop policy if exists "audit_logs insert" on audit_logs;
create policy "audit_logs select" on audit_logs
  for select using (user_id = auth.uid());
create policy "audit_logs insert" on audit_logs
  for insert with check (user_id = auth.uid());
