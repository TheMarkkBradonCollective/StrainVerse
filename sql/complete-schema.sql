-- =============================================================================
-- StrainVerse COMPLETE SCHEMA (canonical — run this file for all DB updates)
-- =============================================================================
-- Shared Verse Supabase project: https://vxahlxhrmypxxkrudqbd.supabase.co
-- Ecosystem: Cookbook.io, StrainVerse, SpiritsVerse (one auth.users, per-app schemas)
--
-- RUN THIS ENTIRE FILE in the Supabase SQL Editor whenever you pull app updates.
-- Safe to re-run continuously: IF NOT EXISTS, DROP POLICY IF EXISTS, idempotent DDL.
--
-- What this script does:
--   1. Creates/repairs PostgREST schema exposure (fixes PGRST002 / login failures)
--   2. Creates/updates all StrainVerse tables, views, triggers, RLS policies
--   3. Applies column additions, indexes, and migrations from prior split SQL files
--   4. Creates storage bucket + policies
--   5. Backfills profiles for existing auth.users (Cookbook / SpiritsVerse cross-app)
--   6. Registers StrainVerse with the Data API and reloads PostgREST
--
-- After running:
--   Dashboard -> Project Settings -> Data API -> Exposed schemas must include StrainVerse
--   (remove dead entries: strain, strainverse)
--
-- Optional strain data (not schema): sql/seed-strains.sql, sql/seed-strains-extended.sql
-- =============================================================================

create extension if not exists "pgcrypto";

create schema if not exists "StrainVerse";

-- Repairs PostgREST exposed schemas (fixes PGRST002 / schema cache errors).
-- Removes dropped schemas like strain/strainverse from pgrst.db_schemas.
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

-- Run repair immediately (safe if StrainVerse schema already exists)
select public.repair_postgrest_schemas('StrainVerse');

-- Registers a custom schema with PostgREST (Supabase Data API).
-- Preserves exact schema casing and appends to existing exposed schemas.
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

-- CORE TABLES --

-- 1. Profiles Table (stores public user data)
-- This table is linked to the auth.users table
create table if not exists "StrainVerse".profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  handle text not null unique,
  avatar text,
  bio text,
  widgets jsonb default '[]'::jsonb,
  latitude float8,
  longitude float8,
  distance_radius float8,
  fav_strains jsonb default '[]'::jsonb,
  smoking_style text,
  created_at timestamptz default now()
);
alter table "StrainVerse".profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on "StrainVerse".profiles;
create policy "Public profiles are viewable by everyone." on "StrainVerse".profiles for select using (true);
drop policy if exists "Users can insert their own profile." on "StrainVerse".profiles;
create policy "Users can insert their own profile." on "StrainVerse".profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update their own profile." on "StrainVerse".profiles;
create policy "Users can update their own profile." on "StrainVerse".profiles for update using (auth.uid() = id);

-- 2. Posts Table
create table if not exists "StrainVerse".posts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    content text not null,
    image text,
    visibility text not null,
    latitude float8,
    longitude float8,
    comments int default 0,
    created_at timestamptz default now()
);
alter table "StrainVerse".posts enable row level security;
drop policy if exists "Posts are viewable by everyone." on "StrainVerse".posts;
create policy "Posts are viewable by everyone." on "StrainVerse".posts for select using (true);
drop policy if exists "Users can create posts." on "StrainVerse".posts;
create policy "Users can create posts." on "StrainVerse".posts for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own posts." on "StrainVerse".posts;
create policy "Users can update their own posts." on "StrainVerse".posts for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own posts." on "StrainVerse".posts;
create policy "Users can delete their own posts." on "StrainVerse".posts for delete using (auth.uid() = user_id);

-- 3. Post Reactions Table
create table if not exists "StrainVerse".post_reactions (
    id uuid primary key default gen_random_uuid(),
    post_id uuid references "StrainVerse".posts(id) on delete cascade not null,
    user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    type text not null,
    created_at timestamptz default now(),
    unique (post_id, user_id)
);
alter table "StrainVerse".post_reactions enable row level security;
drop policy if exists "Reactions are viewable by everyone." on "StrainVerse".post_reactions;
create policy "Reactions are viewable by everyone." on "StrainVerse".post_reactions for select using (true);
drop policy if exists "Users can manage their own reactions." on "StrainVerse".post_reactions;
create policy "Users can manage their own reactions." on "StrainVerse".post_reactions for all using (auth.uid() = user_id);

-- 4. Post Comments Table
create table if not exists "StrainVerse".post_comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid references "StrainVerse".posts(id) on delete cascade not null,
    user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    content text not null,
    created_at timestamptz default now()
);
alter table "StrainVerse".post_comments enable row level security;
drop policy if exists "Comments are viewable by everyone." on "StrainVerse".post_comments;
create policy "Comments are viewable by everyone." on "StrainVerse".post_comments for select using (true);
drop policy if exists "Users can create comments." on "StrainVerse".post_comments;
create policy "Users can create comments." on "StrainVerse".post_comments for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own comments." on "StrainVerse".post_comments;
create policy "Users can delete their own comments." on "StrainVerse".post_comments for delete using (auth.uid() = user_id);


-- STRAINVERSE FEATURE TABLES --

-- Strains Table
create table if not exists "StrainVerse".strains (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  type text not null, -- 'Sativa', 'Indica', 'Hybrid', 'Exotic'
  description text,
  thc_min int,
  thc_max int,
  cbd_min int,
  cbd_max int,
  effects jsonb default '[]'::jsonb,
  flavors jsonb default '[]'::jsonb,
  genetics text,
  created_at timestamptz default now()
);
alter table "StrainVerse".strains enable row level security;
drop policy if exists "Everyone can view strains" on "StrainVerse".strains;
create policy "Everyone can view strains" on "StrainVerse".strains for select using (true);


-- Strain Photos Table
create table if not exists "StrainVerse".strain_photos (
  id uuid default gen_random_uuid() primary key,
  strain_id uuid references "StrainVerse".strains(id) on delete cascade not null,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  image_url text not null,
  created_at timestamptz default now()
);
alter table "StrainVerse".strain_photos add column if not exists form text not null default 'FLOWER';
alter table "StrainVerse".strain_photos add column if not exists brand text;
alter table "StrainVerse".strain_photos enable row level security;
drop policy if exists "Everyone can view strain photos" on "StrainVerse".strain_photos;
create policy "Everyone can view strain photos" on "StrainVerse".strain_photos for select using (true);
drop policy if exists "Users can upload their own photos" on "StrainVerse".strain_photos;
create policy "Users can upload their own photos" on "StrainVerse".strain_photos for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own photos" on "StrainVerse".strain_photos;
create policy "Users can delete their own photos" on "StrainVerse".strain_photos for delete using (auth.uid() = user_id);


-- Strain Reviews Table
create table if not exists "StrainVerse".strain_reviews (
  id uuid default gen_random_uuid() primary key,
  strain_id uuid references "StrainVerse".strains(id) on delete cascade not null,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  rating int not null check (rating >= 1 and rating <= 5),
  text text,
  created_at timestamptz default now()
);
alter table "StrainVerse".strain_reviews add column if not exists form text not null default 'FLOWER';
alter table "StrainVerse".strain_reviews enable row level security;
drop policy if exists "Everyone can view strain reviews" on "StrainVerse".strain_reviews;
create policy "Everyone can view strain reviews" on "StrainVerse".strain_reviews for select using (true);
drop policy if exists "Users can create their own reviews" on "StrainVerse".strain_reviews;
create policy "Users can create their own reviews" on "StrainVerse".strain_reviews for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update/delete their own reviews" on "StrainVerse".strain_reviews;
create policy "Users can update/delete their own reviews" on "StrainVerse".strain_reviews for all using (auth.uid() = user_id);

-- Add unique constraint to prevent spam reviews
alter table "StrainVerse".strain_reviews drop constraint if exists user_strain_form_unique;
alter table "StrainVerse".strain_reviews add constraint user_strain_form_unique unique (user_id, strain_id, form);


-- Strain Chat Messages Table
create table if not exists "StrainVerse".strain_chat_messages (
  id uuid default gen_random_uuid() primary key,
  strain_id uuid references "StrainVerse".strains(id) on delete cascade not null,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamptz default now()
);
alter table "StrainVerse".strain_chat_messages add column if not exists form text not null default 'FLOWER';
alter table "StrainVerse".strain_chat_messages enable row level security;
drop policy if exists "Everyone can view strain chat messages" on "StrainVerse".strain_chat_messages;
create policy "Everyone can view strain chat messages" on "StrainVerse".strain_chat_messages for select using (true);
drop policy if exists "Users can send chat messages" on "StrainVerse".strain_chat_messages;
create policy "Users can send chat messages" on "StrainVerse".strain_chat_messages for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own chat messages" on "StrainVerse".strain_chat_messages;
create policy "Users can delete their own chat messages" on "StrainVerse".strain_chat_messages for delete using (auth.uid() = user_id);

-- Strain User Log Table
create table if not exists "StrainVerse".user_strain_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  strain_id uuid references "StrainVerse".strains(id) on delete cascade not null,
  type text not null, -- 'SMOKED' or 'DABBED'
  created_at timestamptz default now(),
  unique(user_id, strain_id, type)
);
alter table "StrainVerse".user_strain_log enable row level security;
drop policy if exists "Users can manage their own strain logs." on "StrainVerse".user_strain_log;
create policy "Users can manage their own strain logs." on "StrainVerse".user_strain_log for all using (auth.uid() = user_id);


-- Seed Strains Table (idempotent insert)
insert into "StrainVerse".strains (name, type, description, effects, flavors, genetics) values
('Blue Dream', 'Hybrid', 'A potent cross between Blueberry and Haze, Blue Dream balances full-body relaxation with gentle cerebral invigoration.', '["creative", "energetic", "happy", "relaxed"]', '["berry", "sweet", "earthy"]', 'Blueberry x Haze'),
('Sour Diesel', 'Sativa', 'A fast-acting strain delivering energizing, dreamy cerebral effects that have pushed Sour Diesel to its legendary status.', '["energetic", "creative", "happy", "uplifted"]', '["diesel", "citrus", "earthy"]', 'Chemdawg x Super Skunk'),
('OG Kush', 'Hybrid', 'A legendary strain with a complex aroma of fuel, skunk, and spice. OG Kush delivers a mixed head and body high.', '["relaxed", "happy", "euphoric"]', '["earthy", "pine", "woody"]', 'Unknown'),
('Granddaddy Purple', 'Indica', 'A famous indica cross of Mendo Purps, Skunk, and Afghanistan. This California staple inherits a complex grape and berry aroma.', '["sleepy", "relaxed", "hungry"]', '["grape", "berry", "sweet"]', 'Mendo Purps x Skunk x Afghanistan'),
('Pineapple Express', 'Hybrid', 'A sativa-dominant hybrid that provides a long-lasting energetic buzz perfect for productive afternoons and creative escapes.', '["energetic", "uplifted", "creative"]', '["pineapple", "sweet", "tropical"]', 'Trainwreck x Hawaiian'),
('White Widow', 'Hybrid', 'A balanced hybrid first bred in the Netherlands. It is known for a powerful burst of euphoria and energy that stimulates conversation.', '["happy", "energetic", "creative"]', '["earthy", "woody", "spicy/herbal"]', 'Brazilian Sativa x South Indian Indica'),
('Jack Herer', 'Sativa', 'A sativa-dominant strain that was created in the Netherlands in the mid-1990s, where it was later distributed by Dutch pharmacies as a recognized medical-grade strain.', '["happy", "uplifted", "energetic"]', '["pine", "earthy", "woody"]', 'Haze x Northern Lights #5 x Shiva Skunk'),
('Northern Lights', 'Indica', 'A pure indica cherished for its resinous buds, fast flowering, and resilience during growth. It has a sweet, spicy aroma.', '["sleepy", "relaxed", "happy"]', '["spicy/herbal", "earthy", "sweet"]', 'Afghani x Thai'),
('GSC', 'Hybrid', 'Formerly known as Girl Scout Cookies, GSC is an OG Kush and Durban Poison hybrid cross whose reputation grew too large to stay within the borders of its California homeland.', '["happy", "relaxed", "euphoric"]', '["sweet", "earthy", "pungent"]', 'OG Kush x Durban Poison')
on conflict (name) do nothing;

-- Stories Table
create table if not exists "StrainVerse".stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  image_url text not null,
  strain_name text,
  high_level int,
  created_at timestamptz default now() not null
);
alter table "StrainVerse".stories enable row level security;
drop policy if exists "Users can see all stories" on "StrainVerse".stories;
create policy "Users can see all stories" on "StrainVerse".stories for select using (true);
drop policy if exists "Users can create stories" on "StrainVerse".stories;
create policy "Users can create stories" on "StrainVerse".stories for insert with check (auth.uid() = user_id);

-- Relationships Table (for Friends/Family)
create table if not exists "StrainVerse".relationships (
  user_1_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  user_2_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  type text not null, -- 'FRIEND' or 'FAMILY'
  status text not null, -- 'PENDING' or 'ACCEPTED'
  primary key (user_1_id, user_2_id)
);
alter table "StrainVerse".relationships enable row level security;
drop policy if exists "Users can see their own relationships" on "StrainVerse".relationships;
create policy "Users can see their own relationships" on "StrainVerse".relationships for select using (auth.uid() = user_1_id or auth.uid() = user_2_id);
drop policy if exists "Users can create relationships" on "StrainVerse".relationships;
create policy "Users can create relationships" on "StrainVerse".relationships for insert with check (auth.uid() = user_1_id);
drop policy if exists "Users can update their relationships" on "StrainVerse".relationships;
create policy "Users can update their relationships" on "StrainVerse".relationships for update using (auth.uid() = user_2_id); -- For accepting requests

-- Grow Hub Plants Table
create table if not exists "StrainVerse".grow_plants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  name text not null,
  strain text,
  stage text not null, -- 'SEEDLING', 'VEG', 'FLOWER', 'DRYING', 'CURING'
  health int default 100,
  next_watering timestamptz not null,
  created_at timestamptz default now()
);
alter table "StrainVerse".grow_plants enable row level security;
drop policy if exists "Users can manage their own plants" on "StrainVerse".grow_plants;
create policy "Users can manage their own plants" on "StrainVerse".grow_plants for all using (auth.uid() = user_id);

-- Groups Table
create table if not exists "StrainVerse".groups (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text,
  type text not null, -- 'FRIEND', 'FAMILY', 'PUBLIC', 'MATCH'
  members jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table "StrainVerse".groups enable row level security;
drop policy if exists "Authenticated users can view groups" on "StrainVerse".groups;
create policy "Authenticated users can view groups" on "StrainVerse".groups
  for select to authenticated using (true);
drop policy if exists "Users can create groups" on "StrainVerse".groups;
create policy "Users can create groups" on "StrainVerse".groups
  for insert to authenticated with check (members::jsonb ? auth.uid()::text);
drop policy if exists "Group members can update groups" on "StrainVerse".groups;
create policy "Group members can update groups" on "StrainVerse".groups
  for update to authenticated using (members::jsonb ? auth.uid()::text);

-- Messages Table (for Groups)
create table if not exists "StrainVerse".messages (
  id uuid default gen_random_uuid() primary key,
  group_id text references "StrainVerse".groups(id) on delete cascade not null,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);
alter table "StrainVerse".messages enable row level security;
drop policy if exists "Group members can view messages" on "StrainVerse".messages;
create policy "Group members can view messages" on "StrainVerse".messages
  for select to authenticated using (
    exists (
      select 1 from "StrainVerse".groups g
      where g.id = group_id
        and g.members::jsonb ? auth.uid()::text
    )
  );
drop policy if exists "Group members can send messages" on "StrainVerse".messages;
create policy "Group members can send messages" on "StrainVerse".messages
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from "StrainVerse".groups g
      where g.id = group_id
        and g.members::jsonb ? auth.uid()::text
    )
  );

-- Safety Status Table (For "Is It Hot?" feature)
create table if not exists "StrainVerse".safety_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  latitude float not null,
  longitude float not null,
  status text not null, -- 'HOT' (Cops/Bad vibes) or 'CHILL'
  created_at timestamptz default now()
);

-- Enable RLS for safety reports
alter table "StrainVerse".safety_reports enable row level security;
drop policy if exists "Everyone can view safety reports" on "StrainVerse".safety_reports;
create policy "Everyone can view safety reports" on "StrainVerse".safety_reports for select using (true);
drop policy if exists "Authenticated users can report" on "StrainVerse".safety_reports;
create policy "Authenticated users can report" on "StrainVerse".safety_reports for insert with check (auth.role() = 'authenticated');

-- Games Table (For Smoke Games Leaderboards)
create table if not exists "StrainVerse".game_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
  game_id text not null, -- 'ROLL_OFF', 'TRIVIA', etc.
  score int not null,
  created_at timestamptz default now()
);

alter table "StrainVerse".game_scores enable row level security;
drop policy if exists "Everyone view scores" on "StrainVerse".game_scores;
create policy "Everyone view scores" on "StrainVerse".game_scores for select using (true);
drop policy if exists "Users submit scores" on "StrainVerse".game_scores;
create policy "Users submit scores" on "StrainVerse".game_scores for insert with check (auth.role() = 'authenticated');

-- Reports Table (for user safety)
create table if not exists "StrainVerse".reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    reported_user_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    post_id uuid references "StrainVerse".posts(id) on delete cascade,
    category text not null,
    reason text,
    created_at timestamptz default now()
);
alter table "StrainVerse".reports enable row level security;
drop policy if exists "Users can create reports." on "StrainVerse".reports;
create policy "Users can create reports." on "StrainVerse".reports for insert with check (auth.uid() = reporter_id);


-- Blocks Table (for user safety)
create table if not exists "StrainVerse".blocks (
    blocker_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    blocked_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    created_at timestamptz default now(),
    primary key (blocker_id, blocked_id)
);
alter table "StrainVerse".blocks enable row level security;
drop policy if exists "Users can manage their own blocks." on "StrainVerse".blocks;
create policy "Users can manage their own blocks." on "StrainVerse".blocks for all using (auth.uid() = blocker_id);
-- Allow the blocked user to see rows where they are blocked (mutual hide in feeds)
drop policy if exists "Users can see blocks involving them" on "StrainVerse".blocks;
create policy "Users can see blocks involving them" on "StrainVerse".blocks
  for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);

-- MATCHIT VIBE CHECK SYSTEM --

-- Create ENUM types for interactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'StrainVerse' AND t.typname = 'matchit_interaction_type'
    ) THEN
        CREATE TYPE "StrainVerse"."matchit_interaction_type" AS ENUM ('TAP', 'SPARK');
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'StrainVerse' AND t.typname = 'matchit_interaction_status'
    ) THEN
        CREATE TYPE "StrainVerse"."matchit_interaction_status" AS ENUM ('PENDING', 'MATCHED', 'DECLINED');
    END IF;
END$$;

-- Create interactions table
create table if not exists "StrainVerse".matchit_interactions (
    id uuid primary key default gen_random_uuid(),
    post_id uuid references "StrainVerse".posts(id) on delete cascade,
    sender_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    receiver_id uuid references "StrainVerse".profiles(id) on delete cascade not null,
    message text,
    type "StrainVerse"."matchit_interaction_type" not null,
    status "StrainVerse"."matchit_interaction_status" not null default 'PENDING',
    created_at timestamptz default now(),
    unique (post_id, sender_id)
);
alter table "StrainVerse".matchit_interactions enable row level security;
drop policy if exists "Users can manage their own interactions" on "StrainVerse".matchit_interactions;
create policy "Users can manage their own interactions" on "StrainVerse".matchit_interactions for all
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Add group_id to matchit_interactions to link to the created chat
alter table "StrainVerse".matchit_interactions add column if not exists group_id text references "StrainVerse".groups(id) on delete set null;

-- Person-to-person vibes (no post required)
alter table "StrainVerse".matchit_interactions alter column post_id drop not null;
-- Unique only for active vibes so users can re-send after DECLINED
drop index if exists matchit_person_vibe_uidx;
drop index if exists "StrainVerse".matchit_person_vibe_uidx;
create unique index if not exists matchit_person_vibe_uidx
  on "StrainVerse".matchit_interactions (sender_id, receiver_id)
  where post_id is null and status in ('PENDING', 'MATCHED');

-- TABLE MODIFICATIONS --

-- Add new columns to Posts table for Strains, High Level, Soundtrack, and GroupID
alter table "StrainVerse".posts add column if not exists strain text;
alter table "StrainVerse".posts add column if not exists high_level int default 0; -- 0 to 10
alter table "StrainVerse".posts add column if not exists soundtrack text;
alter table "StrainVerse".posts add column if not exists badges jsonb default '[]'::jsonb;
alter table "StrainVerse".posts add column if not exists is_matchit boolean default false;
alter table "StrainVerse".posts add column if not exists mood text;
-- Add new columns to Posts table for MatchIt feature
alter table "StrainVerse".posts add column if not exists match_looking_for text;
alter table "StrainVerse".posts add column if not exists match_expires_at timestamptz;


-- Create ENUM type for user roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'StrainVerse' AND t.typname = 'user_role'
    ) THEN
        CREATE TYPE "StrainVerse"."user_role" AS ENUM ('User', 'Bud Tender', 'Moderator', 'Administrator', 'Manager', 'Director');
    END IF;
END$$;

-- Add city, state and badges to profiles for MatchIt feature and achievements
alter table "StrainVerse".profiles drop column if exists area_code;
alter table "StrainVerse".profiles add column if not exists city text;
alter table "StrainVerse".profiles add column if not exists state text;
alter table "StrainVerse".profiles add column if not exists badges jsonb default '[]'::jsonb;
alter table "StrainVerse".profiles add column if not exists custom_css text;
alter table "StrainVerse".profiles add column if not exists custom_js text;
alter table "StrainVerse".profiles add column if not exists date_of_birth date;
alter table "StrainVerse".profiles add column if not exists status text default 'active';
alter table "StrainVerse".profiles add column if not exists role "StrainVerse"."user_role" default 'User' not null;
alter table "StrainVerse".profiles add column if not exists show_in_matchit boolean default false;
alter table "StrainVerse".profiles add column if not exists matchit_looking_for text;


-- Add columns to groups for customization
alter table "StrainVerse".groups add column if not exists cover_image_url text;

-- Drop and recreate group_id column to fix potential type mismatch errors during setup
alter table "StrainVerse".posts drop column if exists group_id;
alter table "StrainVerse".posts add column group_id text references "StrainVerse".groups(id) on delete set null;

-- FUNCTIONS & TRIGGERS --

-- Function to increment comment count
create or replace function "StrainVerse".increment_post_comment_count()
returns trigger as $$
begin
  update "StrainVerse".posts
  set comments = comments + 1
  where id = new.post_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to increment comment count on new comment
drop trigger if exists on_comment_created on "StrainVerse".post_comments;
create trigger on_comment_created
  after insert on "StrainVerse".post_comments
  for each row execute procedure "StrainVerse".increment_post_comment_count();

-- Function to decrement comment count
create or replace function "StrainVerse".decrement_post_comment_count()
returns trigger as $$
begin
  update "StrainVerse".posts
  set comments = comments - 1
  where id = old.post_id;
  return old;
end;
$$ language plpgsql security definer;

-- Trigger to decrement comment count on comment deletion
drop trigger if exists on_comment_deleted on "StrainVerse".post_comments;
create trigger on_comment_deleted
  after delete on "StrainVerse".post_comments
  for each row execute procedure "StrainVerse".decrement_post_comment_count();

-- VIEWS --
-- IMPORTANT: This view is created after all dependent tables are defined to prevent errors.
create or replace view "StrainVerse".strains_with_stats as
select
  s.*,
  (select count(*) from "StrainVerse".strain_photos sp where sp.strain_id = s.id) as photo_count,
  (select count(*) from "StrainVerse".strain_reviews sr where sr.strain_id = s.id) as review_count,
  (select avg(sr.rating) from "StrainVerse".strain_reviews sr where sr.strain_id = s.id) as avg_rating,
  (select sp.image_url from "StrainVerse".strain_photos sp where sp.strain_id = s.id order by sp.created_at desc limit 1) as cover_image_url
from
  "StrainVerse".strains s;

grant select on "StrainVerse".strains_with_stats to anon, authenticated, service_role;


-- STORAGE --

-- Create public StrainVerse bucket (posts/, stories/, strain photos)
insert into storage.buckets (id, name, public)
values ('StrainVerse', 'StrainVerse', true)
on conflict (id) do update set public = excluded.public;

-- STORAGE POLICIES --

-- Policies for 'StrainVerse' bucket used for all uploads (posts, stories, strain photos)
-- We use a single bucket for better management
drop policy if exists "Authenticated users can upload to StrainVerse" on storage.objects;
create policy "Authenticated users can upload to StrainVerse"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'StrainVerse' );

drop policy if exists "Anyone can view files in StrainVerse" on storage.objects;
create policy "Anyone can view files in StrainVerse"
  on storage.objects for select
  using ( bucket_id = 'StrainVerse' );

drop policy if exists "Users can delete their own uploads in StrainVerse" on storage.objects;
create policy "Users can delete their own uploads in StrainVerse"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'StrainVerse' and owner = auth.uid() );

-- Cleanup: We no longer use the 'posts' bucket for new uploads. 
-- Existing policies for 'posts' can be removed if the bucket is deprecated.
drop policy if exists "Authenticated users can upload to posts" on storage.objects;
drop policy if exists "Anyone can view files in posts" on storage.objects;


-- REALTIME PUBLICATION --

-- Add new tables to publication (idempotently)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'post_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".post_reactions;
  END IF;
   IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'post_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".post_comments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'strains') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".strains;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'strain_photos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".strain_photos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'strain_reviews') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".strain_reviews;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'strain_chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".strain_chat_messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'safety_reports') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".safety_reports;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'game_scores') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".game_scores;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'stories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".stories;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'relationships') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".relationships;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'grow_plants') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".grow_plants;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'user_strain_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".user_strain_log;
  END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'reports') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".reports;
  END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'blocks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".blocks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'groups') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".groups;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'StrainVerse' AND tablename = 'matchit_interactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "StrainVerse".matchit_interactions;
  END IF;
END $$;

-- PERMISSIONS --
grant usage on schema "StrainVerse" to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema "StrainVerse" to authenticated, service_role;
grant select on all tables in schema "StrainVerse" to anon;
grant all on all sequences in schema "StrainVerse" to authenticated, service_role;
grant all on all routines in schema "StrainVerse" to authenticated, service_role;
alter default privileges in schema "StrainVerse" grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema "StrainVerse" grant select on tables to anon;

alter default privileges in schema "StrainVerse" grant select on tables to anon;

-- INDEXES (idempotent) --
create index if not exists profiles_handle_idx on "StrainVerse".profiles (handle);
create index if not exists posts_user_id_created_at_idx on "StrainVerse".posts (user_id, created_at desc);
create index if not exists posts_visibility_idx on "StrainVerse".posts (visibility);
create index if not exists posts_matchit_idx on "StrainVerse".posts (is_matchit, match_expires_at);
create index if not exists post_reactions_post_id_idx on "StrainVerse".post_reactions (post_id);
create index if not exists post_comments_post_id_idx on "StrainVerse".post_comments (post_id);
create index if not exists messages_group_id_created_at_idx on "StrainVerse".messages (group_id, created_at);
create index if not exists strain_photos_strain_id_idx on "StrainVerse".strain_photos (strain_id);
create index if not exists strain_reviews_strain_id_idx on "StrainVerse".strain_reviews (strain_id);
create index if not exists matchit_interactions_post_id_idx on "StrainVerse".matchit_interactions (post_id);
create index if not exists matchit_interactions_receiver_idx on "StrainVerse".matchit_interactions (receiver_id, status);
create index if not exists profiles_matchit_presence_idx
  on "StrainVerse".profiles (show_in_matchit)
  where show_in_matchit = true;

-- SYNC EXISTING AUTH USERS (shared Verse auth — Cookbook, SpiritsVerse, StrainVerse) --
-- Provisions StrainVerse.profiles for any auth.users row missing a profile.
DO $$
DECLARE
  r record;
  base_handle text;
  final_handle text;
  suffix text;
BEGIN
  FOR r IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN "StrainVerse".profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    base_handle := lower(
      regexp_replace(
        coalesce(
          r.raw_user_meta_data->>'handle',
          r.raw_user_meta_data->>'username',
          split_part(r.email, '@', 1),
          'user'
        ),
        '[^a-z0-9_]', '', 'g'
      )
    );
    if base_handle = '' then
      base_handle := 'user';
    end if;
    base_handle := left(base_handle, 24);
    suffix := left(replace(r.id::text, '-', ''), 8);
    final_handle := base_handle;

    if exists (select 1 from "StrainVerse".profiles where handle = final_handle and id <> r.id) then
      final_handle := left(base_handle || '_' || suffix, 24);
    end if;
    if exists (select 1 from "StrainVerse".profiles where handle = final_handle and id <> r.id) then
      final_handle := 'user_' || suffix;
    end if;

    insert into "StrainVerse".profiles (id, name, handle, avatar, bio, date_of_birth)
    values (
      r.id,
      left(
        coalesce(
          r.raw_user_meta_data->>'name',
          r.raw_user_meta_data->>'full_name',
          split_part(r.email, '@', 1),
          'User'
        ),
        80
      ),
      final_handle,
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || r.id,
      '',
      nullif(coalesce(r.raw_user_meta_data->>'date_of_birth', r.raw_user_meta_data->>'dob'), '')::date
    )
    on conflict (id) do nothing;
  END LOOP;
END $$;

-- Clear legacy preset bios from earlier builds (idempotent)
update "StrainVerse".profiles set bio = '' where bio = 'Just vibing.';

-- Register StrainVerse with the shared Verse Supabase Data API
select public.register_app_schema('StrainVerse') as registered_schemas;
select public.repair_postgrest_schemas('StrainVerse') as postgrest_schemas;
notify pgrst, 'reload schema';

-- Verify setup
select schemaname, tablename
from pg_tables
where schemaname = 'StrainVerse'
order by tablename;

select count(*) as profile_count from "StrainVerse".profiles;

-- Schema sync complete
select 'StrainVerse complete-schema.sql finished' as status, now() as completed_at;