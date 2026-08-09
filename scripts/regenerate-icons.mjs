import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const publicDir = resolve('public');
const svg = readFileSync(resolve(publicDir, 'favicon.svg'), 'utf8');
const match = svg.match(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/);

if (!match) {
  console.error('NO_MATCH: base64 png not found in favicon.svg');
  process.exit(1);
}

const src = Buffer.from(match[1], 'base64');
console.log('source extracted:', src.length, 'bytes');

const metadata = await sharp(src).metadata();
console.log('source dimensions:', metadata.width, 'x', metadata.height);

for (const size of [144, 192, 512]) {
  const out = resolve(publicDir, `icon-${size}x${size}.png`);
  const img = await sharp(src)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();
  writeFileSync(out, img);
  console.log(`wrote ${out} (${img.length} bytes)`);
}
