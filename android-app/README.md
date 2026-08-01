# StrainVerse Android (full APK)

Package: `com.themarkkbradoncollective.strainverse`
Version: 1.1.0 (10100)
Built with Capacitor — embeds `dist/` (offline-capable shell; network still needed for Supabase).

Published for MBC App Market at:
- `public/strainverse.apk` → `/strainverse.apk`
- `public/version.json` → `apk.ready: true`

## Install
```bash
adb install -r StrainVerse-1.1.0.apk
```

## Rebuild + publish
```bash
npm run build
npm run build:apk
# commit public/strainverse.apk + public/version.json, merge to main (Vercel deploys)
```

Signing keystore lives at `android-app/strainverse-release.keystore` (gitignored).
Default passwords for CI/dev builds: `android` / alias `strainverse`.
Replace before Play Store upload.
