-- ============================================================================
-- Migration 0002: seed a sensible set of default categories for new users.
-- Extends handle_new_user() so a fresh account is immediately usable.
-- ============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, kind, color) values
    (new.id, 'Groceries',      'expense', '#34A368'),
    (new.id, 'Dining',         'expense', '#E8A23A'),
    (new.id, 'Transport',      'expense', '#0A84FF'),
    (new.id, 'Housing',        'expense', '#8E8E93'),
    (new.id, 'Utilities',      'expense', '#5E5CE6'),
    (new.id, 'Entertainment',  'expense', '#FF375F'),
    (new.id, 'Health',         'expense', '#30D158'),
    (new.id, 'Shopping',       'expense', '#FF9F0A'),
    (new.id, 'Travel',         'expense', '#64D2FF'),
    (new.id, 'Other',          'expense', '#98989D'),
    (new.id, 'Salary',         'income',  '#34A368'),
    (new.id, 'Freelance',      'income',  '#0A84FF'),
    (new.id, 'Investments',    'income',  '#5E5CE6'),
    (new.id, 'Other Income',   'income',  '#98989D')
  on conflict (user_id, name, kind) do nothing;

  return new;
end;
$$;
