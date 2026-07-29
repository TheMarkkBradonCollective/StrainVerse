import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const masterPng = resolve(publicDir, 'logo-master.png');
const masterSvg = resolve(publicDir, 'logo.svg');
const source = existsSync(masterPng) ? masterPng : masterSvg;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

function isBackgroundPixel(r, g, b) {
  const m = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (m < 28) return true;
  if (m < 45 && m - mn < 18) return true;
  if (mn > 235 && m - mn < 25) return true;
  return false;
}

/** Flood-fill near-black / near-white background from entire image border. */
async function stripBackground(imagePath) {
  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const pixels = Uint8Array.from(data);
  const bg = new Uint8Array(w * h);
  const stack = [];

  for (let x = 0; x < w; x++) {
    stack.push(x * channels, ((h - 1) * w + x) * channels);
  }
  for (let y = 0; y < h; y++) {
    stack.push(y * w * channels, (y * w + (w - 1)) * channels);
  }

  while (stack.length) {
    const idx = stack.pop();
    const px = idx / channels;
    if (px < 0 || px >= w * h || bg[px]) continue;
    const i = px * channels;
    const pr = pixels[i];
    const pg = pixels[i + 1];
    const pb = pixels[i + 2];
    if (!isBackgroundPixel(pr, pg, pb)) continue;
    bg[px] = 1;
    const x = px % w;
    const y = Math.floor(px / w);
    if (x > 0) stack.push((px - 1) * channels);
    if (x < w - 1) stack.push((px + 1) * channels);
    if (y > 0) stack.push((px - w) * channels);
    if (y < h - 1) stack.push((px + w) * channels);
  }

  let removed = 0;
  for (let px = 0; px < w * h; px++) {
    if (bg[px]) {
      pixels[px * channels + 3] = 0;
      removed++;
    }
  }

  if (removed === 0) return 0;

  await sharp(pixels, { raw: { width: w, height: h, channels } }).png().toFile(imagePath);
  console.log(`Stripped background from ${imagePath} (${removed} pixels)`);
  return removed;
}

/** Drop leftover black fringe from anti-aliased export edges. */
async function defringeDarkAlpha(imagePath) {
  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const pixels = Uint8Array.from(data);
  let fixed = 0;

  for (let px = 0; px < w * h; px++) {
    const i = px * channels;
    const a = pixels[i + 3];
    if (a === 0) continue;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const m = Math.max(r, g, b);
    if (m < 35 && a < 255) {
      pixels[i + 3] = 0;
      fixed++;
    } else if (m < 20 && a === 255 && isBackgroundPixel(r, g, b)) {
      pixels[i + 3] = 0;
      fixed++;
    }
  }

  if (fixed === 0) return;

  await sharp(pixels, { raw: { width: w, height: h, channels } }).png().toFile(imagePath);
  console.log(`Defringed ${fixed} dark edge pixels on ${imagePath}`);
}

async function masterNeedsBackgroundStrip() {
  const { data, info } = await sharp(masterPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  for (let x = 0; x < w; x++) {
    const top = x * channels;
    const bottom = ((h - 1) * w + x) * channels;
    if (isBackgroundPixel(data[top], data[top + 1], data[top + 2])) return true;
    if (isBackgroundPixel(data[bottom], data[bottom + 1], data[bottom + 2])) return true;
  }
  for (let y = 0; y < h; y++) {
    const left = y * w * channels;
    const right = (y * w + (w - 1)) * channels;
    if (isBackgroundPixel(data[left], data[left + 1], data[left + 2])) return true;
    if (isBackgroundPixel(data[right], data[right + 1], data[right + 2])) return true;
  }
  return false;
}

if (existsSync(masterPng)) {
  if (await masterNeedsBackgroundStrip()) {
    await stripBackground(masterPng);
  }
  await defringeDarkAlpha(masterPng);
}

// Hands reach the corners — never infer bg from corner alpha; icons stay transparent.
const resizeBackground = TRANSPARENT;
const canvasBackground = TRANSPARENT;

const iconSizes = [
  { name: 'pwa-512.png', size: 512 },
  { name: 'pwa-192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
];

for (const { name, size } of iconSizes) {
  await sharp(source)
    .ensureAlpha()
    .resize(size, size, { fit: 'contain', background: resizeBackground })
    .png()
    .toFile(resolve(publicDir, name));
}

const maskableSize = 512;
const maskableArt = Math.round(maskableSize * 0.8);
await sharp(source)
  .ensureAlpha()
  .resize(maskableArt, maskableArt, { fit: 'contain', background: resizeBackground })
  .extend({
    top: Math.floor((maskableSize - maskableArt) / 2),
    bottom: Math.ceil((maskableSize - maskableArt) / 2),
    left: Math.floor((maskableSize - maskableArt) / 2),
    right: Math.ceil((maskableSize - maskableArt) / 2),
    background: canvasBackground,
  })
  .png()
  .toFile(resolve(publicDir, 'pwa-512-maskable.png'));

const ogWidth = 1200;
const ogHeight = 630;
const ogLogo = Math.min(ogWidth, ogHeight) - 80;
const ogPadded = await sharp(source)
  .ensureAlpha()
  .resize(ogLogo, ogLogo, { fit: 'contain', background: resizeBackground })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 4,
    background: TRANSPARENT,
  },
})
  .composite([{ input: ogPadded, gravity: 'centre' }])
  .png()
  .toFile(resolve(publicDir, 'og-image.png'));

if (existsSync(masterPng)) {
  writeFileSync(
    masterSvg,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="StrainVerse"><image width="512" height="512" href="/logo-master.png"/></svg>`
  );
}

const faviconBuffers = await Promise.all(
  [16, 32, 48].map((size) =>
    sharp(resolve(publicDir, `favicon-${size}.png`)).png().toBuffer()
  )
);
const ico = await toIco(faviconBuffers);
writeFileSync(resolve(publicDir, 'favicon.ico'), ico);

console.log(`Generated StrainVerse assets in public/ from ${source.split('/').pop()} (transparent, no black matte).`);
