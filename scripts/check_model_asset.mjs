import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { AnimationMixer, DataTexture, Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import sharp from 'sharp';
import { assetIO } from './asset_io.mjs';
import { makeClipTable, readStride } from './clip_table.mjs';

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
const additiveBones = new Set(['neck', 'head', 'tail.1', 'ear.1.L', 'ear.1.R']);
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
const strides = new Map();
if (names.includes('walk')) {
  const stride = readStride(await readFile('blender/clips/walk.py', 'utf8'));
  assert(stride > 0, 'walk needs a positive authored stride');
  strides.set('walk', stride);
}
const table = makeClipTable(document, strides);
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
  assert.deepEqual(
    JSON.parse(await readFile('src/lib/assets/biscuit.clips.json', 'utf8')),
    table,
    'served clip table differs from the model or authored stride'
  );
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
/** @type {import('three').Skeleton | undefined} */
let pawSkeleton;
gltf.scene.traverse((node) => {
  if (!node.isSkinnedMesh) return;
  pawSkeleton ??= node.skeleton;
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
assert(pawSkeleton, 'missing skeleton for foot-contact verification');
const paws = [
  { name: 'hind.paw.L', phase: 0 },
  { name: 'front.paw.L', phase: 0.25 },
  { name: 'hind.paw.R', phase: 0.5 },
  { name: 'front.paw.R', phase: 0.75 }
].map(({ name, phase }) => {
  const index = expectedJoints.indexOf(name);
  const source = rig.bones[index];
  const inverseBind = new Matrix4().fromArray(source.inverseBind);
  return {
    name,
    phase,
    bone: pawSkeleton.bones[index],
    // Native Blender rest-space sole markers, converted into paw-local space.
    // The exported bone matrix supplies the Blender-to-glTF axis conversion.
    markers: [
      [0, 0.05],
      [0, -0.25],
      [0.13, -0.1],
      [-0.13, -0.1]
    ].map(([x, y]) =>
      new Vector3(source.head[0] + x, source.head[1] + y, 0).applyMatrix4(inverseBind)
    )
  };
});
const stationary = new Set(['idle.stand', 'idle.sit', 'sleep', 'pet', 'drink', 'eat', 'play']);
const steps = {
  sit: [
    [0.4, 0.65],
    [0.15, 0.4],
    [0.55, 0.8],
    [0.3, 0.55]
  ],
  lie: [
    [0.4, 0.65],
    [0.1, 0.55],
    [0.55, 0.8],
    [0.3, 0.75]
  ]
};
let maximumSoleDrift = 0;
const contactFindings = [];
for (const clip of gltf.animations) {
  if (clip.name !== 'walk' && !stationary.has(clip.name) && !(clip.name in steps)) continue;
  const action = mixer.clipAction(clip).play();
  const stride = table.clips.find((entry) => entry.name === clip.name)?.stride ?? 0;
  for (const [pawIndex, paw] of paws.entries()) {
    let spans = [[0, 1]];
    if (clip.name === 'walk') spans = [[paw.phase, paw.phase + 0.65]];
    else if (clip.name === 'play' && paw.name === 'front.paw.L') {
      spans = [
        [0, 55 / 90],
        [84 / 90, 1]
      ];
    } else if (clip.name in steps) {
      const [takeoff, landing] = steps[clip.name][pawIndex];
      spans = [
        [0, takeoff],
        [landing, 1]
      ];
    }
    for (const [first, last] of spans) {
      const low = paw.markers.map(() => new Vector3(Infinity, Infinity, Infinity));
      const high = paw.markers.map(() => new Vector3(-Infinity, -Infinity, -Infinity));
      let groundError = 0;
      let minimumNormalY = 1;
      const samples = Math.max(60, Math.ceil(clip.duration * 60));
      for (let sample = 0; sample <= samples; sample += 1) {
        const cycle = first + ((last - first) * sample) / samples;
        // A transition's endpoint must not wrap to its first pose. Stay just
        // inside the last instant while retaining the mixer's normal loop mode.
        const progress = clip.name === 'walk' ? cycle % 1 : Math.min(cycle, 1 - 1e-9);
        mixer.setTime(progress * clip.duration);
        gltf.scene.updateMatrixWorld(true);
        const points = paw.markers.map((marker, index) => {
          const point = marker.clone().applyMatrix4(paw.bone.matrixWorld);
          // Forward is +Z in glTF; the runtime translates by stride per cycle.
          point.z += stride * cycle;
          groundError = Math.max(groundError, Math.abs(point.y));
          low[index].min(point);
          high[index].max(point);
          return point;
        });
        const normal = points[2]
          .clone()
          .sub(points[3])
          .cross(points[0].clone().sub(points[1]))
          .normalize();
        minimumNormalY = Math.min(minimumNormalY, normal.y);
      }
      const drift = Math.max(...high.flatMap((point, index) => point.sub(low[index]).toArray()));
      // Under 0.6 mm at game scale, allowing baked sampling and compression
      // while rejecting the previous 0.07–0.13-unit sole motion.
      if (drift >= 0.003 || groundError >= 0.003 || minimumNormalY < Math.cos(Math.PI / 180)) {
        contactFindings.push(
          `${clip.name}: ${paw.name} sole drift ${drift}, ground error ${groundError}, tilt ${(Math.acos(minimumNormalY) * 180) / Math.PI} degrees`
        );
      }
      maximumSoleDrift = Math.max(maximumSoleDrift, drift);
    }
    // Include airborne intervals: a lifted paw may move, but its return must
    // not interpolate through the floor between the planted spans above.
    let minimumSoleY = Infinity;
    const samples = Math.max(100, Math.ceil(clip.duration * 60));
    for (let sample = 0; sample <= samples; sample += 1) {
      mixer.setTime(Math.min(sample / samples, 1 - 1e-9) * clip.duration);
      gltf.scene.updateMatrixWorld(true);
      minimumSoleY = Math.min(
        minimumSoleY,
        ...paw.markers.map((marker) => marker.clone().applyMatrix4(paw.bone.matrixWorld).y)
      );
    }
    if (minimumSoleY < -0.003) {
      contactFindings.push(
        `${clip.name}: ${paw.name} sole penetrates the floor at ${minimumSoleY}`
      );
    }
  }
  action.stop();
}
console.log(`check-model-asset: maximum planted-sole drift ${maximumSoleDrift} model units`);
assert.deepEqual(contactFindings, [], 'exported planted-paw contact changed');
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
