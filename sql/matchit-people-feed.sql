-- MatchIt people feed: presence on profiles + person-to-person vibes
-- Run in Supabase SQL Editor after complete-setup.sql (safe to re-run)

alter table "StrainVerse".profiles
  add column if not exists show_in_matchit boolean default false;

alter table "StrainVerse".profiles
  add column if not exists matchit_looking_for text;

-- Allow vibes between people without a post
alter table "StrainVerse".matchit_interactions
  alter column post_id drop not null;

create unique index if not exists matchit_person_vibe_uidx
  on "StrainVerse".matchit_interactions (sender_id, receiver_id)
  where post_id is null;

create index if not exists profiles_matchit_presence_idx
  on "StrainVerse".profiles (show_in_matchit)
  where show_in_matchit = true;
