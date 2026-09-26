import { Mesh, Object3D } from 'three';

export const ITEM_NAMES = [
  'bed',
  'chair',
  'water',
  'food',
  'toy',
  'jar',
  'lamp',
  'lights',
  'fire',
  'window',
  'table',
  'shelf'
] as const;
export const APPROACH_NAMES = [
  'bed',
  'chair',
  'water',
  'food',
  'toy',
  'jar',
  'lamp',
  'lights'
] as const;
export const CAMERA_NAMES = ['hearth', 'window', 'chair'] as const;
export type CabinItem = (typeof ITEM_NAMES)[number];
export type CabinCamera = (typeof CAMERA_NAMES)[number];
export interface Waypoint {
  node: Object3D;
  edges: readonly string[];
}
export interface Cabin {
  root: Object3D;
  items: Record<CabinItem, Object3D>;
  approaches: Record<(typeof APPROACH_NAMES)[number], Object3D>;
  spots: Record<'bed' | 'chair', Object3D>;
  nav: Map<string, Waypoint>;
  cameras: Record<CabinCamera, { node: Object3D; fov: number }>;
  lights: { window: Object3D; fire: Object3D; lamp: Object3D; strings: Object3D[] };
  glass: Mesh[];
  fireAnchor: Object3D;
  steamAnchor: Object3D;
}

/** GLTFLoader sanitizes dots for animation bindings, retaining the asset name here. */
export function assetName(node: Object3D): string {
  const name: unknown = node.userData.name;
  return typeof name === 'string' ? name : node.name;
}

/** Avoid the any generic defaults in three's instanceof narrowing. */
export function isMesh(node: Object3D): node is Mesh {
  return node instanceof Mesh;
}

function record<K extends string, V>(keys: readonly K[], value: (key: K) => V): Record<K, V> {
  return Object.fromEntries(keys.map((key) => [key, value(key)])) as Record<K, V>;
}

function numeric(node: Object3D, key: string): number {
  const value: unknown = node.userData[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`cabin.glb: ${assetName(node)} needs numeric ${key}`);
  }
  return value;
}

export function requireCabin(root: Object3D): Cabin {
  const nodes = new Map<string, Object3D>();
  root.traverse((node) => {
    nodes.set(assetName(node), node);
  });
  const required = [
    ...ITEM_NAMES.map((name) => `item.${name}`),
    ...APPROACH_NAMES.map((name) => `item.${name}.approach`),
    'spot.bed',
    'spot.chair',
    'nav.0',
    ...CAMERA_NAMES.map((name) => `camera.${name}`),
    'light.window',
    'light.fire',
    'light.lamp',
    'light.strings.0',
    'glass.window',
    'glass.window.left',
    'glass.window.hearth',
    'fire.anchor',
    'steam.anchor'
  ];
  const missing = required.filter((name) => !nodes.has(name));
  if (missing[0]) throw new Error(`cabin.glb is missing ${missing[0]}: ${missing.join(', ')}`);
  const node = (name: string): Object3D => {
    const result = nodes.get(name);
    if (!result) throw new Error(`cabin.glb is missing ${name}`);
    return result;
  };
  const numbered = (prefix: string): Object3D[] => {
    const entries = [...nodes.keys()].filter((name) =>
      new RegExp(`^${prefix.replaceAll('.', '\\.')}\\d+$`).test(name)
    );
    return entries.map((_, index) => node(`${prefix}${String(index)}`));
  };
  const nav = new Map<string, Waypoint>();
  for (const waypoint of numbered('nav.')) {
    const edges: unknown = waypoint.userData.edges;
    if (!Array.isArray(edges) || !edges.every((edge): edge is string => typeof edge === 'string')) {
      throw new Error(`cabin.glb: ${assetName(waypoint)} needs edges`);
    }
    nav.set(assetName(waypoint), { node: waypoint, edges });
  }
  for (const [name, waypoint] of nav) {
    for (const edge of waypoint.edges) {
      if (!nav.get(edge)?.edges.includes(name)) {
        throw new Error(`cabin.glb: ${name} has a missing or non-reciprocal edge ${edge}`);
      }
    }
  }
  const visited = new Set<string>();
  const pending = ['nav.0'];
  for (const name of pending) {
    if (visited.has(name)) continue;
    visited.add(name);
    pending.push(...(nav.get(name)?.edges ?? []));
  }
  if (visited.size !== nav.size) throw new Error('cabin.glb: navigation is disconnected');
  const approaches = record(APPROACH_NAMES, (name) => {
    const approach = node(`item.${name}.approach`);
    const reference: unknown = approach.userData.nav;
    if (typeof reference !== 'string' || !nav.has(reference)) {
      throw new Error(`cabin.glb: item.${name}.approach needs a valid nav reference`);
    }
    return approach;
  });
  const glass = ['glass.window', 'glass.window.left', 'glass.window.hearth'].map((name) => {
    const pane = node(name);
    if (!isMesh(pane)) throw new Error(`cabin.glb: ${name} must be a mesh`);
    numeric(pane, 'depth');
    let parent = pane.parent;
    while (parent && parent !== node('item.window')) parent = parent.parent;
    if (!parent) throw new Error(`cabin.glb: ${name} must belong to item.window`);
    return pane;
  });
  root.updateMatrixWorld(true);
  return {
    root,
    items: record(ITEM_NAMES, (name) => node(`item.${name}`)),
    approaches,
    spots: record(['bed', 'chair'], (name) => node(`spot.${name}`)),
    nav,
    cameras: record(CAMERA_NAMES, (name) => {
      const preset = node(`camera.${name}`);
      const fov = numeric(preset, 'fov');
      if (fov <= 0 || fov >= 180) throw new Error(`cabin.glb: camera.${name} has invalid fov`);
      return { node: preset, fov };
    }),
    lights: {
      window: node('light.window'),
      fire: node('light.fire'),
      lamp: node('light.lamp'),
      strings: numbered('light.strings.')
    },
    glass,
    fireAnchor: node('fire.anchor'),
    steamAnchor: node('steam.anchor')
  };
}
