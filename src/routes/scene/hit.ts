import { Mesh, Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { Camera, Object3D } from 'three';
import type { Cabin } from './cabin';
import type { Size } from './camera';

export type Hit =
  | { kind: 'item'; item: string }
  | { kind: 'biscuit' }
  | { kind: 'floor'; point: { x: number; z: number } };

export function hitAt(
  x: number,
  y: number,
  size: Size,
  camera: Camera,
  cabin: Cabin,
  biscuit: { meshes: readonly Mesh[] }
): Hit | null {
  if (size.width <= 0 || size.height <= 0 || x < 0 || y < 0 || x > size.width || y > size.height)
    return null;
  const ray = new Raycaster();
  ray.setFromCamera(new Vector2((x / size.width) * 2 - 1, 1 - (y / size.height) * 2), camera);
  const owners = new Map<Object3D, Hit>();
  for (const [name, item] of Object.entries(cabin.items)) {
    item.traverse((node) => {
      if (node instanceof Mesh) owners.set(node, { kind: 'item', item: `item.${name}` });
    });
  }
  for (const mesh of biscuit.meshes) owners.set(mesh, { kind: 'biscuit' });
  const nearest = ray.intersectObjects([...owners.keys()], false)[0];
  const floor = ray.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), new Vector3());
  if (
    floor &&
    Math.abs(floor.x) <= 2.5 &&
    Math.abs(floor.z) <= 2 &&
    (!nearest || floor.distanceTo(ray.ray.origin) < nearest.distance)
  ) {
    return { kind: 'floor', point: { x: floor.x, z: floor.z } };
  }
  return nearest ? (owners.get(nearest.object) ?? null) : null;
}

/** A drag that comes back to its start, or a second finger, is still not a tap. */
export function tapGesture(): {
  down(event: PointerEvent): void;
  move(event: PointerEvent): void;
  up(event: PointerEvent): boolean;
  cancel(): void;
} {
  let start: { id: number; x: number; y: number } | undefined;
  const cancel = (): void => {
    start = undefined;
  };
  const move = (event: PointerEvent): void => {
    if (
      start?.id === event.pointerId &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 8
    )
      cancel();
  };
  return {
    down(event) {
      if (start || !event.isPrimary || event.button !== 0) {
        cancel();
        return;
      }
      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    },
    move,
    up(event) {
      move(event);
      const tap = start?.id === event.pointerId;
      cancel();
      return tap;
    },
    cancel
  };
}
