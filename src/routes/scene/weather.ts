import { CircleGeometry, Group, Matrix3, Object3D, PlaneGeometry, Vector3 } from 'three';
import type { Camera, Mesh } from 'three';
import type { Weather } from '$lib/domain/weather';
import type { RandomPort } from '$lib/ports/random';
import type { Cabin } from './cabin';
import { particles, randomFraction } from './particles';

/** Derive each exterior box from the transformed surface, not a guessed local Z. */
export function paneVolume(pane: Mesh) {
  const normal = new Vector3()
    .fromBufferAttribute(pane.geometry.getAttribute('normal'), 0)
    .applyMatrix3(new Matrix3().getNormalMatrix(pane.matrixWorld))
    .normalize();
  const outward = normal.negate();
  const up = new Vector3(0, 1, 0);
  const across = new Vector3().crossVectors(up, outward).normalize();
  const positions = pane.geometry.getAttribute('position');
  const centre = new Vector3();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < positions.count; index += 1) {
    const point = new Vector3()
      .fromBufferAttribute(positions, index)
      .applyMatrix4(pane.matrixWorld);
    centre.add(point);
    minX = Math.min(minX, point.dot(across));
    maxX = Math.max(maxX, point.dot(across));
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  centre.divideScalar(positions.count);
  const depth = pane.userData.depth as number;
  return { centre, outward, across, width: maxX - minX, height: maxY - minY, depth };
}

export function createWeather(cabin: Cabin, random: RandomPort) {
  const root = new Group();
  root.name = 'moving.weather';
  const volumes = cabin.glass.map(paneVolume);
  const rain = particles(300, new PlaneGeometry(0.006, 0.09), '#a8bdce');
  const snow = particles(200, new CircleGeometry(0.014, 6), '#f3eadb');
  const steam = particles(6, new PlaneGeometry(0.035, 0.055), '#d4c4aa');
  const steamPosition = cabin.steamAnchor.getWorldPosition(new Vector3());
  root.add(rain.mesh, snow.mesh, steam.mesh);
  const seeds = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      volume: volumes[index % volumes.length] as ReturnType<typeof paneVolume>,
      x: randomFraction(random),
      y: randomFraction(random),
      z: randomFraction(random),
      phase: randomFraction(random) * 2 * Math.PI
    }));
  const raindrops = seeds(300);
  const snowflakes = seeds(200);
  const dummy = new Object3D();
  let time = 0;
  let weather: Weather = 'clear';
  return {
    root,
    apply(next: Weather) {
      weather = next;
      rain.mesh.visible = next === 'rain';
      snow.mesh.visible = next === 'snow';
    },
    update(dt: number, camera: Camera) {
      time += dt;
      const effect = weather === 'snow' ? snow : rain;
      const drops = weather === 'snow' ? snowflakes : raindrops;
      if (weather !== 'clear') {
        for (const [index, seed] of drops.entries()) {
          const box = seed.volume;
          seed.y -= ((weather === 'rain' ? 4 : 0.6) * dt) / box.height;
          while (seed.y < 0) {
            seed.y += 1;
            seed.x = randomFraction(random);
            seed.z = randomFraction(random);
          }
          const drift =
            weather === 'rain' ? (1 - seed.y) * 0.06 : Math.sin(time + seed.phase) * 0.07;
          const x = (((seed.x + drift) % 1) + 1) % 1;
          dummy.position
            .copy(box.centre)
            .addScaledVector(box.across, (x - 0.5) * box.width)
            .addScaledVector(box.outward, 0.01 + seed.z * (box.depth - 0.01));
          dummy.position.y += (seed.y - 0.5) * box.height;
          dummy.quaternion.copy(camera.quaternion);
          if (weather === 'rain') dummy.rotateZ(-0.08);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          effect.mesh.setMatrixAt(index, dummy.matrix);
          effect.opacity.setX(index, weather === 'rain' ? 0.5 : 0.85);
        }
        effect.mesh.instanceMatrix.needsUpdate = true;
        effect.opacity.needsUpdate = true;
      }
      for (let index = 0; index < 6; index += 1) {
        const progress = ((time + (index / 6) * 2) % 2) / 2;
        dummy.position.copy(steamPosition);
        dummy.position.y += progress * 0.12;
        dummy.quaternion.copy(camera.quaternion);
        dummy.scale.setScalar(0.5 + progress);
        dummy.updateMatrix();
        steam.mesh.setMatrixAt(index, dummy.matrix);
        steam.opacity.setX(index, (1 - progress) * 0.22);
      }
      steam.mesh.instanceMatrix.needsUpdate = true;
      steam.opacity.needsUpdate = true;
    }
  };
}
