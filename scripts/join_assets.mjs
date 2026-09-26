import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { join, joinPrimitives, prune } from '@gltf-transform/functions';
import { assetIO } from './asset_io.mjs';

/**
 * glTF Transform 4.5's join deliberately skips skinning. Concatenation is safe
 * only for the same skin, parent and bind transform; JOINTS/WEIGHTS stay intact.
 * Morph meshes and all animation targets remain separate and keep their names.
 * @param {import('@gltf-transform/core').Document} document
 */
export async function joinSkinned(document) {
  const root = document.getRoot();
  const nodes = root.listNodes();
  const materials = root.listMaterials();
  const skins = root.listSkins();
  const animated = new Set(
    root
      .listAnimations()
      .flatMap((animation) => animation.listChannels().map((channel) => channel.getTargetNode()))
  );
  /** @type {Map<string, { node: import('@gltf-transform/core').Node, mesh: import('@gltf-transform/core').Mesh, primitive: import('@gltf-transform/core').Primitive }[]>} */
  const groups = new Map();
  for (const node of nodes) {
    const mesh = node.getMesh();
    const skin = node.getSkin();
    if (!skin || !mesh || animated.has(node)) continue;
    if (mesh.listPrimitives().some((primitive) => primitive.listTargets().length)) continue;
    // Do not modify shared geometry. Original named nodes and their extras stay
    // as leaves; only their renderable geometry moves to the merged mesh.
    if (nodes.filter((candidate) => candidate.getMesh() === mesh).length !== 1) continue;
    if (Object.keys(mesh.getExtras()).length) continue;
    for (const primitive of mesh.listPrimitives()) {
      assert(primitive.getAttribute('JOINTS_0') && primitive.getAttribute('WEIGHTS_0'));
      const attributes = primitive
        .listSemantics()
        .sort()
        .map((semantic) => {
          const accessor = primitive.getAttribute(semantic);
          assert(accessor);
          return [
            semantic,
            accessor.getType(),
            accessor.getComponentType(),
            accessor.getNormalized()
          ];
        });
      const parent = node.getParentNode();
      const material = primitive.getMaterial();
      const key = JSON.stringify([
        skins.indexOf(skin),
        parent ? nodes.indexOf(parent) : -1,
        node.getMatrix(),
        material ? materials.indexOf(material) : -1,
        primitive.getMode(),
        attributes,
        primitive.getIndices()?.getComponentType() ?? null
      ]);
      const group = groups.get(key) ?? [];
      group.push({ node, mesh, primitive });
      groups.set(key, group);
    }
  }
  let merged = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const destination = group[0];
    assert(destination);
    const primitive = joinPrimitives(group.map((entry) => entry.primitive));
    for (const entry of group) entry.mesh.removePrimitive(entry.primitive);
    destination.mesh.addPrimitive(primitive);
    for (const entry of group) {
      if (entry.mesh.listPrimitives().length === 0) entry.node.setMesh(null).setSkin(null);
    }
    merged += group.length - 1;
  }
  await document.transform(prune({ keepLeaves: true }));
  return merged;
}

async function main() {
  const [name, input, output] = process.argv.slice(2);
  if (
    !name ||
    !['biscuit', 'cabin'].includes(name) ||
    !input ||
    !output ||
    process.argv.length !== 5
  ) {
    throw new Error('usage: join_assets.mjs biscuit|cabin input.glb output.glb');
  }
  const io = await assetIO();
  const document = await io.read(input);
  if (name === 'biscuit') {
    console.log(`join-skinned: ${await joinSkinned(document)} primitives merged`);
  } else {
    // Unlike the CLI wrapper this does not run flatten first. Empty anchors,
    // item parents, names and their transforms are part of the cabin contract.
    await document.transform(join({ keepNamed: true, cleanup: false }));
  }
  await io.write(output, document);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
