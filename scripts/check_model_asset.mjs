import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { AnimationMixer, DataTexture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import sharp from 'sharp';
import { assetIO } from './asset_io.mjs';
import { makeClipTable } from './clip_table.mjs';

const input = process.argv[2] ?? 'src/lib/assets/biscuit.glb';
const io = await assetIO();
const document = await io.read(input);
const root = document.getRoot();
const rig = JSON.parse(await readFile('blender/model/rig.json', 'utf8'));
const expectedJoints = rig.bones.map((bone) => bone.name);
assert.equal(expectedJoints.length, 33);
assert.equal(root.listSkins().length, 1);
assert.deepEqual(
  root
    .listSkins()[0]
    .listJoints()
    .map((node) => node.getName()),
  expectedJoints
);

const sceneNodes = new Set();
for (const scene of root.listScenes()) scene.traverse((node) => sceneNodes.add(node));
const sweaterNames = ['Shoulder.L', 'Shoulder.R', 'Hip.L', 'Hip.R', 'Belly'];
let morphPrimitives = 0;
let primitives = 0;
for (const node of sceneNodes) {
  for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
    primitives += 1;
    assert(node.getSkin(), `${node.getName()}: lost skin`);
    assert(primitive.getAttribute('JOINTS_0'), `${node.getName()}: missing joints`);
    assert(primitive.getAttribute('WEIGHTS_0'), `${node.getName()}: missing weights`);
    if (primitive.listTargets().length) {
      morphPrimitives += 1;
      assert.equal(primitive.listTargets().length, 5);
      assert.deepEqual(node.getMesh().getExtras().targetNames, sweaterNames);
    }
  }
}
assert(morphPrimitives > 0, 'sweater morph targets disappeared');
const names = root.listAnimations().map((animation) => animation.getName());
assert(names.includes('idle.stand'));
assert.equal(new Set(names).size, names.length);
const expectedClips = [
  'drink',
  'eat',
  'idle.sit',
  'idle.stand',
  'lie',
  'pet',
  'play',
  'sit',
  'sleep',
  'walk'
];
if (names.length !== 1) assert.deepEqual([...names].sort(), expectedClips);
const loops = new Set(['idle.stand', 'idle.sit', 'walk', 'sleep', 'drink', 'eat', 'play']);
const additiveBones = new Set(['pelvis', 'spine', 'tail.1', 'ear.1.L', 'ear.1.R']);
for (const animation of root.listAnimations()) {
  assert(animation.listChannels().length > 0);
  assert(
    animation.listChannels().some(
      (channel) =>
        channel.getTargetPath() === 'weights' &&
        channel
          .getTargetNode()
          ?.getMesh()
          ?.listPrimitives()
          .some((primitive) => primitive.listTargets().length === 5)
    ),
    `${animation.getName()}: sweater weights channel disappeared`
  );
  for (const channel of animation.listChannels()) {
    assert(
      sceneNodes.has(channel.getTargetNode()),
      `${animation.getName()}: detached animation target`
    );
    const output = channel.getSampler().getOutput();
    const width = channel.getTargetPath() === 'weights' ? 5 : output.getElementSize();
    const values = output.getArray();
    const first = Array.from(values.slice(0, width));
    const last = Array.from(values.slice(-width));
    if (channel.getTargetNode().getName() === 'root' && channel.getTargetPath() === 'translation') {
      assert(
        Array.from(values).every(
          (value, index) => index % width === 1 || Math.abs(value - first[index % width]) < 0.0001
        ),
        `${animation.getName()}: root moves outside its vertical axis`
      );
    }
    if (loops.has(animation.getName())) {
      assert(
        first.every((value, index) => Math.abs(value - last[index]) < 0.0001),
        `${animation.getName()}: ${channel.getTargetNode().getName()} ${channel.getTargetPath()} loop seam`
      );
    }
    if (
      animation.getName() === 'pet' &&
      channel.getTargetPath() !== 'weights' &&
      !additiveBones.has(channel.getTargetNode().getName())
    ) {
      assert(
        Array.from(values).every((value, index) => Math.abs(value - first[index % width]) < 0.0001),
        `pet: non-additive bone ${channel.getTargetNode().getName()} moves`
      );
    }
  }
}
const table = makeClipTable(document);
const expectedSeconds = {
  drink: 2,
  eat: 2,
  'idle.sit': 4,
  'idle.stand': 4,
  lie: 1.2,
  pet: 2,
  play: 3,
  sit: 1,
  sleep: 6,
  walk: 1
};
for (const clip of table.clips) {
  assert(
    Math.abs(clip.seconds - expectedSeconds[clip.name]) <= 1 / 30 + 0.000001,
    `${clip.name}: duration ${clip.seconds} differs by more than one frame`
  );
}
assert(Math.abs(table.height - 3.113) < 0.01, `bind height ${table.height} differs from 3.113`);
const served = input === 'src/lib/assets/biscuit.glb';
if (served) {
  assert((await stat(input)).size <= 6291456, 'model byte budget exceeded');
  assert(primitives * 2 <= 60, `model needs ${primitives * 2} draw calls including outlines`);
  const extensions = root.listExtensionsUsed().map((extension) => extension.extensionName);
  assert(extensions.includes('EXT_meshopt_compression'));
  assert(extensions.includes('EXT_texture_webp'));
  for (const material of root.listMaterials()) {
    assert.equal(material.getNormalTexture(), null);
    const occlusion = material.getOcclusionTexture();
    if (occlusion) assert(occlusion.getSize().every((dimension) => dimension <= 512));
  }
  for (const texture of root.listTextures()) {
    assert(texture.getSize().every((dimension) => dimension <= 1024));
  }
}

// Exercise the real three.js GLTFLoader and AnimationMixer in Node. Texture IO is
// injected with a loader plugin backed by sharp; no browser globals are stubbed.
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
loader.register((parser) => ({
  name: 'EXT_texture_webp',
  async loadTexture(index) {
    const definition = parser.json.textures[index];
    const source = definition.extensions?.EXT_texture_webp?.source ?? definition.source;
    const image = parser.json.images[source];
    assert.equal(typeof image.bufferView, 'number', 'expected an embedded image');
    const bytes = await parser.getDependency('bufferView', image.bufferView);
    const { data, info } = await sharp(Buffer.from(bytes))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const texture = new DataTexture(new Uint8Array(data), info.width, info.height);
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
  }
}));
const bytes = await readFile(input);
const gltf = await loader.parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  ''
);
assert.deepEqual(gltf.animations.map((animation) => animation.name).sort(), names.sort());
let skinned = 0;
let threeMorphs = 0;
gltf.scene.traverse((node) => {
  if (!node.isSkinnedMesh) return;
  skinned += 1;
  assert.equal(node.skeleton.bones.length, 33);
  assert(node.geometry.getAttribute('skinIndex'));
  assert(node.geometry.getAttribute('skinWeight'));
  if (node.morphTargetInfluences?.length) {
    threeMorphs += 1;
    assert.equal(node.morphTargetInfluences.length, 5);
    assert.deepEqual(Object.keys(node.morphTargetDictionary), sweaterNames);
  }
});
assert(skinned > 0 && threeMorphs > 0);
const mixer = new AnimationMixer(gltf.scene);
const bones = [];
const morphMeshes = [];
gltf.scene.traverse((node) => {
  if (node.isBone) bones.push(node);
  if (node.morphTargetInfluences?.length) morphMeshes.push(node);
});
const snapshotBones = () =>
  bones.flatMap((bone) => [...bone.position.toArray(), ...bone.quaternion.toArray()]);
for (const clip of gltf.animations) {
  const action = mixer.clipAction(clip).play();
  mixer.setTime(0);
  const initial = snapshotBones();
  let moved = false;
  let maximumCorrective = 0;
  for (const progress of [0, 0.25, 0.5, 0.75]) {
    mixer.setTime(clip.duration * progress);
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((node) => assert(node.matrixWorld.elements.every(Number.isFinite)));
    moved ||= snapshotBones().some((value, index) => Math.abs(value - initial[index]) > 0.0001);
    maximumCorrective = Math.max(
      maximumCorrective,
      ...morphMeshes.flatMap((node) => node.morphTargetInfluences)
    );
  }
  assert(moved, `${clip.name}: mixer did not move any bones`);
  if (['idle.sit', 'lie', 'sit', 'sleep'].includes(clip.name)) {
    assert(maximumCorrective > 0.001, `${clip.name}: mixer did not apply sweater correctives`);
  }
  action.stop();
}
mixer.uncacheRoot(gltf.scene);
gltf.scene.traverse((node) => {
  node.geometry?.dispose();
  for (const material of node.material ? [node.material].flat() : []) {
    for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
    material.dispose();
  }
});
console.log(
  `check-model-asset: ${skinned} skinned primitives, 33 ordered joints, five morphs, ${names.length} clips; three.js load and playback passed`
);
