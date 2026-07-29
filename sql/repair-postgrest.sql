-- QUICK FIX: "could not query the database for the schema cache" / can't log in
-- Run this ENTIRE file in Supabase SQL Editor (creates functions, then runs them).
--
-- After wipe with sql/wipe-verse.sql: run sql/complete-schema.sql (or sql/bootstrap-strainverse.sql for sign-up only)
-- Do NOT run only: select repair_postgrest_schemas('StrainVerse');
-- That fails until this script creates the function first.
--
-- For full tables/RLS/storage: run sql/complete-schema.sql instead.

create schema if not exists "StrainVerse";

drop function if exists public.repair_postgrest_schemas(text);

create or replace function public.repair_postgrest_schemas(required_schema text default 'StrainVerse')
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
    if required_schema is not null and exists (select 1 from pg_namespace where nspname = required_schema) then
      cleaned := cleaned || ',' || required_schema;
    end if;
  end if;

  execute format('alter role authenticator set pgrst.db_schemas = %L', cleaned);
  perform pg_notify('pgrst', 'reload config');
  perform pg_notify('pgrst', 'reload schema');

  return cleaned;
end;
$$;

grant execute on function public.repair_postgrest_schemas(text) to authenticated, service_role;

-- Minimal register_app_schema (same behavior as complete-schema.sql)
drop function if exists public.register_app_schema(text);
create or replace function public.register_app_schema(app_schema text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  config_entry text;
  db_schemas text := 'public';
  schema_parts text[];
  schema_part text;
  already_listed boolean := false;
begin
  if app_schema is null or length(trim(app_schema)) = 0 then
    raise exception 'register_app_schema: schema name is required';
  end if;

  if not exists (select 1 from pg_namespace where nspname = app_schema) then
    raise exception 'Invalid schema "%". Create it first: create schema if not exists "%";', app_schema, app_schema;
  end if;

  for config_entry in
    select unnest(rolconfig)
    from pg_roles
    where rolname = 'authenticator'
  loop
    if config_entry like 'pgrst.db_schemas=%' then
      db_schemas := substring(config_entry from 'pgrst.db_schemas=(.*)$');
    end if;
  end loop;

  schema_parts := string_to_array(db_schemas, ',');
  db_schemas := array_to_string(
    array(
      select distinct trim(part)
      from unnest(schema_parts) as part
      where trim(part) <> ''
        and lower(trim(part)) not in ('pg_pgrst_no_exposed_schemas', 'strain', 'strainverse')
        and exists (select 1 from pg_namespace n where n.nspname = trim(part))
    ),
    ','
  );

  schema_parts := string_to_array(db_schemas, ',');
  foreach schema_part in array schema_parts loop
    if trim(schema_part) = app_schema then
      already_listed := true;
      exit;
    end if;
  end loop;

  if not already_listed then
    db_schemas := trim(both ',' from db_schemas || ',' || app_schema);
    execute format('alter role authenticator set pgrst.db_schemas = %L', db_schemas);
    perform pg_notify('pgrst', 'reload config');
    perform pg_notify('pgrst', 'reload schema');
  end if;

  execute format('grant usage on schema %I to anon, authenticated, service_role', app_schema);
  execute format('grant all on all tables in schema %I to anon, authenticated, service_role', app_schema);
  execute format('grant all on all sequences in schema %I to anon, authenticated, service_role', app_schema);
  execute format('grant all on all routines in schema %I to anon, authenticated, service_role', app_schema);
  execute format('alter default privileges in schema %I grant all on tables to anon, authenticated, service_role', app_schema);
  execute format('alter default privileges in schema %I grant all on sequences to anon, authenticated, service_role', app_schema);
  execute format('alter default privileges in schema %I grant all on routines to anon, authenticated, service_role', app_schema);

  return db_schemas;
end;
$$;

grant execute on function public.register_app_schema(text) to authenticated, service_role;

select public.repair_postgrest_schemas('StrainVerse'::text) as postgrest_schemas;
select public.register_app_schema('StrainVerse') as registered_schemas;

notify pgrst, 'reload schema';
