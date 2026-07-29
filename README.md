# StrainVerse

*The Universe of Strains, Powered by You.*

Cannabis-culture social network and community-sourced strain encyclopedia. Part of the shared **Verse** Supabase project (Cookbook.io, StrainVerse, SpiritsVerse).

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and set Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
   Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
3. Run the dev server:
   ```bash
   npm run dev
   ```
   App runs at http://localhost:3000

## Database setup

Run `sql/complete-schema.sql` in the Supabase SQL Editor whenever you pull updates (safe to re-run). See `SPEC.md` for full documentation.
