-- Structural guarantees for every table in `public`, so a new table can't ship
-- without RLS. Run with `npm run test:db` (pgTAP, against the local stack).
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

-- 1. RLS is enabled on every public table.
select is(
  (select array_agg(c.relname::text order by c.relname) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  null,
  'every public table has row level security enabled'
);

-- 2. ...and forced (applies to the table owner too).
select is(
  (select array_agg(c.relname::text order by c.relname) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relforcerowsecurity),
  null,
  'every public table forces row level security'
);

-- 3. Every table has at least one policy (RLS with no policy = silently unusable).
select is(
  (select array_agg(c.relname::text order by c.relname) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)),
  null,
  'every public table has at least one policy'
);

-- 4. No policy is granted to anon or PUBLIC.
select is(
  (select array_agg(tablename || '.' || policyname order by tablename) from pg_policies
    where schemaname = 'public' and (roles && array['anon','public']::name[])),
  null,
  'no policy applies to anon or public'
);

-- 5. Every policy keys on auth.uid().
select is(
  (select array_agg(tablename || '.' || policyname order by tablename) from pg_policies
    where schemaname = 'public'
      and coalesce(qual, '') not like '%auth.uid()%'
      and coalesce(with_check, '') not like '%auth.uid()%'),
  null,
  'every policy is scoped to auth.uid()'
);

-- 6. The anon role holds no privileges on any public table.
select is(
  (select array_agg(distinct table_name::text) from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'),
  null,
  'anon has no table privileges in public'
);

-- 7. Clients can't write to the audit log.
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT')
  and not has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.audit_logs', 'DELETE'),
  'audit_logs is read-only for authenticated users'
);

select * from finish();
rollback;
