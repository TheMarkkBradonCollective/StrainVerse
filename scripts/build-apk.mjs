#!/usr/bin/env node
/**
 * Build a full (offline-capable) Android APK with Capacitor.
 * Embeds dist/ so the app runs without a live web host.
 *
 * Prerequisites: Java 17+, Android SDK (auto-installed under ~/android-sdk).
 * Usage: npm run build && node scripts/build-apk.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const versionName = pkg.version || '1.0.0';
const versionCode = String(versionName)
  .split('.')
  .map((n) => Number.parseInt(n, 10) || 0)
  .reduce((acc, n, i) => acc + n * 10 ** (4 - i * 2), 0);
const appId = 'com.themarkkbradoncollective.strainverse';
const appName = 'StrainVerse';
const sdkRoot = process.env.ANDROID_HOME || path.join(os.homedir(), 'android-sdk');
const javaHome =
  process.env.JAVA_HOME ||
  (existsSync('/usr/lib/jvm/java-21-openjdk-amd64')
    ? '/usr/lib/jvm/java-21-openjdk-amd64'
    : process.env.JAVA_HOME);
const work = path.join(os.tmpdir(), `strainverse-apk-${Date.now()}`);
const outDir = path.join(root, 'android-app');
const artifactDir = '/opt/cursor/artifacts';
const apkName = `${appName}-${versionName}.apk`;

function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ANDROID_HOME: sdkRoot,
      ANDROID_SDK_ROOT: sdkRoot,
      JAVA_HOME: javaHome || process.env.JAVA_HOME,
      PATH: [
        path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin'),
        path.join(sdkRoot, 'platform-tools'),
        javaHome ? path.join(javaHome, 'bin') : '',
        process.env.PATH,
      ]
        .filter(Boolean)
        .join(path.delimiter),
    },
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error(`Command failed (${r.status}): ${cmd} ${args.join(' ')}`);
  }
}

async function download(url, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function ensureSdk() {
  const sdkmanager = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
  if (!existsSync(sdkmanager)) {
    console.log('Installing Android cmdline-tools…');
    const zip = path.join(os.tmpdir(), 'cmdtools.zip');
    await download(
      'https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip',
      zip
    );
    const tmp = path.join(os.tmpdir(), `cmdtools-${Date.now()}`);
    await fs.mkdir(tmp, { recursive: true });
    run('unzip', ['-q', zip, '-d', tmp]);
    await fs.mkdir(path.join(sdkRoot, 'cmdline-tools', 'latest'), { recursive: true });
    // zip contains cmdline-tools/*
    const inner = path.join(tmp, 'cmdline-tools');
    for (const name of await fs.readdir(inner)) {
      await fs.cp(path.join(inner, name), path.join(sdkRoot, 'cmdline-tools', 'latest', name), {
        recursive: true,
      });
    }
  }

  const licenses = path.join(sdkRoot, 'licenses');
  await fs.mkdir(licenses, { recursive: true });
  const accepted = {
    'android-sdk-license': '24333f8a63b6825ea9c5514f83c2829b004d1fee',
    'android-sdk-preview-license': '84831b9409646161da1d391882558122bcd4d620',
  };
  for (const [name, hash] of Object.entries(accepted)) {
    await fs.writeFile(path.join(licenses, name), `\n${hash}\n`);
  }

  const packages = [
    'platform-tools',
    'platforms;android-34',
    'build-tools;34.0.0',
  ];
  const needInstall = packages.some((p) => {
    const parts = p.split(';');
    if (parts[0] === 'platform-tools') return !existsSync(path.join(sdkRoot, 'platform-tools'));
    if (parts[0] === 'platforms') return !existsSync(path.join(sdkRoot, 'platforms', parts[1]));
    if (parts[0] === 'build-tools') return !existsSync(path.join(sdkRoot, 'build-tools', parts[1]));
    return true;
  });
  if (needInstall) {
    console.log('Installing Android SDK packages…');
    run(sdkmanager, ['--sdk_root=' + sdkRoot, ...packages]);
  }
}

async function ensureKeystore(keystorePath) {
  if (existsSync(keystorePath)) return;
  console.log('Generating debug-upload keystore…');
  run('keytool', [
    '-genkeypair',
    '-v',
    '-keystore',
    keystorePath,
    '-alias',
    'strainverse',
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-storepass',
    'android',
    '-keypass',
    'android',
    '-dname',
    'CN=StrainVerse, OU=Mobile, O=TheMarkkBradonCollective, L=Unknown, ST=Unknown, C=US',
  ]);
}

async function main() {
  const dist = path.join(root, 'dist');
  if (!existsSync(path.join(dist, 'index.html'))) {
    throw new Error('dist/ missing — run `npm run build` first');
  }
  if (!javaHome || !existsSync(path.join(javaHome, 'bin', 'java'))) {
    throw new Error('JAVA_HOME not found. Install OpenJDK 17+.');
  }

  await ensureSdk();
  await fs.mkdir(outDir, { recursive: true });
  const keystore = path.join(outDir, 'strainverse-release.keystore');
  await ensureKeystore(keystore);

  await fs.rm(work, { recursive: true, force: true });
  await fs.mkdir(work, { recursive: true });
  await fs.cp(dist, path.join(work, 'dist'), { recursive: true });

  // Minimal Capacitor project (isolated from repo android/ TWA folder)
  await fs.writeFile(
    path.join(work, 'package.json'),
    JSON.stringify(
      {
        name: 'strainverse-apk',
        private: true,
        version: versionName,
        dependencies: {
          '@capacitor/android': '^7.4.2',
          '@capacitor/cli': '^7.4.2',
          '@capacitor/core': '^7.4.2',
        },
      },
      null,
      2
    )
  );
  await fs.writeFile(
    path.join(work, 'capacitor.config.json'),
    JSON.stringify(
      {
        appId,
        appName,
        webDir: 'dist',
        android: { allowMixedContent: true },
        server: { androidScheme: 'https' },
      },
      null,
      2
    )
  );

  // Icons
  const iconSrc = path.join(root, 'public', 'icons', 'icon-512.png');
  await fs.mkdir(path.join(work, 'resources'), { recursive: true });
  if (existsSync(iconSrc)) {
    await fs.copyFile(iconSrc, path.join(work, 'resources', 'icon.png'));
  }

  run('npm', ['install', '--no-fund', '--no-audit'], { cwd: work });
  run('npx', ['cap', 'add', 'android'], { cwd: work });
  run('npx', ['cap', 'sync', 'android'], { cwd: work });

  // Signing + version
  const gradleProps = path.join(work, 'android', 'gradle.properties');
  let props = await fs.readFile(gradleProps, 'utf8');
  props += `
STRAINVERSE_STORE_FILE=${keystore.replace(/\\/g, '/')}
STRAINVERSE_STORE_PASSWORD=android
STRAINVERSE_KEY_ALIAS=strainverse
STRAINVERSE_KEY_PASSWORD=android
`;
  await fs.writeFile(gradleProps, props);

  const appBuild = path.join(work, 'android', 'app', 'build.gradle');
  let gradle = await fs.readFile(appBuild, 'utf8');
  if (!gradle.includes('signingConfigs')) {
    gradle = gradle.replace(
      /android\s*\{/,
      `android {
    signingConfigs {
        release {
            storeFile file(STRAINVERSE_STORE_FILE)
            storePassword STRAINVERSE_STORE_PASSWORD
            keyAlias STRAINVERSE_KEY_ALIAS
            keyPassword STRAINVERSE_KEY_PASSWORD
        }
    }`
    );
    gradle = gradle.replace(
      /buildTypes\s*\{\s*release\s*\{/,
      `buildTypes {
        release {
            signingConfig signingConfigs.release`
    );
  }
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);
  await fs.writeFile(appBuild, gradle);

  // Copy launcher icons into mipmap if present
  if (existsSync(iconSrc)) {
    const resDir = path.join(work, 'android', 'app', 'src', 'main', 'res');
    for (const dens of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
      const dir = path.join(resDir, `mipmap-${dens}`);
      if (existsSync(dir)) {
        await fs.copyFile(iconSrc, path.join(dir, 'ic_launcher.png'));
        await fs.copyFile(iconSrc, path.join(dir, 'ic_launcher_round.png'));
        await fs.copyFile(iconSrc, path.join(dir, 'ic_launcher_foreground.png'));
      }
    }
  }

  run('./gradlew', ['assembleRelease', '--no-daemon'], {
    cwd: path.join(work, 'android'),
  });

  const built = path.join(
    work,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'release',
    'app-release.apk'
  );
  if (!existsSync(built)) {
    throw new Error(`APK not found at ${built}`);
  }

  const destApk = path.join(outDir, apkName);
  await fs.copyFile(built, destApk);
  await fs.mkdir(artifactDir, { recursive: true });
  await fs.copyFile(built, path.join(artifactDir, apkName));

  // Keep a copy of the Capacitor android project (no build junk / no keystore)
  const projectOut = path.join(outDir, 'capacitor-android');
  await fs.rm(projectOut, { recursive: true, force: true });
  await fs.cp(path.join(work, 'android'), projectOut, {
    recursive: true,
    filter: (src) => {
      const base = path.basename(src);
      if (base === 'build' || base === '.gradle' || base === 'local.properties') return false;
      if (base.endsWith('.apk') || base.endsWith('.aab') || base.endsWith('.keystore')) return false;
      return true;
    },
  });

  // Manifest for humans
  await fs.writeFile(
    path.join(outDir, 'README.md'),
    `# StrainVerse Android (full APK)

Package: \`${appId}\`
Version: ${versionName} (${versionCode})
Built with Capacitor — embeds \`dist/\` (offline-capable shell; network still needed for Supabase).

## Install
\`\`\`bash
adb install -r ${apkName}
\`\`\`

## Rebuild
\`\`\`bash
npm run build
node scripts/build-apk.mjs
\`\`\`

Signing keystore lives at \`android-app/strainverse-release.keystore\` (gitignored).
Default passwords for CI/dev builds: \`android\` / alias \`strainverse\`.
Replace before Play Store upload.
`
  );

  console.log(`\n✅ Full APK ready:`);
  console.log(`   ${destApk}`);
  console.log(`   ${path.join(artifactDir, apkName)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
