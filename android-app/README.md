# StrainVerse Android (full APK)

Package: `com.themarkkbradoncollective.strainverse`
Version: 1.1.0 (10100)
Built with Capacitor — embeds `dist/` (offline-capable shell; network still needed for Supabase).

## Install
```bash
adb install -r StrainVerse-1.1.0.apk
```

## Rebuild
```bash
npm run build
node scripts/build-apk.mjs
```

Signing keystore lives at `android-app/strainverse-release.keystore` (gitignored).
Default passwords for CI/dev builds: `android` / alias `strainverse`.
Replace before Play Store upload.
