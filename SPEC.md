# StrainVerse — Full Application Specification

> **Tagline:** *"The Universe of Strains, Powered by You."*

StrainVerse is a cannabis-culture social network that combines a community-sourced strain encyclopedia with social feeds, location-based discovery, group chat, and customizable user profiles. It is part of the shared **Verse** Supabase project (alongside Cookbook.io and SpiritsVerse).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Navigation & Layout](#3-navigation--layout)
4. [Feature Pillars](#4-feature-pillars)
5. [Authentication & Onboarding](#5-authentication--onboarding)
6. [Data Models](#6-data-models)
7. [API Layer](#7-api-layer)
8. [Database Schema](#8-database-schema)
9. [Storage](#9-storage)
10. [Design System](#10-design-system)
11. [Implementation Status](#11-implementation-status)
12. [Environment & Setup](#12-environment--setup)
13. [Project Structure](#13-project-structure)

---

## 1. Product Overview

### What it is

A **stoner-first social network** centered on:

- **Strain discovery** — searchable encyclopedia with photos, reviews, and live chat per strain
- **Social feeds** — global timeline (HerbHub), ephemeral stories, reactions, and comments
- **Local matching** — MatchIt for finding nearby smoking buddies (21+ age-gated)
- **Group sessions** — SocialSesh for public, friends-only, family, and match-created chats
- **Personal profiles** — stats, badges, and tried strains

### Target audience

Cannabis enthusiasts who want strain knowledge, community conversation, and local connection in a soft botanical, premium UI.

### Platform permissions

- **Geolocation** — used to update user coordinates and support location-aware features (MatchIt filtering, distance on posts)

---

## 2. Technical Architecture

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Styling** | Tailwind CSS (CDN), CSS custom properties, Lucide React icons |
| **Backend** | Supabase — PostgreSQL, Auth, Realtime, Storage |
| **Fonts** | Outfit (body), Syne (headings), Fira Code (code editors) |

### Supabase configuration

- **Schema:** `StrainVerse` (not `public`)
- **Client:** `services/supabaseClient.ts` — `createClient` with `db.schema: 'StrainVerse'`
- **Shared project URL:** `https://vxahlxhrmypxxkrudqbd.supabase.co`
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### App entry flow

```
index.html → index.tsx → App.tsx
  ├── sessionChecked? → Loading screen
  ├── !user?          → LandingPage → AuthScreen
  └── user            → Main shell (Sidebar + Header + View + RightSidebar + BottomNav)
```

---

## 3. Navigation & Layout

### The Five Pillars (`AppView` enum)

| View | Label | Icon | Age gate |
|------|-------|------|----------|
| `STRAINVERSE` | StrainVerse | Sprout | No |
| `HERBHUB` | HerbHub | Globe | No |
| `MATCHIT` | MatchIt | Flame | **21+** |
| `SOCIALSESH` | SocialSesh | Users | No |
| `PROFILE` | My Stash | User | No |

MatchIt is hidden from sidebar and bottom nav unless `userAge >= 21`.

### Shell layout

```
┌─────────────┬──────────────────────────────┬─────────────┐
│   Sidebar   │  Header (title + back btn)   │ RightSidebar│
│   (lg+)     ├──────────────────────────────┤  (xl+)      │
│             │  Active view content         │  Stoner     │
│             │                              │  Wisdom +   │
│             │                              │  Fav Strains│
├─────────────┴──────────────────────────────┴─────────────┤
│              BottomNavBar (mobile, lg:hidden)             │
└──────────────────────────────────────────────────────────┘
```

### Sub-navigation (drill-down)

- **Strain profile** — `selectedStrain` set from StrainVerse directory; back clears selection
- **Group chat** — `activeGroup` set from SocialSesh or MatchIt; back clears selection

### Responsive behavior

- **Desktop (lg+):** Sidebar + main + right sidebar
- **Mobile:** Bottom nav only; sidebar hidden

---

## 4. Feature Pillars

### 4.1 StrainVerse — Strain Directory

**Component:** `StrainVerseDirectory.tsx` → `StrainProfilePage.tsx`

#### Directory

- **Search** — by strain name, flavor, or effect (client-side filter)
- **Tabs** — All, Sativa, Indica, Hybrid
- **Most Reviewed** — top 5 strains by `review_count` (hidden until at least one review exists)
- **Strain cards** — cover image, type badge, avg rating, photo count, smoked/dabbed indicators

#### Strain profile

- **Form switcher** — `FLOWER` vs `CONCENTRATE` (separate photos, reviews, chat per form). Concentrate mode uses a gold accent theme; the profile is a single continuous scroll.
- **Stats** — THC/CBD ranges, genetics, effects, flavors, description
- **User logging** — toggle **Smoked** / **Dabbed** (persisted in `user_strain_log`)
- **Tabs:**
  - **Photos** — upload with optional brand tag; lightbox viewer
  - **Reviews** — 1–5 stars + text; one review per user/strain/form (upsert)
  - **Live Chat** — optimistic send; messages scoped by strain + form

#### Data sources

- `strains_with_stats` view (photo count, review count, avg rating, cover image)
- Seed data: 9 strains (Blue Dream, Sour Diesel, OG Kush, etc.)

---

### 4.2 HerbHub — The Highline Feed

**Component:** `HighlineFeed.tsx`

#### Feed

- **Visibility:** `HIGHLINE` posts only (`is_matchit = false`)
- **Stories row** — ephemeral image stories at top; add via `CreateStoryModal`
- **Posts** — text, optional image, mood emoji, strain, high level (0–10), soundtrack
- **Reactions** — THUMBS_UP, LIKE, FIRE, DISLIKE (toggle; optimistic UI)
- **Comments** — lazy-loaded per post; count incremented via DB trigger

#### Create post (`CreatePostModal`)

- Image upload, mood picker, optional metadata (strain, high level)
- Posts to `HIGHLINE` visibility

#### Stories (`CreateStoryModal`)

- Image + optional strain name + high level (0–10)
- Stored in `stories` table; uploaded to `StrainVerse/stories/` bucket path

---

### 4.3 MatchIt — Location-Based Discovery

**Component:** `MatchIt.tsx`

**Requirements:** User must be **21+** and have **city + state** set in profile.

#### Tabs

1. **Find Vibe** — feed of MatchIt posts in user's city/state
2. **My Matches** — `MATCH` type groups where user is a member

#### Match cards

- Expiring posts (`match_expires_at`) with live countdown
- Metadata: looking-for intent, strain, mood, image
- **Send Vibe** modal — TAP (casual) or SPARK (high interest)
- **Incoming vibes** — post owner can Match or Decline
- **Mutual SPARK** — auto-creates private match group chat

#### Safety

- **Report** — categories: Suspicious activity, Underage, Spam, Harassment, Drugs for sale, Fake/catfishing
- **Block user** — hides their posts from MatchIt feed

#### Post creation

- Duration: 30 min, 1 hr, 3 hr, 24 hr
- Looking-for options: Match to smoke, Sesh later today, Looking for new friends, Looking for people to try strain with
- Creates post with `is_matchit = true`, `visibility = LOCAL_LOUD`

---

### 4.4 SocialSesh — Groups & Chat

**Components:** `SocialSeshDirectory.tsx`, `SocialSeshView.tsx`, `CreateSeshModal.tsx`

#### Directory tabs

- **My Seshes** — `FRIEND` and `FAMILY` groups
- **Public** — `PUBLIC` groups

#### Group types

| Type | Description |
|------|-------------|
| `PUBLIC` | Open to all |
| `FRIEND` | Friends-only sesh |
| `FAMILY` | Family-only sesh |
| `MATCH` | Private 1-on-1 from MatchIt match |

#### Chat view

- Message history from `messages` table
- Send text messages
- **Voice/Video UI** — simulated active call banner (Join / Leave); not a real WebRTC integration

#### Create sesh

- Name, description, type (Friends / Family / Public)
- Creator added to `members` JSON array

---

### 4.5 My Stash — Profile

**Component:** `ProfileCanvas.tsx`

#### Header

- Avatar, name, handle, bio
- Online indicator (decorative pulse)
- **Edit Profile** → `ProfileSettingsModal`

#### Stats bar

- Posts count, Friends count, Strains tried count

#### Badges

- Gamification display (empty until earned)

#### Profile tabs

| Tab | Status |
|-----|--------|
| Posts | ✅ User's posts with reactions |
| Tried | ✅ Grid of strains from `user_strain_log` |
| Collections | 🔲 Placeholder — "coming soon" |
| Activity | 🔲 Placeholder — "coming soon" |

#### Sidebar (About Me)

- Location, smoking style, favorite strains

#### Profile settings fields

- Display name, bio, date of birth (immutable once set), city, state, smoking style, favorite strains

---

## 5. Authentication & Onboarding

### Landing page

- Marketing hero + feature cards
- Embedded `AuthScreen` (sign in / sign up toggle)

### Sign up

- Fields: name, handle, date of birth, email, password
- Supabase `auth.signUp` with metadata: `name`, `handle`, `date_of_birth`, `site: 'StrainVerse'`
- Auto-creates `profiles` row via `api.createProfile`
- Avatar: DiceBear avataaars from user ID

### Sign in

- Email + password → `auth.signInWithPassword`

### Session

- `supabase.auth.onAuthStateChange` + `checkSession` on mount
- Profile recovery if auth user exists but profile row missing

### Age calculation

- `calculateAge(dateOfBirth)` — used for MatchIt age gate (21+)

---

## 6. Data Models

### Core enums & types (`types.ts`)

<details>
<summary><strong>AppView</strong></summary>

`STRAINVERSE` | `HERBHUB` | `MATCHIT` | `SOCIALSESH` | `PROFILE`
</details>

<details>
<summary><strong>PostVisibility</strong></summary>

`HIGHLINE` | `LOCAL_LOUD` | `FRIENDS` | `FAMILY` | `FRIENDS_AND_FAMILY` | `FRIEND_GROUP` | `FAMILY_GROUP` | `MEET_MATCH` | `ONLY_ME`
</details>

<details>
<summary><strong>ReactionType</strong></summary>

`LIKE` | `FIRE` | `DISLIKE` | `THUMBS_UP` | `HIGH_AF` | `WEAK` | `FELT_THIS` | `BRUH` | `MELTING` | `DROOLING` | `ZANY` | `LAUGHING` | `MIND_BLOWN` | `RELIEF`

*UI currently uses:* THUMBS_UP, LIKE, FIRE, DISLIKE
</details>

<details>
<summary><strong>UserRole</strong></summary>

`User` | `Bud Tender` | `Moderator` | `Administrator` | `Manager` | `Director`
</details>

### Key interfaces

| Interface | Purpose |
|-----------|---------|
| `User` | Profile: identity, location, prefs, badges |
| `Post` | Feed item with reactions, metadata, MatchIt fields |
| `Strain` | Encyclopedia entry + aggregated stats + user log flags |
| `Group` | Chat room with members and messages |
| `Story` | Ephemeral image story |
| `MatchItInteraction` | TAP/SPARK between users on a post |

---

## 7. API Layer

All data access goes through `services/supabaseClient.ts` exports: `supabase`, `auth`, `api`.

### Auth (`auth`)

| Method | Description |
|--------|-------------|
| `signIn(email, password)` | Password login |
| `signUp(email, password, name, handle, dob)` | Register + create profile |
| `signOut()` | End session |
| `getSession()` | Current session |

### Profiles & user

| Method | Description |
|--------|-------------|
| `createProfile(userId, name, handle, dob?)` | Insert profile row |
| `getCurrentUser()` | Session user + profile mapping (camelCase) |
| `updateProfile(userId, updates)` | Name, bio, city, state, fav strains, smoking style, DOB |
| `updateUserLocation(userId, lat, lng, radius)` | GPS coordinates + radius |

### Social feed

| Method | Description |
|--------|-------------|
| `getPosts(viewType, user?, groupId?)` | HIGHLINE, MATCHIT, FRIENDS, GROUP feeds |
| `getPostsForUser(userId)` | User's own posts |
| `createPost(...)` | New post with optional image, geo, MatchIt meta |
| `toggleReaction(postId, userId, type)` | Add/change/remove reaction |
| `getCommentsForPost(postId)` | Comment thread |
| `addComment(postId, userId, content)` | New comment |
| `reportPost(...)` | Safety report |
| `blockUser(blockerId, blockedId)` | Block user |
| `getFriendIds(userId)` | Accepted FRIEND relationships |
| `getBlockedUserIds(userId)` | Block list |

### Stories & media

| Method | Description |
|--------|-------------|
| `uploadImage(file)` | Post image → `StrainVerse/posts/` |
| `uploadStoryImage(file)` | Story image → `StrainVerse/stories/` |
| `uploadStrainImage(file)` | Strain photo → `StrainVerse/` root |
| `createStory(userId, imageUrl, strainName?, highLevel?)` | Insert story |
| `getStories()` | Recent 20 stories with author info |

### Groups & chat

| Method | Description |
|--------|-------------|
| `getAllGroups()` | All groups (no message preload) |
| `createGroup(name, desc, type, userId)` | New group; creator in members |
| `getGroupDetails(groupId)` | Group + messages with author names |
| `sendMessage(groupId, userId, text)` | Insert message |

### MatchIt

| Method | Description |
|--------|-------------|
| `sendVibe(postId, senderId, receiverId, message, type)` | TAP or SPARK; mutual SPARK → match group |
| `respondToVibe(interactionId, senderId, receiverId, response)` | MATCHED or DECLINED |
| `createMatchChat(user1Id, user2Id)` | Private MATCH group |
| `getInteractionsForPosts(postIds, userId)` | Interactions for feed cards |

### StrainVerse

| Method | Description |
|--------|-------------|
| `getStrains()` | All strains from `strains_with_stats` + user logs |
| `getStrainById(id)` | Single strain + user log flags |
| `getTriedStrains(userId)` | Strains user has logged |
| `getStrainPhotos/Reviews/ChatMessages(strainId, form)` | Per-form content |
| `addStrainReview(...)` | Upsert review |
| `addStrainPhoto(...)` | Upload metadata row |
| `toggleStrainLog(userId, strainId, type)` | SMOKED / DABBED toggle |
| `sendStrainChatMessage(...)` | Strain room message |

### Implemented but not wired to UI

| Method | Notes |
|--------|-------|
| `getLeaderboard()` | Game scores — no UI component |
| `getGrowPlants()` / `addGrowPlant()` | Grow hub — no UI component |
| `reportAreaSafety()` / `getAreaSafety()` | "Is It Hot?" — no UI component |

---

## 8. Database Schema

**Canonical SQL:** `sql/complete-setup.sql` (run in Supabase SQL Editor)

Schema namespace: `"StrainVerse"`

### Core tables

| Table | Purpose |
|-------|---------|
| `profiles` | User public data, location, badges, role, status |
| `posts` | Feed content, visibility, geo, strain meta, MatchIt fields |
| `post_reactions` | One reaction per user per post |
| `post_comments` | Thread comments; triggers update `posts.comments` count |
| `stories` | Ephemeral image stories |
| `relationships` | FRIEND/FAMILY with PENDING/ACCEPTED (no UI yet) |
| `blocks` | User blocks |
| `reports` | Post/user safety reports |

### StrainVerse tables

| Table | Purpose |
|-------|---------|
| `strains` | Strain encyclopedia (seeded) |
| `strain_photos` | User uploads per strain + form |
| `strain_reviews` | Ratings per strain + form |
| `strain_chat_messages` | Live chat per strain + form |
| `user_strain_log` | SMOKED / DABBED tracking |
| `strains_with_stats` | **View** — aggregates photos, reviews, ratings |

### Social & MatchIt

| Table | Purpose |
|-------|---------|
| `groups` | Chat rooms; `members` as JSONB array |
| `messages` | Group chat messages |
| `matchit_interactions` | TAP/SPARK with status and optional `group_id` |

### Other tables (schema only)

| Table | Purpose |
|-------|---------|
| `grow_plants` | Home grow tracking |
| `safety_reports` | Area HOT/CHILL reports |
| `game_scores` | Leaderboard scores |

### Enums (PostgreSQL)

- `matchit_interaction_type`: TAP, SPARK
- `matchit_interaction_status`: PENDING, MATCHED, DECLINED
- `user_role`: User, Bud Tender, Moderator, Administrator, Manager, Director

### RLS

Row Level Security enabled on all user-facing tables. Typical patterns:

- **Select:** public or own-row access
- **Insert/Update/Delete:** `auth.uid()` matches owner

### Realtime

Tables published to `supabase_realtime` for live updates (profiles, posts, reactions, comments, strains, messages, matchit_interactions, etc.)

---

## 9. Storage

**Bucket:** `StrainVerse`

| Path prefix | Use |
|-------------|-----|
| `/` (root) | Strain gallery photos |
| `posts/` | HerbHub / MatchIt post images |
| `stories/` | Story images |

**Policies:** Authenticated upload; public read.

---

## 10. Design System

### Color palette (CSS variables)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-main` | `#F3F8F4` | Soft mint page background |
| `--bg-card` | `#FFFFFF` | Cards, modals, elevated surfaces |
| `--bg-input` | `#E7F0EA` | Inputs, soft wells |
| `--bg-hover` | `#DDE8E1` | Hover states |
| `--text-main` | `#12261C` | Primary text |
| `--text-secondary` | `#3A5648` | Secondary text |
| `--text-muted` | `#6B8578` | Muted text |
| `--border` | `#D5E4DA` | Default borders |
| `--border-strong` | `#A9C4B5` | Strong borders |
| `--forest-green` / `--accent` | `#1B5C3A` | Primary CTAs, active nav |
| `--accent-hover` | `#147848` | Button hover |
| `--leaf-mint` | `#7BCFA0` | Soft accent wash |
| `--sativa-sky` | `#C8E6F5` | Sativa card tint |
| `--indica-blush` | `#F3D9C8` | Indica card tint |
| `--hybrid-mist` | `#D8F0E4` | Hybrid card tint |
| `--sunset-hybrid` | `#E07A5F` | Highlights, alerts |
| `--indica-purple` | `#6B5B8A` | Strain / badge accent |

### Visual language

- **Verdant Soft** — mint-tinted canvas with soft botanical atmosphere (radial washes + subtle leaf watermark)
- **Pastel strain cards** — type-colored surfaces (sky / blush / mist) with rounded product imagery
- **Pill CTAs** — forest-green primary buttons, often with a trailing icon circle
- **Floating mobile nav** — rounded bottom bar with soft shadow
- **Large radius** — ~24–28px on cards and panels
- **Motion** — `fadeInUp`, soft ambient drift, subtle float on hero accents

### Typography

- Headings: **Syne** (600–800)
- Body: **Outfit** (300–800)
- Code editors: **Fira Code**

### Profile CSS class contract

Profile layout uses: `.ys-profile-root`, `.ys-header`, `.ys-avatar`, `.ys-bio`, `.ys-card`, `.ys-layout-grid`, `.ys-sidebar`, `.ys-feed`

---

## 11. Implementation Status

### ✅ Fully implemented & wired

- Auth (sign up, sign in, sign out, session)
- StrainVerse directory + strain profiles (photos, reviews, chat, logging)
- HerbHub feed (posts, reactions, comments, stories)
- MatchIt (feed, vibes, matches, report, block, age/location gates)
- SocialSesh (directory, create group, chat, voice UI simulation)
- My Stash profile (stats, posts, tried strains, settings)
- Image uploads (posts, stories, strain photos)
- Geolocation update on login

### 🔲 Schema/API exists, no UI

- Friend/family relationships (`relationships` table)
- Grow hub (`grow_plants`)
- Safety area reports (`safety_reports`)
- Game leaderboards (`game_scores`)
- `LocalLoud.tsx` component (local radius feed — not mounted in `App.tsx`)

### 🔲 Placeholder UI only

- Profile **Collections** tab
- Profile **Activity** tab
- LocalLoud sub-tabs: Trends, Hotspots, Events

### Known gaps

- Group chat does not subscribe to Supabase Realtime (refresh on send only)
- Strain chat does not use Realtime subscription
- No friend request / accept UI despite `relationships` table
- MatchIt post visibility uses `LOCAL_LOUD` but feed filters on `is_matchit` flag

---

## 12. Environment & Setup

### Prerequisites

- Node.js
- Supabase project with `StrainVerse` schema (run `sql/complete-setup.sql`)
- `StrainVerse` storage bucket with policies

### Local development

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL
# Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev    # http://localhost:3000
```

### Build

```bash
npm run build
npm run preview
```

### Env variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key |

---

## 13. Project Structure

```
/workspace
├── App.tsx                    # Root app, routing, global state
├── index.tsx                  # React mount
├── index.html                 # HTML shell, Tailwind CDN, theme CSS
├── types.ts                   # All TypeScript interfaces & enums
├── SPEC.md                    # This document
├── details.txt                # Legacy feature notes
├── sql/
│   └── complete-setup.sql     # Canonical DB schema (shared Verse Supabase)
├── services/
│   └── supabaseClient.ts      # Supabase client, auth, full API
└── components/
    ├── AuthScreen.tsx         # Login / signup form
    ├── LandingPage.tsx        # Marketing + auth shell
    ├── Sidebar.tsx            # Desktop nav
    ├── StrainVerseDirectory.tsx
    ├── StrainProfilePage.tsx
    ├── HighlineFeed.tsx       # HerbHub
    ├── MatchIt.tsx
    ├── SocialSeshDirectory.tsx
    ├── SocialSeshView.tsx
    ├── CreateSeshModal.tsx
    ├── CreatePostModal.tsx
    ├── CreateStoryModal.tsx
    ├── VibeTapModal.tsx
    ├── ProfileCanvas.tsx      # My Stash
    ├── ProfileSettingsModal.tsx
    ├── common.tsx               # SkeletonPost, StrainStories
    ├── Logo.tsx
    └── LocalLoud.tsx            # Unused local feed component
```

---

## Appendix: User Journeys

### New user

1. Land on marketing page → Sign up (name, handle, DOB, email, password)
2. Profile created → Main app loads on StrainVerse
3. Browser requests geolocation → coordinates saved
4. Explore strains, post on HerbHub, set city/state in profile for MatchIt

### MatchIt match flow

1. User 21+ with city/state posts MatchIt card (expires in N hours)
2. Another local user sends SPARK via Vibe modal
3. If mutual SPARK → match group auto-created → success modal → open chat
4. If TAP only → post owner sees incoming vibe → Match or Decline
5. Matched users appear under **My Matches** tab

### Strain enthusiast flow

1. Browse StrainVerse → open strain → switch Flower/Concentrate
2. Mark Smoked/Dabbed → upload photo with brand → leave review
3. Chat in strain live room
4. Strain appears in profile **Tried** tab

---

*Document generated from codebase state on `main` branch. Last updated: July 2026.*
