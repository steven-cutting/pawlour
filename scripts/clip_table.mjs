import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBounds } from '@gltf-transform/core';
import { Matrix4, Vector3 } from 'three';
import { assetIO } from './asset_io.mjs';

const loops = new Set(['idle.stand', 'idle.sit', 'walk', 'sleep', 'drink', 'eat', 'play']);

/** @param {string} source */
export function readStride(source) {
  const match = /^STRIDE\s*=\s*([0-9]+(?:\.[0-9]+)?)(?:\s*(?:#.*)?)$/m.exec(source);
  return match ? Number(match[1]) : 0;
}

/**
 * Bind bounds include node transforms introduced by position quantization, and
 * exclude the non-skinned scene furniture/cameras rather than sampling an action.
 * @param {import('@gltf-transform/core').Document} document
 * @param {Map<string, number>} strides
 */
export function makeClipTable(document, strides = new Map()) {
  const root = document.getRoot();
  const meshes = root.listNodes().filter((node) => node.getSkin() && node.getMesh());
  if (meshes.length === 0) throw new Error('clip table needs skinned bind geometry');
  const bounds = meshes.map((node) => {
    const skin = node.getSkin();
    const mesh = node.getMesh();
    assert(skin && mesh);
    const inverseBind = skin.getInverseBindMatrices();
    if (!inverseBind) {
      const { min, max } = getBounds(node);
      return { minimum: min[1], maximum: max[1] };
    }
    // Quantization stores the dequantization transform in each inverse-bind
    // matrix for skins, not in the mesh node. The stationary root's world bind
    // matrix cancels its original inverse bind, recovering that transform.
    const joint = skin.listJoints()[0];
    if (!joint || joint.getName() !== 'root') {
      throw new Error('expected root first in the canonical skin');
    }
    const transform = new Matrix4()
      .fromArray(joint.getWorldMatrix())
      .multiply(new Matrix4().fromArray(inverseBind.getElement(0, [])));
    let minimum = Infinity;
    let maximum = -Infinity;
    const position = new Vector3();
    for (const primitive of mesh.listPrimitives()) {
      const accessor = primitive.getAttribute('POSITION');
      assert(accessor, 'skinned primitive needs positions');
      for (let index = 0; index < accessor.getCount(); index += 1) {
        position.fromArray(accessor.getElement(index, [])).applyMatrix4(transform);
        minimum = Math.min(minimum, position.y);
        maximum = Math.max(maximum, position.y);
      }
    }
    return { minimum, maximum };
  });
  const height =
    Math.max(...bounds.map(({ maximum }) => maximum)) -
    Math.min(...bounds.map(({ minimum }) => minimum));
  if (!Number.isFinite(height) || height <= 0) throw new Error('invalid bind height');
  const clips = root.listAnimations().map((animation) => {
    const name = animation.getName();
    if (!name) throw new Error('animation must have a name');
    const seconds = Math.max(
      ...animation.listSamplers().map((sampler) => {
        const input = sampler.getInput();
        if (!input || input.getCount() === 0) throw new Error(`${name}: empty animation sampler`);
        return input.getScalar(input.getCount() - 1);
      })
    );
    if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`${name}: invalid duration`);
    return { name, seconds, loop: loops.has(name), stride: strides.get(name) ?? 0 };
  });
  clips.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  return { clips, height };
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || process.argv.length !== 4) {
    throw new Error('usage: clip_table.mjs input.glb output.json');
  }
  const io = await assetIO();
  const document = await io.read(input);
  const strides = new Map();
  for (const animation of document.getRoot().listAnimations()) {
    const name = animation.getName();
    if (!/^[a-z]+(?:\.[a-z]+)?$/.test(name)) throw new Error(`invalid clip name: ${name}`);
    try {
      const source = await readFile(`blender/clips/${name.replaceAll('.', '_')}.py`, 'utf8');
      strides.set(name, readStride(source));
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
      strides.set(name, 0);
    }
  }
  const table = makeClipTable(document, strides);
  await writeFile(output, `${JSON.stringify(table, null, 2)}\n`);
  console.log(`clip-table: ${table.clips.length} clips; bind height ${table.height}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
