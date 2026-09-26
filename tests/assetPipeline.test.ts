import { Document } from '@gltf-transform/core';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeClipTable, readStride } from '../scripts/clip_table.mjs';
import { joinSkinned } from '../scripts/join_assets.mjs';

function fixture() {
  const document = new Document();
  const buffer = document.createBuffer();
  const scene = document.createScene();
  const joint = document.createNode('root');
  const skin = document.createSkin().addJoint(joint);
  scene.addChild(joint);
  const material = document.createMaterial('coat');
  function part(name: string) {
    const position = document
      .createAccessor()
      .setType('VEC3')
      .setBuffer(buffer)
      .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 3, 0]));
    const joints = document
      .createAccessor()
      .setType('VEC4')
      .setBuffer(buffer)
      .setArray(new Uint16Array(12));
    const weights = document
      .createAccessor()
      .setType('VEC4')
      .setBuffer(buffer)
      .setArray(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]));
    const primitive = document
      .createPrimitive()
      .setMaterial(material)
      .setAttribute('POSITION', position)
      .setAttribute('JOINTS_0', joints)
      .setAttribute('WEIGHTS_0', weights);
    const mesh = document.createMesh(name).addPrimitive(primitive);
    const node = document.createNode(name).setMesh(mesh).setSkin(skin);
    scene.addChild(node);
    return { node, mesh, primitive };
  }
  function animate(name: string, seconds: number) {
    const input = document
      .createAccessor()
      .setBuffer(buffer)
      .setArray(new Float32Array([0, seconds]));
    const output = document
      .createAccessor()
      .setType('VEC3')
      .setBuffer(buffer)
      .setArray(new Float32Array([0, 0, 0, 0, 1, 0]));
    const sampler = document.createAnimationSampler().setInput(input).setOutput(output);
    const channel = document
      .createAnimationChannel()
      .setSampler(sampler)
      .setTargetNode(joint)
      .setTargetPath('translation');
    document.createAnimation(name).addSampler(sampler).addChannel(channel);
  }
  return { document, buffer, skin, part, animate };
}

describe('asset pipeline contracts', () => {
  it('refuses invalid targets and missing raw inputs before running tools', () => {
    const directory = mkdtempSync(join(tmpdir(), 'pawlour-assets-'));
    const script = resolve('scripts/build_assets.sh');
    try {
      for (const args of [[], ['unknown'], ['biscuit', 'cabin'], ['cabin']]) {
        const result = spawnSync('sh', [script, ...args], { cwd: directory, encoding: 'utf8' });
        expect(result.status).toBe(2);
        expect(result.stderr).toMatch(/usage:|unknown asset:|missing blender\/out\/cabin-raw.glb/);
      }
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  it('reads stride as a literal without executing Python or matching comments', () => {
    expect(readStride('# STRIDE = 9\nSTRIDE = 0.45 # model units\n')).toBe(0.45);
    expect(readStride('STRIDE = danger()\n')).toBe(0);
    expect(readStride('OTHER_STRIDE = 8\n')).toBe(0);
  });

  it('measures transformed bind geometry and records sorted clip metadata', () => {
    const { document, part, animate } = fixture();
    part('coat').node.setScale([2, 2, 2]);
    animate('walk', 1);
    animate('pet', 2);
    animate('idle.stand', 4);
    expect(makeClipTable(document, new Map([['walk', 0.45]]))).toEqual({
      height: 6,
      clips: [
        { name: 'idle.stand', seconds: 4, loop: true, stride: 0 },
        { name: 'pet', seconds: 2, loop: false, stride: 0 },
        { name: 'walk', seconds: 1, loop: true, stride: 0.45 }
      ]
    });
  });

  it('joins same-skin geometry while preserving weights and separate sweater targets', async () => {
    const { document, part } = fixture();
    const first = part('first');
    part('second');
    const sweater = part('sweater');
    const target = document
      .createPrimitiveTarget()
      .setAttribute('POSITION', sweater.primitive.getAttribute('POSITION'));
    sweater.primitive.addTarget(target);
    sweater.mesh.setExtras({ targetNames: ['Belly'] });
    const height = makeClipTable(document).height;
    expect(await joinSkinned(document)).toBe(1);
    expect(document.getRoot().listMeshes()).toHaveLength(2);
    const joined = first.mesh.listPrimitives()[0];
    expect(joined?.getAttribute('POSITION')?.getCount()).toBe(6);
    expect(Array.from(joined?.getAttribute('WEIGHTS_0')?.getArray() ?? [])).toEqual([
      1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0
    ]);
    expect(sweater.primitive.listTargets()).toHaveLength(1);
    expect(sweater.mesh.getExtras()).toEqual({ targetNames: ['Belly'] });
    expect(makeClipTable(document).height).toBe(height);
  });

  it('recovers bind height when quantization lives in inverse-bind matrices', () => {
    const { document, part, skin, buffer } = fixture();
    part('coat');
    skin.setInverseBindMatrices(
      document
        .createAccessor()
        .setType('MAT4')
        .setBuffer(buffer)
        .setArray(new Float32Array([2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 1, 1, 1]))
    );
    expect(makeClipTable(document).height).toBe(6);
  });

  it('keeps a different bind transform and an animated mesh separate', async () => {
    const { document, part, buffer } = fixture();
    part('first');
    part('offset').node.setTranslation([0, 0, 1]);
    const animated = part('animated');
    const input = document
      .createAccessor()
      .setBuffer(buffer)
      .setArray(new Float32Array([0, 1]));
    const output = document
      .createAccessor()
      .setType('VEC3')
      .setBuffer(buffer)
      .setArray(new Float32Array(6));
    const sampler = document.createAnimationSampler().setInput(input).setOutput(output);
    const channel = document
      .createAnimationChannel()
      .setSampler(sampler)
      .setTargetNode(animated.node)
      .setTargetPath('translation');
    document.createAnimation('test').addSampler(sampler).addChannel(channel);
    expect(await joinSkinned(document)).toBe(0);
    expect(document.getRoot().listMeshes()).toHaveLength(3);
  });
});
