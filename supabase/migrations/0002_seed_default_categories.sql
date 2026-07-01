-- ============================================================================
-- Migration 0002: seed a sensible set of default categories for new users.
-- Extends handle_new_user() so a fresh account is immediately usable.
--
-- The `icon` values are keys into the inline icon set
-- (src/shared/components/Icon.tsx). Keep the two in sync when adding categories.
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
