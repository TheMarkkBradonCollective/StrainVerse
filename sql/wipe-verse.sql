-- =============================================================================
-- NUCLEAR RESET — entire shared Verse Supabase project
-- Cookbook.io + StrainVerse + SpiritsVerse (all apps, all users, all data)
-- =============================================================================
--
-- RUN THIS ENTIRE FILE in Supabase SQL Editor (postgres role).
-- IRREVERSIBLE. After this you are starting from zero.
--
-- After wipe, re-run each app's setup SQL:
--   StrainVerse  -> sql/complete-schema.sql
--   Cookbook     -> that repo's complete setup script
--   SpiritsVerse -> that repo's complete setup script
--
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) Drop every Verse app schema (tables, views, types, policies — everything)
--    Add/rename schemas here if your project uses different names.
-- -----------------------------------------------------------------------------
drop schema if exists "StrainVerse" cascade;
drop schema if exists "Cookbook" cascade;
drop schema if exists "SpiritsVerse" cascade;

-- Legacy / typo schemas (safe if already gone)
drop schema if exists strain cascade;
drop schema if exists strainverse cascade;
drop schema if exists cookbook cascade;
drop schema if exists spiritsverse cascade;

-- -----------------------------------------------------------------------------
-- 2) Wipe shared auth (one auth.users for all Verse apps)
-- -----------------------------------------------------------------------------
delete from auth.refresh_tokens;
delete from auth.sessions;
delete from auth.mfa_challenges;
delete from auth.mfa_amr_claims;
delete from auth.mfa_factors;
delete from auth.one_time_tokens;
delete from auth.flow_state;
delete from auth.identities;
delete from auth.users;

-- -----------------------------------------------------------------------------
-- 3) Wipe all storage buckets and uploaded files
--    Supabase blocks raw DELETE unless this session flag is set (prevents orphans).
-- -----------------------------------------------------------------------------
select set_config('storage.allow_delete_query', 'true', true);

delete from storage.objects;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'prefixes'
  ) then
    delete from storage.prefixes;
  end if;
end $$;

delete from storage.buckets;

commit;

-- -----------------------------------------------------------------------------
-- 4) Repair PostgREST (remove references to dropped schemas)
--    Creates function if missing; safe to run after wipe.
-- -----------------------------------------------------------------------------
create or replace function public.repair_postgrest_schemas(required_schema text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  config_entry text;
  db_schemas text := 'public';
  cleaned text;
begin
  for config_entry in
    select unnest(rolconfig)
    from pg_roles
    where rolname = 'authenticator'
  loop
    if config_entry like 'pgrst.db_schemas=%' then
      db_schemas := substring(config_entry from 'pgrst.db_schemas=(.*)$');
    end if;
  end loop;

  cleaned := array_to_string(
    array(
      select distinct trim(part)
      from unnest(string_to_array(db_schemas, ',')) as part
      where trim(part) <> ''
        and lower(trim(part)) not in ('pg_pgrst_no_exposed_schemas', 'strain', 'strainverse')
        and exists (select 1 from pg_namespace n where n.nspname = trim(part))
    ),
    ','
  );

  if required_schema is not null
     and exists (select 1 from pg_namespace where nspname = required_schema)
     and not exists (
       select 1
       from unnest(string_to_array(cleaned, ',')) as existing(part)
       where trim(existing.part) = required_schema
     ) then
    cleaned := trim(both ',' from coalesce(nullif(cleaned, ''), 'public') || ',' || required_schema);
  end if;

  if cleaned is null or cleaned = '' then
    cleaned := 'public';
  end if;

  execute format('alter role authenticator set pgrst.db_schemas = %L', cleaned);
  perform pg_notify('pgrst', 'reload config');
  perform pg_notify('pgrst', 'reload schema');

  return cleaned;
end;
$$;

select public.repair_postgrest_schemas(null) as postgrest_schemas_after_wipe;
notify pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- 5) Verify everything is gone
-- -----------------------------------------------------------------------------
select count(*) as auth_users_remaining from auth.users;
select count(*) as storage_buckets_remaining from storage.buckets;
select count(*) as storage_objects_remaining from storage.objects;

select nspname as remaining_app_schemas
from pg_namespace
where nspname in ('StrainVerse', 'Cookbook', 'SpiritsVerse', 'strain', 'strainverse')
order by nspname;

-- Next step: run sql/complete-schema.sql to rebuild StrainVerse from scratch.
