-- ============================================================================
-- Migration 0003: multi-tenant security hardening (Phase 2)
-- ============================================================================
-- The app is now public and multi-user. This migration tightens the database so
-- isolation never depends on the client:
--
--   1. Privileges   — anon gets nothing; RLS policies apply to `authenticated`
--                     only and use `(select auth.uid())` (evaluated once per
--                     statement instead of once per row).
--   2. Ownership    — `user_id` defaults to auth.uid(), and category references
--                     are composite (user_id, category_id) foreign keys, so a row
--                     can never point at another user's category. Foreign-key
--                     checks bypass RLS, so this has to be enforced by the schema.
--   3. Bounds       — length/format checks stop one account from storing
--                     unbounded text.
--   4. Audit log    — clients can read their own entries but can no longer forge
--                     them (insert revoked).
--   5. Atomic RPCs  — loan repayments and savings contributions update in one
--                     statement, which removes the read-modify-write race.
--   6. Profiles     — per-user settings that used to be build-time env vars.
--   7. Aggregates   — the all-time balance is computed in Postgres instead of
--                     summing rows client-side (PostgREST caps responses at
--                     max_rows, so client-side sums silently truncate).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper hygiene: pin search_path on existing functions
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Privileges: the anon role can't touch application tables at all.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon, public;
-- Future objects created by migrations (run as `postgres`) inherit the same rule.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon, public;

-- Trigger functions must never be callable as RPCs.
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.set_updated_at() from authenticated;

-- ---------------------------------------------------------------------------
-- 2a. user_id defaults to the caller, so clients needn't (and can't usefully)
--     supply it. The RLS WITH CHECK still rejects any other value.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'categories','expenses','income','budgets','savings_goals',
    'loans','subscriptions','exchange_rates','audit_logs'
  ]
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2b. Same-owner category references.
-- ---------------------------------------------------------------------------
alter table public.categories
  add constraint categories_user_id_id_key unique (user_id, id);

alter table public.expenses drop constraint if exists expenses_category_id_fkey;
alter table public.expenses
  add constraint expenses_category_owner_fkey
  foreign key (user_id, category_id) references public.categories (user_id, id)
  on delete set null (category_id);

alter table public.income drop constraint if exists income_category_id_fkey;
alter table public.income
  add constraint income_category_owner_fkey
  foreign key (user_id, category_id) references public.categories (user_id, id)
  on delete set null (category_id);

alter table public.budgets drop constraint if exists budgets_category_id_fkey;
alter table public.budgets
  add constraint budgets_category_owner_fkey
  foreign key (user_id, category_id) references public.categories (user_id, id)
  on delete cascade;

create index if not exists income_category_idx on public.income (category_id) where deleted_at is null;
create index if not exists budgets_category_idx on public.budgets (category_id);

-- ---------------------------------------------------------------------------
-- 3. Bounds and formats
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_display_name_len check (display_name is null or char_length(display_name) <= 120),
  add constraint profiles_base_currency_fmt check (base_currency ~ '^[A-Z]{3}$'),
  add constraint profiles_timeout_max check (inactivity_timeout_minutes <= 1440);

alter table public.categories
  add constraint categories_name_len check (char_length(btrim(name)) between 1 and 60),
  add constraint categories_color_fmt check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint categories_icon_len check (icon is null or char_length(icon) <= 40);

alter table public.expenses
  add constraint expenses_notes_len check (notes is null or char_length(notes) <= 1000),
  add constraint expenses_currency_fmt check (currency_original ~ '^[A-Z]{3}$'),
  add constraint expenses_date_range check (occurred_on between date '1970-01-01' and date '2100-12-31');

alter table public.income
  add constraint income_notes_len check (notes is null or char_length(notes) <= 1000),
  add constraint income_currency_fmt check (currency_original ~ '^[A-Z]{3}$'),
  add constraint income_date_range check (occurred_on between date '1970-01-01' and date '2100-12-31');

alter table public.budgets
  add constraint budgets_period_first_of_month check (extract(day from period_month) = 1);

alter table public.savings_goals
  add constraint savings_goals_name_len check (char_length(btrim(name)) between 1 and 120);

alter table public.loans
  add constraint loans_person_len check (char_length(btrim(person_name)) between 1 and 120),
  add constraint loans_notes_len check (notes is null or char_length(notes) <= 1000),
  add constraint loans_currency_fmt check (currency_original ~ '^[A-Z]{3}$'),
  add constraint loans_repaid_le_amount check (amount_repaid_base <= amount_base);

alter table public.subscriptions
  add constraint subscriptions_name_len check (char_length(btrim(name)) between 1 and 120),
  add constraint subscriptions_currency_fmt check (currency_original ~ '^[A-Z]{3}$');

alter table public.exchange_rates
  add constraint exchange_rates_ccy_fmt check (base_currency ~ '^[A-Z]{3}$' and quote_currency ~ '^[A-Z]{3}$');

alter table public.audit_logs
  add constraint audit_logs_action_len check (char_length(action) <= 64),
  add constraint audit_logs_entity_len check (char_length(entity) <= 64),
  add constraint audit_logs_metadata_size check (metadata is null or pg_column_size(metadata) <= 4096);

-- ---------------------------------------------------------------------------
-- 6. Per-user settings (previously build-time env vars shipped in the bundle)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists internal_transfer_names text[] not null default '{}',
  add constraint profiles_transfer_names_bounds check (
    cardinality(internal_transfer_names) <= 20
    and char_length(array_to_string(internal_transfer_names, ',')) <= 1000
  );

-- Cap the display name taken from sign-up metadata (user-controlled input).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(nullif(btrim(new.raw_user_meta_data->>'display_name'), ''), 120))
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, kind, color, icon) values
    (new.id, 'Groceries',      'expense', '#34A368', 'cart'),
    (new.id, 'Dining',         'expense', '#E8A23A', 'utensils'),
    (new.id, 'Entertainment',  'expense', '#FF375F', 'film'),
    (new.id, 'Shopping',       'expense', '#FF9F0A', 'bag'),
    (new.id, 'Transport',      'expense', '#0A84FF', 'car'),
    (new.id, 'Travel',         'expense', '#64D2FF', 'plane'),
    (new.id, 'Housing',        'expense', '#8E8E93', 'home'),
    (new.id, 'Utilities',      'expense', '#5E5CE6', 'bolt'),
    (new.id, 'Health',         'expense', '#30D158', 'activity'),
    (new.id, 'Personal Care',  'expense', '#FF66B2', 'sparkles'),
    (new.id, 'Charity',        'expense', '#FF3B30', 'hand-heart'),
    (new.id, 'Remittance',     'expense', '#00B8D9', 'send'),
    (new.id, 'Other',          'expense', '#98989D', 'ellipsis'),
    (new.id, 'Salary',         'income',  '#34A368', 'wallet'),
    (new.id, 'Freelance',      'income',  '#0A84FF', 'laptop'),
    (new.id, 'Investments',    'income',  '#5E5CE6', 'trending-up'),
    (new.id, 'Other Income',   'income',  '#98989D', 'ellipsis')
  on conflict (user_id, name, kind) do nothing;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from authenticated, anon, public;

-- ---------------------------------------------------------------------------
-- 1b/4. Policies — rebuilt for `authenticated` only.
-- ---------------------------------------------------------------------------
-- profiles: readable and updatable by the owner. Rows are created by the
-- sign-up trigger and removed by the auth.users cascade, so no insert/delete.
drop policy if exists "profiles owner" on public.profiles;
create policy "profiles select own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, delete on public.profiles from authenticated;
-- The id is the ownership key; never let it be rewritten.
revoke update on public.profiles from authenticated;
grant update (display_name, base_currency, inactivity_timeout_minutes, internal_transfer_names)
  on public.profiles to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'categories','expenses','income','budgets','savings_goals',
    'loans','subscriptions','exchange_rates'
  ]
  loop
    execute format('drop policy if exists "%s owner" on public.%I', t, t);
    execute format(
      'create policy "%s owner" on public.%I for all to authenticated '
      'using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t, t
    );
  end loop;
end $$;

-- audit_logs: read-only for clients. Server-side code (triggers / service role)
-- is the only writer, so entries can't be forged.
drop policy if exists "audit_logs select" on public.audit_logs;
drop policy if exists "audit_logs insert" on public.audit_logs;
create policy "audit_logs select own" on public.audit_logs
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.audit_logs from authenticated;

-- ---------------------------------------------------------------------------
-- 5. Atomic RPCs (security invoker: RLS still decides which rows are visible)
-- ---------------------------------------------------------------------------
create or replace function public.record_loan_repayment(p_loan_id uuid, p_amount_base numeric)
returns public.loans
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.loans;
begin
  if p_amount_base is null or p_amount_base <= 0 then
    raise exception 'Repayment must be greater than zero' using errcode = '22023';
  end if;

  update public.loans l
     set amount_repaid_base = least(l.amount_base, l.amount_repaid_base + p_amount_base),
         status = case
           when l.status = 'written_off' then l.status
           when least(l.amount_base, l.amount_repaid_base + p_amount_base) >= l.amount_base
                and l.amount_base > 0 then 'repaid'::public.loan_status
           else 'partially_repaid'::public.loan_status
         end
   where l.id = p_loan_id
  returning l.* into result;

  if not found then
    raise exception 'Loan not found' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

create or replace function public.contribute_to_goal(p_goal_id uuid, p_delta numeric)
returns public.savings_goals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.savings_goals;
begin
  if p_delta is null or p_delta = 0 then
    raise exception 'Amount must not be zero' using errcode = '22023';
  end if;

  update public.savings_goals g
     set current_amount_base = greatest(0, g.current_amount_base + p_delta)
   where g.id = p_goal_id
  returning g.* into result;

  if not found then
    raise exception 'Savings goal not found' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Aggregates
-- ---------------------------------------------------------------------------
-- All-time income minus expenses for the caller (RLS-scoped, security invoker).
create or replace function public.account_balance()
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce((select sum(amount_base) from public.income   where deleted_at is null), 0)
  - coalesce((select sum(amount_base) from public.expenses where deleted_at is null), 0);
$$;

revoke execute on function public.record_loan_repayment(uuid, numeric) from anon, public;
revoke execute on function public.contribute_to_goal(uuid, numeric) from anon, public;
revoke execute on function public.account_balance() from anon, public;
grant execute on function public.record_loan_repayment(uuid, numeric) to authenticated;
grant execute on function public.contribute_to_goal(uuid, numeric) to authenticated;
grant execute on function public.account_balance() to authenticated;
