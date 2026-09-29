import { Document, NodeIO } from '@gltf-transform/core';
import { BoxGeometry, Object3D, PlaneGeometry, Vector3 } from 'three';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * A small, uncompressed room for contract tests; never a served game asset.
 * `cameras` is the director's list (`CAMERA_NAMES`), so a preset added there
 * cannot pass the stub unplaced.
 * @param {readonly string[]} cameras
 */
export function stubCabin(cameras) {
  const document = new Document();
  const scene = document.createScene();
  const buffer = document.createBuffer();
  const material = document.createMaterial('cabin.plank').setBaseColorFactor([0.7, 0.5, 0.32, 1]);
  const glass = document
    .createMaterial('cabin.glass')
    .setAlphaMode('BLEND')
    .setBaseColorFactor([0.8, 0.9, 1, 0.35]);
  /** @param {string} name @param {number[]} position @param {Record<string, unknown>} extras */
  const node = (name, position = [0, 0, 0], extras = {}) => {
    const result = document
      .createNode(name)
      .setTranslation([position[0] ?? 0, position[1] ?? 0, position[2] ?? 0])
      .setExtras(extras);
    scene.addChild(result);
    return result;
  };
  /** @param {import('three').BufferGeometry} geometry @param {string} name */
  const shape = (geometry, name, surface = material) => {
    /** @param {import('@gltf-transform/core').TypedArray} values @param {'VEC3' | 'SCALAR'} type */
    const attribute = (values, type) =>
      document.createAccessor().setType(type).setArray(values).setBuffer(buffer);
    const position = /** @type {import('three').BufferAttribute} */ (
      geometry.getAttribute('position')
    );
    const normal = /** @type {import('three').BufferAttribute} */ (geometry.getAttribute('normal'));
    if (!geometry.index) throw new Error('Stub geometry needs indices');
    const colours = new Float32Array(position.count * 3).fill(1);
    const primitive = document
      .createPrimitive()
      .setAttribute('POSITION', attribute(new Float32Array(position.array), 'VEC3'))
      .setAttribute('NORMAL', attribute(new Float32Array(normal.array), 'VEC3'))
      .setAttribute('COLOR_0', attribute(colours, 'VEC3'))
      .setIndices(attribute(new Uint16Array(geometry.index.array), 'SCALAR'))
      .setMaterial(surface);
    return document.createMesh(name).addPrimitive(primitive);
  };
  node('floor', [0, -0.025, 0]).setMesh(shape(new BoxGeometry(5, 0.05, 4), 'floor'));
  /** @type {Record<string, [number, number, number]>} */
  const positions = {
    bed: [-0.6, 0, -1.1],
    chair: [1.7, 0, 0.2],
    water: [-2.15, 0, 0.6],
    food: [-2.15, 0, 1],
    toy: [0.6, 0, 0.5],
    jar: [0.3, 0.45, 1.7],
    lamp: [2, 0, 0.95],
    lights: [-0.85, 2.2, -1.95],
    fire: [-0.6, 0.3, -1.85],
    window: [2.5, 1.3, -0.4],
    table: [1.7, 0, -0.5],
    shelf: [-2.3, 0, -0.4]
  };
  /** @type {Record<string, import('@gltf-transform/core').Node>} */
  const items = {};
  for (const [name, position] of Object.entries(positions)) {
    const item = node(`item.${name}`, position);
    items[name] = item;
    if (name !== 'window')
      item.addChild(
        document
          .createNode(`${name}.box`)
          .setTranslation([0, 0.15, 0])
          .setMesh(shape(new BoxGeometry(0.3, 0.3, 0.3), name))
      );
  }
  for (const name of ['bed', 'chair', 'water', 'food', 'toy', 'jar', 'lamp', 'lights']) {
    const position = positions[name];
    if (!position) throw new Error(`Stub has no ${name}`);
    node(`item.${name}.approach`, [position[0], 0, position[2] + 0.4], { nav: 'nav.0' });
  }
  node('spot.bed', [-0.6, 0.06, -1.1]);
  node('spot.chair', [1.7, 0.42, 0.2]);
  for (const [index, position] of [
    [0, 0, 0],
    [1, 0, 0],
    [1, 0, -1],
    [0, 0, -1]
  ].entries()) {
    node(`nav.${index}`, position, { edges: [`nav.${(index + 1) % 4}`, `nav.${(index + 3) % 4}`] });
  }
  /** @type {Record<string, [number, number, number]>} */
  const presets = {
    hearth: [0.6, 1.4, 2.3],
    window: [-0.8, 1.3, 1.6],
    chair: [0.9, 1, 0.9],
    bowls: [0.5, 1.1, 1.3]
  };
  for (const name of cameras) {
    const position = presets[name];
    if (!position) throw new Error(`Stub has no camera ${name}`);
    const camera = new Object3D();
    camera.position.fromArray(position);
    // Object3D looks along +Z; a camera's view is -Z.
    camera.lookAt(new Vector3().copy(camera.position).multiplyScalar(2));
    node(`camera.${name}`, position, { fov: 40 }).setRotation(camera.quaternion.toArray());
  }
  for (const [name, position] of Object.entries({
    window: [2.4, 1.3, -0.4],
    fire: [-0.6, 0.45, -1.6],
    lamp: [2, 1.45, 0.95],
    'strings.0': [-1, 2.2, -1.95]
  }))
    node(`light.${name}`, position);
  node('fire.anchor', [-0.6, 0.15, -1.75]);
  node('steam.anchor', [1.7, 0.66, -0.5]);
  for (const [name, position] of Object.entries({
    'glass.window': [2.49, 1.3, -0.4],
    'glass.window.left': [-2.49, 1.5, -0.4],
    'glass.window.hearth': [1.35, 1.45, -1.99]
  })) {
    const origin = positions.window;
    const window = items.window;
    if (!origin || !window) throw new Error('Stub has no window');
    const relative = new Vector3()
      .fromArray(position)
      .sub(new Vector3().fromArray(origin))
      .toArray();
    window.addChild(
      document
        .createNode(name)
        .setTranslation(relative)
        .setExtras({ depth: 1.5 })
        .setMesh(shape(new PlaneGeometry(1, 0.9), name, glass))
    );
  }
  return document;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const output = 'ai_tmp/stub-cabin/cabin.glb';
  await mkdir(dirname(output), { recursive: true });
  // Node strips the types; a static import would need an extension the type checker refuses.
  const zones = /** @type {typeof import('../src/lib/domain/zones')} */ (
    await import(new URL('../src/lib/domain/zones.ts', import.meta.url).href)
  );
  await new NodeIO().write(output, stubCabin(zones.CAMERAS));
  console.log(output);
}
