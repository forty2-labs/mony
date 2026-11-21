-- ============================================================================
-- Migration 0004: mony brand palette for default categories
-- ============================================================================
-- New accounts get earthy category colours that match the mony theme (forest
-- #1E3B2F, sage #7F8C6A, sand #C8B48A, cream #F5F0E6) instead of the old
-- iOS-style blues and purples.
--
-- Existing accounts: only categories that still have their original default
-- name, kind AND colour are recoloured, so any colour a user chose is kept.
-- ============================================================================

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
    (new.id, 'Groceries',      'expense', '#5E7D4F', 'cart'),
    (new.id, 'Dining',         'expense', '#C8873A', 'utensils'),
    (new.id, 'Entertainment',  'expense', '#B5523B', 'film'),
    (new.id, 'Shopping',       'expense', '#C8B48A', 'bag'),
    (new.id, 'Transport',      'expense', '#3E6B5A', 'car'),
    (new.id, 'Travel',         'expense', '#6E9C8E', 'plane'),
    (new.id, 'Housing',        'expense', '#8A7B66', 'home'),
    (new.id, 'Utilities',      'expense', '#A08A3C', 'bolt'),
    (new.id, 'Health',         'expense', '#7FA06A', 'activity'),
    (new.id, 'Personal Care',  'expense', '#C27C8E', 'sparkles'),
    (new.id, 'Charity',        'expense', '#9C4A3A', 'hand-heart'),
    (new.id, 'Remittance',     'expense', '#4F7A74', 'send'),
    (new.id, 'Other',          'expense', '#9A9486', 'ellipsis'),
    (new.id, 'Salary',         'income',  '#1E3B2F', 'wallet'),
    (new.id, 'Freelance',      'income',  '#7F8C6A', 'laptop'),
    (new.id, 'Investments',    'income',  '#D4A24C', 'trending-up'),
    (new.id, 'Other Income',   'income',  '#9A9486', 'ellipsis')
  on conflict (user_id, name, kind) do nothing;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from authenticated, anon, public;

update public.categories c
   set color = m.new_color
  from (values
    ('Groceries',     'expense', '#34A368', '#5E7D4F'),
    ('Dining',        'expense', '#E8A23A', '#C8873A'),
    ('Entertainment', 'expense', '#FF375F', '#B5523B'),
    ('Shopping',      'expense', '#FF9F0A', '#C8B48A'),
    ('Transport',     'expense', '#0A84FF', '#3E6B5A'),
    ('Travel',        'expense', '#64D2FF', '#6E9C8E'),
    ('Housing',       'expense', '#8E8E93', '#8A7B66'),
    ('Utilities',     'expense', '#5E5CE6', '#A08A3C'),
    ('Health',        'expense', '#30D158', '#7FA06A'),
    ('Personal Care', 'expense', '#FF66B2', '#C27C8E'),
    ('Charity',       'expense', '#FF3B30', '#9C4A3A'),
    ('Remittance',    'expense', '#00B8D9', '#4F7A74'),
    ('Other',         'expense', '#98989D', '#9A9486'),
    ('Salary',        'income',  '#34A368', '#1E3B2F'),
    ('Freelance',     'income',  '#0A84FF', '#7F8C6A'),
    ('Investments',   'income',  '#5E5CE6', '#D4A24C'),
    ('Other Income',  'income',  '#98989D', '#9A9486')
  ) as m(name, kind, old_color, new_color)
 where c.name = m.name
   and c.kind = m.kind::public.category_kind
   and upper(c.color) = m.old_color;
