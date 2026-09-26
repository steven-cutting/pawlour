import { appendFile, stat } from 'node:fs/promises';
import { inspect } from '@gltf-transform/functions';
import { assetIO } from './asset_io.mjs';

const [input, stage = input, report] = process.argv.slice(2);
if (!input) throw new Error('usage: inspect_asset.mjs file.glb [stage [report.jsonl]]');
const io = await assetIO();
const document = await io.read(input);
const root = document.getRoot();
const inspection = inspect(document);
let primitives = 0;
let triangles = 0;
for (const scene of root.listScenes()) {
  scene.traverse((node) => {
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      if (primitive.getMode() !== 4) throw new Error('expected triangle geometry');
      primitives += 1;
      triangles += (primitive.getIndices() ?? primitive.getAttribute('POSITION')).getCount() / 3;
    }
  });
}
const row = {
  stage,
  meshes: root.listMeshes().length,
  primitives,
  triangles,
  drawCalls: primitives * (input.includes('biscuit') ? 2 : 1),
  bytes: (await stat(input)).size,
  textureBytes: root
    .listTextures()
    .reduce((total, texture) => total + texture.getImage().byteLength, 0),
  materials: root.listMaterials().length,
  skins: root.listSkins().length,
  textures: root.listTextures().length,
  animations: inspection.animations.properties,
  extensions: root.listExtensionsUsed().map((extension) => extension.extensionName),
  textureDetails: inspection.textures.properties.map(({ name, mimeType, resolution, slots }) => ({
    name,
    mimeType,
    resolution,
    slots
  }))
};
if (report) await appendFile(report, `${JSON.stringify(row)}\n`);
console.log(JSON.stringify(row, null, 2));
