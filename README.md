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
3. Run readiness refresh (PWA icons, SQL update entrypoint, version stamp, Android TWA):
   ```bash
   npm run update
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   App runs at http://localhost:3000

## Database setup

After schema changes, run `sql/update.sql` (or `sql/complete-schema.sql`) in the Supabase SQL Editor (safe to re-run). Optional strain data: `sql/seed-strains.sql` and `sql/seed-strains-extended.sql`.

Cursor slash command **`/update`** runs the same readiness workflow (see `.cursor/commands/update.md`). See `SPEC.md` for full documentation.
