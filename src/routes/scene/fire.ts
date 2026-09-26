import {
  Group,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3
} from 'three';
import type { Camera, Texture } from 'three';
import type { RandomPort } from '$lib/ports/random';
import type { Cabin } from './cabin';
import { particles, randomFraction } from './particles';

export function createFire(cabin: Cabin, texture: Texture, random: RandomPort) {
  const root = new Group();
  root.name = 'moving.fire';
  root.position.copy(cabin.fireAnchor.getWorldPosition(new Vector3()));
  const geometry = new PlaneGeometry(0.46, 0.6);
  const flames = [0, 3, 5].map((offset, index) => {
    const map = index === 0 ? texture : texture.clone();
    map.colorSpace = SRGBColorSpace;
    map.minFilter = map.magFilter = NearestFilter;
    map.generateMipmaps = false;
    map.repeat.y = 1 / 8;
    map.needsUpdate = true;
    const mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({ map, transparent: true, depthWrite: false })
    );
    mesh.position.set(0, 0.25, (index - 1) * 0.05);
    root.add(mesh);
    return { mesh, map, offset };
  });
  const embers = particles(20, new PlaneGeometry(0.012, 0.018), '#ffd27a');
  root.add(embers.mesh);
  const seeds = Array.from({ length: 20 }, (_, index) => ({
    age: (index / 20) * 1.5,
    x: (randomFraction(random) - 0.5) * 0.3,
    drift: (randomFraction(random) - 0.5) * 0.08
  }));
  const dummy = new Object3D();
  let time = 0;
  let noiseTime = 0;
  const drawNoise = (): number => randomFraction(random) * 2 - 1;
  let fromNoise = drawNoise();
  let toNoise = drawNoise();
  return {
    root,
    update(dt: number, camera: Camera): number {
      time += dt;
      const position = camera.getWorldPosition(new Vector3()).sub(root.position);
      root.rotation.y = Math.atan2(position.x, position.z);
      for (const flame of flames)
        flame.map.offset.y = (7 - ((Math.floor(time * 8) + flame.offset) % 8)) / 8;
      for (const [index, seed] of seeds.entries()) {
        seed.age += dt;
        if (seed.age >= 1.5) {
          seed.age %= 1.5;
          seed.x = (randomFraction(random) - 0.5) * 0.3;
          seed.drift = (randomFraction(random) - 0.5) * 0.08;
        }
        const progress = seed.age / 1.5;
        dummy.position.set(seed.x + seed.drift * progress, progress * 0.3, 0.06);
        dummy.updateMatrix();
        embers.mesh.setMatrixAt(index, dummy.matrix);
        embers.opacity.setX(index, 1 - progress);
      }
      embers.mesh.instanceMatrix.needsUpdate = true;
      embers.opacity.needsUpdate = true;
      noiseTime += dt * 3;
      while (noiseTime >= 1) {
        noiseTime -= 1;
        fromNoise = toNoise;
        toNoise = drawNoise();
      }
      const smooth = noiseTime * noiseTime * (3 - 2 * noiseTime);
      return 1 + 0.15 * (fromNoise + (toNoise - fromNoise) * smooth);
    }
  };
}
