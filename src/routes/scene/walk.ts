import { Quaternion, Vector3 } from 'three';
import type { Object3D } from 'three';
import type { ClipTable } from './biscuit';
import { assetName } from './cabin';
import type { Cabin } from './cabin';

const UP = new Vector3(0, 1, 0);
const EPSILON = 1e-6;

function spotNode(cabin: Cabin, name: string): Object3D {
  let found: Object3D | undefined;
  cabin.root.traverse((node) => {
    if (assetName(node) === name) found = node;
  });
  if (!found) throw new Error(`cabin.glb is missing walk target ${name}`);
  return found;
}

/** The waypoint nearest a point: where a walk from there starts, and where a spot without `extras.nav` is reached from. */
export function nearest(cabin: Cabin, point: Vector3): string {
  let distance = Infinity;
  let closest = '';
  for (const [name, waypoint] of cabin.nav) {
    const next = waypoint.node.getWorldPosition(new Vector3()).distanceToSquared(point);
    if (next < distance) {
      closest = name;
      distance = next;
    }
  }
  return closest;
}

/** A point on a walk, by the name of the room's node it is at. */
export interface PathPoint {
  name: string;
  point: Vector3;
}

/** The graph is validated by requireCabin; retain its authored edge order for ties. */
export function pathTo(cabin: Cabin, from: Vector3, spot: string): PathPoint[] {
  const target = spotNode(cabin, spot);
  const end = target.getWorldPosition(new Vector3());
  const source = nearest(cabin, from);
  const reference: unknown = target.userData.nav;
  const destination = typeof reference === 'string' ? reference : nearest(cabin, end);
  const parents = new Map<string, string | undefined>([[source, undefined]]);
  const queue = [source];
  for (const name of queue) {
    if (name === destination) break;
    for (const edge of cabin.nav.get(name)?.edges ?? []) {
      if (parents.has(edge)) continue;
      parents.set(edge, name);
      queue.push(edge);
    }
  }
  if (!parents.has(destination)) throw new Error(`No path to ${spot}`);
  const points: PathPoint[] = [{ name: spot, point: end }];
  let name: string | undefined = destination;
  while (name !== undefined) {
    const waypoint = cabin.nav.get(name);
    if (!waypoint) throw new Error(`Missing waypoint ${name}`);
    points.unshift({ name, point: waypoint.node.getWorldPosition(new Vector3()) });
    name = parents.get(name);
  }
  return points;
}

export function walkingSpeed(table: ClipTable, scale: number): number {
  const walk = table.clips.find((clip) => clip.name === 'walk');
  if (!walk || walk.seconds <= 0) throw new Error('biscuit.clips.json needs walk timing');
  return (walk.stride / walk.seconds) * scale;
}

/**
 * Walks the model along the path to a spot. `onReached` names each point as
 * she gets to it, the waypoints and then the spot itself, so the camera can
 * follow her into another part of the room; the arrival is the caller's to
 * report, once she has also turned into the spot's facing.
 */
export function createWalk(
  model: Object3D,
  cabin: Cabin,
  speed: number,
  onReached: (node: string) => void
) {
  let points: PathPoint[] = [];
  let index = 0;
  let target: string | undefined;
  const facing = new Quaternion();
  return {
    apply(spot: string | undefined) {
      if (spot === target) return;
      target = spot;
      index = 0;
      points = spot ? pathTo(cabin, model.position, spot) : [];
      if (spot) {
        // The asset faces +Z; navigation nodes describe their forward as -Z.
        const forward = new Vector3(0, 0, -1).applyQuaternion(
          spotNode(cabin, spot).getWorldQuaternion(new Quaternion())
        );
        facing.setFromAxisAngle(UP, Math.atan2(forward.x, forward.z));
      }
    },
    update(dt: number): boolean {
      if (!target) return false;
      while (index < points.length) {
        const { name, point } = points[index] as PathPoint;
        const delta = point.clone().sub(model.position);
        const distance = delta.length();
        if (distance < EPSILON) {
          index += 1;
          onReached(name);
          continue;
        }
        if (Math.hypot(delta.x, delta.z) > EPSILON) {
          const turn = new Quaternion().setFromAxisAngle(UP, Math.atan2(delta.x, delta.z));
          const angle = model.quaternion.angleTo(turn);
          const seconds = angle / Math.PI; // 180 degrees per second, in place.
          model.quaternion.rotateTowards(turn, Math.PI * dt);
          if (seconds > dt) return false;
          dt -= seconds;
        }
        const travel = Math.min(distance, speed * dt);
        model.position.addScaledVector(delta, travel / distance);
        dt -= travel / speed;
        if (travel < distance) return false;
        model.position.copy(point);
        index += 1;
        onReached(name);
      }
      // Finish the facing in place as well; arrival must not spin her into a pose.
      model.quaternion.rotateTowards(facing, Math.PI * dt);
      return model.quaternion.angleTo(facing) < EPSILON;
    }
  };
}
