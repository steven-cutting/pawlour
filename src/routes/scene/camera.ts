import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { Camera } from '$lib/domain/director';
import { assetName } from './cabin';
import type { Cabin, CabinCamera } from './cabin';

export interface Size {
  width: number;
  height: number;
}
/** Half the room's floor, in world units: the floor-tap bounds. */
export const FLOOR_HALF = { x: 2.5, z: 2 } as const;
/** Her height, standing (CONVENTIONS.md §5.1): each framed point is fitted here as well as at the floor. */
export const SETTLE_HEIGHT = 0.55;
/*
 * What each preset must keep in frame: the places she settles that it looks
 * at. She settles at six points and nowhere else, the spot of each of the five
 * things she walks to and `nav.0`, where she opens. Hearth sees all six;
 * window and chair frame their own subject, and she can leave them while they
 * are chosen, as she can in landscape, until P22 follows her and replaces
 * this table with its zones.
 */
export const FRAMED: Readonly<Record<CabinCamera, readonly string[]>> = {
  hearth: [
    'spot.bed',
    'spot.chair',
    'item.water.approach',
    'item.food.approach',
    'item.toy.approach',
    'nav.0'
  ],
  window: ['spot.chair', 'item.toy.approach', 'nav.0'],
  chair: ['spot.chair']
};

/** The world positions of the nodes a preset frames, in the table's order. */
export function framedFor(cabin: Cabin, name: CabinCamera): Vector3[] {
  const nodes = new Map<string, Vector3>();
  cabin.root.traverse((node) => {
    nodes.set(assetName(node), node.getWorldPosition(new Vector3()));
  });
  return FRAMED[name].map((spot) => {
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
