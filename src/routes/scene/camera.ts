import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { Camera } from '$lib/domain/director';
import type { Cabin } from './cabin';

export interface Size {
  width: number;
  height: number;
}
export const FLOOR_CORNERS = [-2.5, 2.5].flatMap((x) => [-2, 2].map((z) => new Vector3(x, 0, z)));

export function frameCamera(
  camera: PerspectiveCamera,
  preset: Cabin['cameras'][Camera],
  size: Size
): void {
  if (size.width <= 0 || size.height <= 0) return;
  camera.position.copy(preset.node.getWorldPosition(new Vector3()));
  const direction = new Vector3(0, 0, -1).applyQuaternion(
    preset.node.getWorldQuaternion(new Quaternion())
  );
  // The shipped presets contain roll. Keep their aim and level the cabin's Y-up
  // horizon (maintainer-approved P07a correction; P05 owns the asset follow-up).
  camera.up.set(0, 1, 0);
  camera.lookAt(camera.position.clone().add(direction));
  camera.fov = preset.fov;
  camera.aspect = size.width / size.height;
  camera.near = 0.01;
  camera.far = 100;
  camera.updateMatrixWorld(true);
  if (camera.aspect < 1) {
    const vertical = Math.tan((camera.fov * Math.PI) / 360) * 0.96;
    const horizontal = vertical * camera.aspect;
    let retreat = 0;
    for (const corner of FLOOR_CORNERS) {
      const point = corner.clone().applyMatrix4(camera.matrixWorldInverse);
      retreat = Math.max(
        retreat,
        point.z + Math.abs(point.x) / horizontal,
        point.z + Math.abs(point.y) / vertical
      );
    }
    // -Z looks into the room; +Z retreats. Always start from the authored preset.
    camera.translateZ(retreat);
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}
