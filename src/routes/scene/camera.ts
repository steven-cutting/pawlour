import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { Camera } from '$lib/domain/director';
import { ZONES } from '$lib/domain/zones';
import { assetName } from './cabin';
import type { Cabin } from './cabin';
import { nearest } from './walk';

export interface Size {
  width: number;
  height: number;
}
/** Half the room's floor, in world units: the floor-tap bounds. */
export const FLOOR_HALF = { x: 2.5, z: 2 } as const;
/** Her height, standing (CONVENTIONS.md §5.1): each framed point is fitted here as well as at the floor. */
export const SETTLE_HEIGHT = 0.55;
/**
 * Every node of the room's walk graph with the nodes one step from it. A step
 * is a waypoint edge, an approach's `extras.nav`, or a spot's nearest waypoint
 * as `walk.ts` picks it (the same `extras.nav`-or-nearest rule), and it runs
 * both ways: a walk leaves an approach for its waypoint and ends on it from
 * there, so window, which owns nav.2, sees spot.chair beyond it and holds her
 * over the last segment of a walk to the chair.
 */
export function neighbours(cabin: Cabin): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  const join = (a: string, b: string): void => {
    for (const [from, to] of [
      [a, b],
      [b, a]
    ] as const)
      graph.set(from, (graph.get(from) ?? new Set<string>()).add(to));
  };
  for (const [name, waypoint] of cabin.nav) for (const edge of waypoint.edges) join(name, edge);
  for (const node of [...Object.values(cabin.approaches), ...Object.values(cabin.spots)]) {
    const reference: unknown = node.userData.nav;
    join(
      assetName(node),
      typeof reference === 'string'
        ? reference
        : nearest(cabin, node.getWorldPosition(new Vector3()))
    );
  }
  return graph;
}

/**
 * What a preset must keep in frame (TheCameraFollowsHerUntilPinned): every
 * node of its zone and every node one step beyond it. Under Auto the picture
 * cuts as she reaches a node of another zone, so every segment she walks
 * before a cut runs between two nodes of this set, and a frustum is convex.
 * The zone comes first, in `zones.ts`'s order, then the nodes beyond it.
 */
export function frameSet(cabin: Cabin, name: Camera): string[] {
  const graph = neighbours(cabin);
  const zone = ZONES[name];
  const beyond = zone.flatMap((node) => [...(graph.get(node) ?? [])]);
  return [...new Set([...zone, ...beyond])];
}

/** The world positions of the nodes a preset frames, in `frameSet`'s order. */
export function framedFor(cabin: Cabin, name: Camera): Vector3[] {
  const nodes = new Map<string, Vector3>();
  cabin.root.traverse((node) => {
    nodes.set(assetName(node), node.getWorldPosition(new Vector3()));
  });
  return frameSet(cabin, name).map((spot) => {
    const point = nodes.get(spot);
    if (!point) throw new Error(`cabin.glb is missing ${spot}, which camera.${name} frames`);
    return point;
  });
}

export function frameCamera(
  camera: PerspectiveCamera,
  preset: Cabin['cameras'][Camera],
  size: Size,
  framed: readonly Vector3[]
): void {
  if (size.width <= 0 || size.height <= 0) return;
  camera.position.copy(preset.node.getWorldPosition(new Vector3()));
  const direction = new Vector3(0, 0, -1).applyQuaternion(
    preset.node.getWorldQuaternion(new Quaternion())
  );
  // Keep the preset's aim and level the cabin's Y-up horizon (maintainer-approved
  // P07a correction). The presets export level since P19; this guards the next export.
  camera.up.set(0, 1, 0);
  camera.lookAt(camera.position.clone().add(direction));
  camera.fov = preset.fov;
  camera.aspect = size.width / size.height;
  camera.near = 0.01;
  camera.far = 100;
  camera.updateMatrixWorld(true);
  // Fit every framed point, at the floor and at her height, inside a 0.96
  // margin in both orientations, by the least retreat along the preset's own
  // axis; the field of view never changes.
  const vertical = Math.tan((camera.fov * Math.PI) / 360) * 0.96;
  const horizontal = vertical * camera.aspect;
  let retreat = 0;
  for (const spot of framed)
    for (const height of [0, SETTLE_HEIGHT]) {
      const point = spot
        .clone()
        .setY(spot.y + height)
        .applyMatrix4(camera.matrixWorldInverse);
      retreat = Math.max(
        retreat,
        point.z + Math.abs(point.x) / horizontal,
        point.z + Math.abs(point.y) / vertical
      );
    }
  // -Z looks into the room; +Z retreats. Always start from the authored preset.
  camera.translateZ(retreat);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}
