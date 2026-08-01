#!/usr/bin/env node
/**
 * StrainVerse /update
 * Regenerates PWA icons, syncs SQL update entrypoint, refreshes version.json
 * and Android TWA metadata so web + installable APK stay aligned.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pkgPath = resolve(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const version = pkg.version || '1.1.0';
const now = new Date().toISOString();

console.log(`\nStrainVerse /update — v${version}\n`);

// 1) PWA icons (also used by Android TWA / APK wrapper)
console.log('→ Regenerating PWA icons…');
const icons = spawnSync(process.execPath, [resolve(root, 'scripts/generate-icons.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (icons.status !== 0) {
  console.error('Icon generation failed.');
  process.exit(icons.status ?? 1);
}

// 2) Keep sql/update.sql identical to complete-schema.sql (idempotent refresh)
const completeSchema = resolve(root, 'sql/complete-schema.sql');
const updateSql = resolve(root, 'sql/update.sql');
if (!existsSync(completeSchema)) {
  console.error('Missing sql/complete-schema.sql');
  process.exit(1);
}
copyFileSync(completeSchema, updateSql);
console.log('→ Synced sql/update.sql from sql/complete-schema.sql');

// Also keep legacy root pointer current
writeFileSync(
  resolve(root, 'supabase_schema.sql'),
  `-- StrainVerse schema entrypoint (synced by npm run update)\n` +
    `-- Prefer: sql/complete-schema.sql or sql/update.sql in the Supabase SQL editor.\n` +
    `-- Last synced: ${now} (app v${version})\n`
);
console.log('→ Updated supabase_schema.sql pointer');

// 3) Public version stamp (loading screen / SW cache bust checks / MBC App Market)
const slug = 'strainverse';
const apkPath = resolve(root, `public/${slug}.apk`);
const versionCode =
  String(version)
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0)
    .reduce((acc, n, i) => acc + n * 10 ** (4 - i * 2), 0) || 110;

let apkBlock = {
  ready: false,
  packageId: 'com.themarkkbradoncollective.strainverse',
  name: 'StrainVerse',
  themeColor: '#0a0a0a',
  backgroundColor: '#0a0a0a',
  icon: '/pwa-512.png',
};

if (existsSync(apkPath)) {
  const buf = readFileSync(apkPath);
  const sha256 = createHash('sha256').update(buf).digest('hex');
  const fileSize = statSync(apkPath).size;
  const versionedName = `${slug}-v${version}.apk`;
  const versionedPath = resolve(root, 'public', versionedName);
  if (!existsSync(versionedPath)) {
    copyFileSync(apkPath, versionedPath);
    console.log(`→ Mirrored ${versionedName}`);
  }
  // Preserve release notes / archives from prior version.json when present
  let prevApk = {};
  try {
    prevApk = JSON.parse(readFileSync(resolve(root, 'public/version.json'), 'utf-8')).apk || {};
  } catch {
    /* first write */
  }
  apkBlock = {
    ready: true,
    packageId: 'com.themarkkbradoncollective.strainverse',
    name: 'StrainVerse',
    label: `StrainVerse v${version}`,
    version,
    versionCode,
    url: `/${slug}.apk`,
    downloadName: `StrainVerse-v${version}.apk`,
    versionedUrl: `/${versionedName}`,
    fileSize,
    sha256,
    releaseNotes:
      prevApk.releaseNotes ||
      `StrainVerse v${version} Android APK — full Capacitor build with embedded web shell.`,
    themeColor: '#0a0a0a',
    backgroundColor: '#0a0a0a',
    icon: '/pwa-512.png',
    archives: Array.isArray(prevApk.archives) ? prevApk.archives : [],
  };
  console.log(`→ APK ready for MBC App Market (${fileSize} bytes, sha256 ${sha256.slice(0, 12)}…)`);
} else {
  console.log('→ No public/strainverse.apk yet — apk.ready stays false');
}

const versionPayload = {
  name: 'StrainVerse',
  version,
  updatedAt: now,
  pwa: true,
  apk: apkBlock,
};
writeFileSync(resolve(root, 'public/version.json'), JSON.stringify(versionPayload, null, 2) + '\n');
console.log('→ Wrote public/version.json');

// 4) Android TWA / Bubblewrap manifest (APK readiness)
const androidDir = resolve(root, 'android');
mkdirSync(androidDir, { recursive: true });
const twa = {
  packageId: 'com.themarkkbradoncollective.strainverse',
  name: 'StrainVerse',
  launcherName: 'StrainVerse',
  display: 'standalone',
  themeColor: '#0a0a0a',
  navigationColor: '#0a0a0a',
  navigationColorDark: '#0a0a0a',
  backgroundColor: '#0a0a0a',
  enableNotifications: false,
  startUrl: '/',
  iconUrl: '../public/pwa-512.png',
  maskableIconUrl: '../public/pwa-512-maskable.png',
  splashScreenFadeOutDuration: 300,
  signingKey: {
    path: './android.keystore',
    alias: 'strainverse',
  },
  appVersionName: version,
  appVersionCode: Number(String(version).replace(/\D/g, '') || '110') || 110,
  shortcuts: [],
  generatorApp: 'strainverse-update',
  webManifestUrl: '/manifest.webmanifest',
  fallbackType: 'customtabs',
  features: {},
};
writeFileSync(resolve(androidDir, 'twa-manifest.json'), JSON.stringify(twa, null, 2) + '\n');
console.log('→ Updated android/twa-manifest.json');

// Digital Asset Links placeholder for Play / TWA verification
mkdirSync(resolve(root, 'public/.well-known'), { recursive: true });
const assetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.themarkkbradoncollective.strainverse',
      sha256_cert_fingerprints: ['REPLACE_WITH_UPLOAD_KEY_SHA256'],
    },
  },
];
writeFileSync(
  resolve(root, 'public/.well-known/assetlinks.json'),
  JSON.stringify(assetLinks, null, 2) + '\n'
);
console.log('→ Refreshed public/.well-known/assetlinks.json');

console.log(`\n✓ Update complete — StrainVerse v${version}`);
console.log('  Next: run sql/update.sql in Supabase if schema changed, then npm run build.\n');
