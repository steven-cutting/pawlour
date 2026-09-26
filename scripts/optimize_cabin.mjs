import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, quantize, reorder } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { assetIO } from './asset_io.mjs';

/** @param {import('@gltf-transform/core').Document} document */
export async function dedupCabin(document) {
  // Vertex colours distinguish surfaces whose PBR factors are otherwise equal.
  // Their authored cabin.<surface> material names are part of the scene contract.
  await document.transform(dedup({ keepUniqueNames: true }));
}

/** @param {import('@gltf-transform/core').Document} document */
export async function compressCabin(document) {
  await MeshoptEncoder.ready;
  // Position quantization applies a dequantization offset/scale to mesh nodes.
  // glass.window must remain a mesh at its authored origin for weather placement.
  // Keep float positions, while quantizing other attributes and compressing all
  // buffers. The meshopt() convenience transform overrides its pattern option.
  await document.transform(
    reorder({ encoder: MeshoptEncoder, target: 'size' }),
    quantize({ pattern: /^(?!POSITION$)/ })
  );
  document
    .createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
}

async function main() {
  const [stage, input, output] = process.argv.slice(2);
  if (
    !stage ||
    !['dedup', 'meshopt'].includes(stage) ||
    !input ||
    !output ||
    process.argv.length !== 5
  ) {
    throw new Error('usage: optimize_cabin.mjs dedup|meshopt input.glb output.glb');
  }
  const io = await assetIO();
  const document = await io.read(input);
  await (stage === 'dedup' ? dedupCabin(document) : compressCabin(document));
  await io.write(output, document);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
