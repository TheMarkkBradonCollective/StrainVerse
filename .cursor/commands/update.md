---
description: Refresh StrainVerse app readiness (version, PWA, SQL, APK/TWA)
---

# /update — StrainVerse readiness refresh

Run this whenever shipping UI or data changes so web PWA and Android install stay aligned.

## Do this

1. Bump `package.json` `version` (patch unless the user asked for minor/major).
2. Run `npm run update` (regenerates PWA icons, syncs `sql/update.sql`, writes `public/version.json`, refreshes `android/twa-manifest.json`).
3. Confirm the loading screen still shows `StrainVerse vX.Y.Z` via `utils/appVersion.ts`.
4. Confirm MatchIt Nearby is Grid / List / Map; Map shows self only until someone shares location in a Match chat (6 duration options).
5. Confirm PWA auto-update still registers (`PwaUpdateRefresh` + `registerType: 'autoUpdate'`).
6. If schema or API changed, remind the user to run `sql/update.sql` (or `sql/complete-schema.sql`) in the Supabase SQL editor.
7. Commit, push, and open/update a PR targeting `main`.

## Do not

- Do not drop or wipe production data.
- Do not invent APK signing secrets; leave `assetlinks.json` fingerprint as a placeholder unless the user provides one.
