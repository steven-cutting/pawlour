import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';

const [input, output = 'src/lib/assets/stills/idle.morning.webp'] = process.argv.slice(2);
if (!input || process.argv.length > 4) {
  throw new Error('usage: placeholder_still.mjs copied-preview.png [output.webp]');
}
const preview = sharp(input);
const { width } = await preview.metadata();
// The top centre is uninterrupted ground in the pinned standing-hero preview.
const [r, g, b] = await preview
  .clone()
  .extract({ left: Math.floor(width / 2), top: 0, width: 1, height: 1 })
  .removeAlpha()
  .raw()
  .toBuffer();
await mkdir(dirname(output), { recursive: true });
const result = await preview
  .resize(1170, 2532, { fit: 'contain', background: { r, g, b } })
  .webp({ quality: 80 })
  .toBuffer();
if (result.length > 262144) throw new Error(`placeholder exceeds 262144 bytes: ${result.length}`);
await writeFile(output, result);
console.log(`placeholder-still: ${output}; 1170 × 2532; ${result.length} bytes`);
