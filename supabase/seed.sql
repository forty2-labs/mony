-- ============================================================================
-- Local development seed: a demo account with a year of realistic data.
-- ============================================================================
-- Runs on `npm run db:reset` (and on the first `db:start` of a fresh volume).
-- It is never pushed to a hosted project: `supabase db push` only applies
-- migrations, not seeds.
--
--   email:    demo@example.com
--   password: MonyDemo2026
--
-- All names and figures are fictional. Dates are relative to today, so the
-- dashboard always shows a current-looking year. The login page offers a
-- one-click sign-in for this account in development builds only.
-- ============================================================================

do $$
declare
  uid constant uuid := '00000000-0000-4000-8000-00000000d3e0';
  m int;
  i int;
  month_start date;
  d date;
  amt numeric;
  eur_rate constant numeric := 0.85420000; -- EUR -> GBP, fixed for the seed
  cat uuid;
begin
  -- Deterministic "random" values, so every reset produces the same data.
  perform setseed(0.2026);

  -- The auth user. Token columns must be '' (not null) for GoTrue to load it.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, last_sign_in_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'demo@example.com', extensions.crypt('MonyDemo2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Alex"}',
    now() - interval '1 year', now(), now(),
    '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text, 'email',
    jsonb_build_object('sub', uid::text, 'email', 'demo@example.com', 'email_verified', true),
    now(), now(), now()
  );

  -- The sign-up trigger has created the profile and default categories.
  update public.profiles
     set internal_transfer_names = array['Alex Morgan']
   where id = uid;

  -- Twelve months of income and spending, oldest first.
  for m in reverse 11..0 loop
    month_start := (date_trunc('month', current_date) - make_interval(months => m))::date;

    -- Salary on the 25th.
    d := month_start + 24;
    if d <= current_date then
      insert into public.income (user_id, category_id, source, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
      select uid, id, 'salary', 3450, 'GBP', 1, 3450, d, 'Monthly salary'
        from public.categories where user_id = uid and name = 'Salary' and kind = 'income';
    end if;

    -- Freelance work every few months.
    if m % 3 = 1 then
      amt := round((450 + random() * 650)::numeric, 2);
      d := month_start + 12;
      if d <= current_date then
        insert into public.income (user_id, category_id, source, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
        select uid, id, 'freelance', amt, 'GBP', 1, amt, d, 'Website project'
          from public.categories where user_id = uid and name = 'Freelance' and kind = 'income';
      end if;
    end if;

    -- Savings interest at month end (only for completed months).
    if m > 0 then
      amt := round((9 + random() * 6)::numeric, 2);
      insert into public.income (user_id, category_id, source, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
      select uid, id, 'interest', amt, 'GBP', 1, amt, (month_start + interval '1 month - 1 day')::date, 'Savings interest'
        from public.categories where user_id = uid and name = 'Investments' and kind = 'income';
    end if;

    -- Fixed monthly bills.
    insert into public.expenses (user_id, category_id, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
    select uid, c.id, v.amount, 'GBP', 1, v.amount, month_start + v.day_offset, v.note
      from (values
        ('Housing',   1250.00, 0,  'Rent'),
        ('Utilities',  64.50,  6,  'Energy'),
        ('Utilities',  38.00,  9,  'Broadband'),
        ('Utilities', 142.00,  14, 'Council tax'),
        ('Transport',  98.40,  1,  'Monthly travel pass'),
        ('Charity',    15.00,  2,  'Monthly donation')
      ) as v(cat_name, amount, day_offset, note)
      join public.categories c on c.user_id = uid and c.name = v.cat_name and c.kind = 'expense'
     where month_start + v.day_offset <= current_date;

    -- Day-to-day spending.
    for i in 1..7 loop  -- groceries
      d := month_start + (i * 4 - 2);
      continue when d > current_date or extract(month from d) <> extract(month from month_start);
      amt := round((22 + random() * 68)::numeric, 2);
      select id into cat from public.categories where user_id = uid and name = 'Groceries' and kind = 'expense';
      insert into public.expenses (user_id, category_id, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
      values (uid, cat, amt, 'GBP', 1, amt, d, (array['Weekly shop', 'Top-up shop', 'Farmers market', 'Bakery'])[1 + floor(random() * 4)::int]);
    end loop;

    for i in 1..5 loop  -- dining out
      d := month_start + (i * 6 - 1);
      continue when d > current_date or extract(month from d) <> extract(month from month_start);
      amt := round((9 + random() * 48)::numeric, 2);
      select id into cat from public.categories where user_id = uid and name = 'Dining' and kind = 'expense';
      insert into public.expenses (user_id, category_id, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
      values (uid, cat, amt, 'GBP', 1, amt, d, (array['Coffee and cake', 'Dinner with friends', 'Lunch out', 'Takeaway'])[1 + floor(random() * 4)::int]);
    end loop;

    for i in 1..3 loop  -- shopping, entertainment, personal care
      d := month_start + (i * 9);
      continue when d > current_date or extract(month from d) <> extract(month from month_start);
      amt := round((18 + random() * 95)::numeric, 2);
      select id into cat from public.categories
       where user_id = uid and kind = 'expense'
         and name = (array['Shopping', 'Entertainment', 'Personal Care'])[i];
      insert into public.expenses (user_id, category_id, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
      values (uid, cat, amt, 'GBP', 1, amt, d, (array['New trainers', 'Cinema tickets', 'Haircut'])[i]);
    end loop;

    -- An occasional health cost.
    if m % 2 = 0 and month_start + 17 <= current_date then
      amt := round((12 + random() * 45)::numeric, 2);
      insert into public.expenses (user_id, category_id, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
      select uid, id, amt, 'GBP', 1, amt, month_start + 17, 'Pharmacy'
        from public.categories where user_id = uid and name = 'Health' and kind = 'expense';
    end if;
  end loop;

  -- A summer trip abroad, paid in euros (shows the frozen FX rate per row).
  month_start := (date_trunc('month', current_date) - interval '4 months')::date;
  insert into public.expenses (user_id, category_id, amount_original, currency_original, exchange_rate, amount_base, occurred_on, notes)
  select uid, c.id, v.amount, 'EUR', eur_rate, round(v.amount * eur_rate, 2), month_start + v.day_offset, v.note
    from (values
      ('Travel', 286.00, 10, 'Hotel, Lisbon'),
      ('Dining',  64.80, 11, 'Dinner, Lisbon'),
      ('Travel',  42.50, 12, 'Train to Sintra'),
      ('Dining',  31.20, 13, 'Lunch, Lisbon')
    ) as v(cat_name, amount, day_offset, note)
    join public.categories c on c.user_id = uid and c.name = v.cat_name and c.kind = 'expense';

  -- Budgets for this month and last month.
  for m in 0..1 loop
    insert into public.budgets (user_id, category_id, period_month, amount_base)
    select uid, c.id, (date_trunc('month', current_date) - make_interval(months => m))::date, v.amount
      from (values ('Groceries', 340), ('Dining', 160), ('Shopping', 120), ('Entertainment', 80), ('Transport', 120))
        as v(cat_name, amount)
      join public.categories c on c.user_id = uid and c.name = v.cat_name and c.kind = 'expense';
  end loop;

  insert into public.savings_goals (user_id, name, target_amount_base, current_amount_base, deadline) values
    (uid, 'Emergency fund', 6000, 3850, null),
    (uid, 'Trip to Japan',  3500, 1240, (current_date + interval '10 months')::date),
    (uid, 'New laptop',     1800, 1650, (current_date + interval '2 months')::date);

  insert into public.loans (user_id, person_name, amount_original, currency_original, exchange_rate, amount_base, amount_repaid_base, expected_return_date, status, notes) values
    (uid, 'Jamie', 300, 'GBP', 1, 300,  0, (current_date + interval '1 month')::date, 'outstanding',      'Deposit for a flat'),
    (uid, 'Priya', 150, 'GBP', 1, 150, 50, (current_date + interval '3 weeks')::date, 'partially_repaid', 'Concert tickets'),
    (uid, 'Tom',    80, 'GBP', 1,  80, 80, null,                                     'repaid',           'Taxi home');

  insert into public.subscriptions (user_id, name, cost_original, currency_original, exchange_rate, cost_base, billing_cycle, next_payment_date, is_active) values
    (uid, 'Music streaming', 11.99, 'GBP', 1, 11.99, 'monthly', (date_trunc('month', current_date) + interval '1 month + 4 days')::date, true),
    (uid, 'Video streaming', 10.99, 'GBP', 1, 10.99, 'monthly', (date_trunc('month', current_date) + interval '1 month + 11 days')::date, true),
    (uid, 'Gym membership',  35.00, 'GBP', 1, 35.00, 'monthly', (date_trunc('month', current_date) + interval '1 month')::date, true),
    (uid, 'Cloud storage',    2.49, 'GBP', 1,  2.49, 'monthly', (date_trunc('month', current_date) + interval '1 month + 19 days')::date, true),
    (uid, 'News app',        99.00, 'GBP', 1, 99.00, 'yearly',  (current_date + interval '5 months')::date, true),
    (uid, 'Language app',     7.99, 'EUR', eur_rate, round(7.99 * eur_rate, 2), 'monthly', null, false);
end $$;
