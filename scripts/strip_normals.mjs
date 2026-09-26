import { prune } from '@gltf-transform/functions';
import { assetIO } from './asset_io.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output || process.argv.length !== 4) {
  throw new Error('usage: strip_normals.mjs input.glb output.glb');
}
const io = await assetIO();
const document = await io.read(input);
const root = document.getRoot();
const imagesBefore = root.listTextures().length;
let removed = 0;
for (const material of root.listMaterials()) {
  if (material.getNormalTexture()) {
    material.setNormalTexture(null);
    removed += 1;
  }
}
// Cabin anchors are meaningful even when they have no mesh or children.
await document.transform(prune({ keepLeaves: true }));
await io.write(output, document);
console.log(
  `strip-normals: ${removed} materials, ${imagesBefore - root.listTextures().length} images removed`
);
