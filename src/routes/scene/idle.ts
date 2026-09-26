import { Quaternion, Vector3 } from 'three';
import type { SceneState } from '$lib/domain/director';
import type { RandomPort } from '$lib/ports/random';
import type { Biscuit } from './biscuit';
import type { Cabin } from './cabin';

const INTERVALS = Array.from({ length: 9 }, (_, index) => 6 + index);
const RADIANS = Math.PI / 180;
const X = new Vector3(1, 0, 0);
const Z = new Vector3(0, 0, 1);

/** The platform's --ease: cubic-bezier(0.2, 0, 0.2, 1). */
export function ease(fraction: number): number {
  const x = Math.min(1, Math.max(0, fraction));
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const t = (low + high) / 2;
    const inverse = 1 - t;
    const position = 0.6 * inverse * inverse * t + 0.6 * inverse * t * t + t * t * t;
    if (position < x) low = t;
    else high = t;
  }
  const t = (low + high) / 2;
  return x === 0 || x === 1 ? x : 3 * (1 - t) * t * t + t * t * t;
}

export function createIdle(biscuit: Biscuit, cabin: Cabin, random: RandomPort) {
  const names = ['chest', 'ear.1.L', 'ear.1.R', 'tail.1', 'tail.2', 'tail.3', 'neck', 'head'];
  const poses = names.map((name) => {
    const bone = biscuit.bones.get(name);
    if (!bone) throw new Error(`biscuit.glb is missing ${name}`);
    return { bone, quaternion: bone.quaternion.clone(), scale: bone.scale.clone() };
  });
  let applied = false;
  let time = 0;
  let nextEar = random.uniformChoice(INTERVALS);
  let earStart = -Infinity;
  let ear = 'ear.1.L';
  let look: string | undefined;
  let yaw = 0;
  let fromYaw = 0;
  let lookTime = 0;
  const clear = (): void => {
    if (!applied) return;
    for (const pose of poses) {
      pose.bone.quaternion.copy(pose.quaternion);
      pose.bone.scale.copy(pose.scale);
    }
    applied = false;
  };
  return {
    clear,
    update(state: SceneState, dt: number) {
      // Clear before mixer.update, even when a constant track would not write again.
      time += dt;
      for (const pose of poses) {
        pose.quaternion.copy(pose.bone.quaternion);
        pose.scale.copy(pose.bone.scale);
      }
      applied = true;
      const rotate = (name: string, axis: Vector3, angle: number): void => {
        biscuit.bones
          .get(name)
          ?.quaternion.multiply(new Quaternion().setFromAxisAngle(axis, angle));
      };
      biscuit.bones
        .get('chest')
        ?.scale.multiplyScalar(1 + 0.015 * Math.sin(2 * Math.PI * 0.25 * time));
      const activity = state.activity === 'pet' ? state.resume?.activity : state.activity;
      if (time >= nextEar) {
        earStart = time;
        ear = random.uniformChoice(['ear.1.L', 'ear.1.R']);
        nextEar = time + random.uniformChoice(INTERVALS);
      }
      if (activity !== 'sleep') {
        const age = time - earStart;
        const twitch = age < 0.12 ? age / 0.12 : Math.max(0, 1 - (age - 0.12) / 0.2);
        rotate(ear, X, 12 * RADIANS * twitch);
        if (activity === 'idle.stand' || activity === 'idle.sit')
          for (let index = 0; index < 3; index += 1)
            rotate(
              `tail.${String(index + 1)}`,
              Z,
              8 * RADIANS * Math.sin(2 * Math.PI * 0.4 * time - index * 0.15)
            );
      }
      const key = JSON.stringify(state.lookAt);
      if (look !== key) {
        look = key;
        fromYaw = yaw;
        lookTime = 0;
      }
      let point: Vector3 | undefined;
      if (state.lookAt)
        point =
          'item' in state.lookAt
            ? cabin.items[state.lookAt.item].getWorldPosition(new Vector3())
            : new Vector3(state.lookAt.x, 0, state.lookAt.z);
      // Only the root's own world matrix is read here; getWorldQuaternion below
      // refreshes each bone's chain itself, and transforms() walks the rest.
      biscuit.root.updateWorldMatrix(true, false);
      if (point) biscuit.root.worldToLocal(point);
      const toYaw = point
        ? Math.max(-40 * RADIANS, Math.min(40 * RADIANS, Math.atan2(point.x, point.z)))
        : 0;
      lookTime += dt;
      yaw = fromYaw + (toYaw - fromYaw) * ease(lookTime / 0.4);
      for (const name of ['neck', 'head']) {
        const bone = biscuit.bones.get(name);
        if (!bone) continue;
        // Bone rest axes are not world axes; rotate around up in the bone's space.
        const axis = new Vector3(0, 1, 0).applyQuaternion(
          bone.getWorldQuaternion(new Quaternion()).invert()
        );
        rotate(name, axis, yaw / 2);
      }
    }
  };
}
