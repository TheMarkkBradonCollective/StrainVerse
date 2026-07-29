import { writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const masterPng = resolve(publicDir, 'logo-master.png');
const masterSvg = resolve(publicDir, 'logo.svg');
const source = existsSync(masterPng) ? masterPng : masterSvg;

const sizes = [
  { name: 'pwa-512.png', size: 512 },
  { name: 'pwa-192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
];

for (const { name, size } of sizes) {
  await sharp(source).resize(size, size).png().toFile(resolve(publicDir, name));
}

if (existsSync(masterPng)) {
  writeFileSync(
    masterSvg,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="StrainVerse"><image width="512" height="512" href="/logo-master.png"/></svg>`
  );
}

execSync('python3 scripts/generate-favicon-ico.py', { stdio: 'inherit' });

console.log(`Generated StrainVerse icons in public/ from ${source.split('/').pop()}.`);
