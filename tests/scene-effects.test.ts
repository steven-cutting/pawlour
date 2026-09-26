import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  DataTexture,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PointLight,
  Vector3
} from 'three';
import sharp from 'sharp';
import { initialState } from '../src/lib/domain/director';
import { createFakeRandom } from '../src/lib/ports/random';
import { requireCabin } from '../src/routes/scene/cabin';
import type { Cabin } from '../src/routes/scene/cabin';
import { createFire } from '../src/routes/scene/fire';
import { lighting } from '../src/routes/scene/lighting';
import { createWeather, paneVolume } from '../src/routes/scene/weather';
import { wipe } from '../src/routes/scene/wipe';
import { disposeObjects } from '../src/routes/scene/scene';
import { asset } from './helpers/scene';

let cabin: Cabin;
const state = initialState('morning', 'clear', true);
beforeAll(async () => {
  cabin = requireCabin((await asset('src/lib/assets/cabin.glb')).scene);
});
function instances(node: unknown): InstancedMesh {
  if (!(node instanceof InstancedMesh)) throw new Error('Expected instanced particles');
  return node as InstancedMesh;
}

describe('fire, weather and phase light', () => {
  it('ships eight different transparent cels in exactly three opaque colours', async () => {
    const { data, info } = await sharp('src/lib/assets/fire.webp')
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([info.width, info.height, info.channels]).toEqual([256, 2048, 4]);
    const colours = new Set<string>();
    for (let pixel = 0; pixel < data.length; pixel += 4) {
      const alpha = data[pixel + 3];
      expect(alpha === 0 || alpha === 255).toBe(true);
      if (alpha) colours.add(data.subarray(pixel, pixel + 3).toString('hex'));
    }
    expect([...colours].sort()).toEqual(['c8501e', 'f08a2a', 'ffd27a'].sort());
    const frames = Array.from({ length: 8 }, (_, index) =>
      data.subarray(index * 256 * 256 * 4, (index + 1) * 256 * 256 * 4).toString('base64')
    );
    expect(new Set(frames).size).toBe(8);
  });

  it('steps flames at 8fps with offsets 0/3/5, billboards around Y and fades twenty rising embers', () => {
    const effect = createFire(cabin, new DataTexture(), createFakeRandom([0, 64, 128, 255]));
    const camera = new PerspectiveCamera();
    camera.position.copy(effect.root.position).add(new Vector3(2, 1, 0));
    const maps = effect.root.children.slice(0, 3).map((node) => {
      const material = (node as Mesh).material as MeshBasicMaterial;
      if (!material.map) throw new Error('Missing fire map');
      return material.map;
    });
    effect.update(0, camera);
    expect(maps.map((map) => map.offset.y)).toEqual([7 / 8, 4 / 8, 2 / 8]);
    expect(maps.map((map) => map.repeat.y)).toEqual([1 / 8, 1 / 8, 1 / 8]);
    const embers = instances(effect.root.children[3]);
    expect(embers.count).toBe(20);
    const matrix = new Matrix4();
    effect.update(0.125, camera);
    expect(maps.map((map) => map.offset.y)).toEqual([6 / 8, 3 / 8, 1 / 8]);
    expect(effect.root.rotation.y).toBeCloseTo(Math.PI / 2);
    expect(effect.root.rotation.x).toBe(0);
    effect.update(0.625, camera);
    embers.getMatrixAt(0, matrix);
    expect(new Vector3().setFromMatrixPosition(matrix).y).toBeCloseTo(0.15);
    expect(embers.geometry.getAttribute('instanceOpacity').getX(0)).toBeCloseTo(0.5);
    for (let frame = 0; frame < 100; frame += 1) {
      const flicker = effect.update(0.05, camera);
      expect(flicker).toBeGreaterThanOrEqual(0.85);
      expect(flicker).toBeLessThanOrEqual(1.15);
    }
    disposeObjects([effect.root]);
  });

  it('keeps all particles outside each of the three walls within one total budget', () => {
    const volumes = cabin.glass.map(paneVolume);
    expect(volumes.map((box) => box.width)).toEqual([
      expect.closeTo(1),
      expect.closeTo(1),
      expect.closeTo(1)
    ]);
    expect(volumes.map((box) => box.height)).toEqual([
      expect.closeTo(0.9),
      expect.closeTo(0.9),
      expect.closeTo(0.9)
    ]);
    expect(volumes.map((box) => box.outward.toArray())).toEqual([
      [expect.closeTo(1), expect.closeTo(0), expect.closeTo(0)],
      [expect.closeTo(-1), expect.closeTo(0), expect.closeTo(0)],
      [expect.closeTo(0), expect.closeTo(0), expect.closeTo(-1)]
    ]);
    const effect = createWeather(cabin, createFakeRandom([0, 32, 96, 192, 255]));
    const [rain, snow, steam] = effect.root.children.map(instances);
    if (!rain || !snow || !steam) throw new Error('Missing weather effect');
    expect([rain.count, snow.count, steam.count]).toEqual([300, 200, 6]);
    const camera = new PerspectiveCamera();
    effect.apply('clear');
    expect(rain.visible || snow.visible).toBe(false);
    for (const weather of ['rain', 'snow'] as const) {
      effect.apply(weather);
      expect(rain.visible).toBe(weather === 'rain');
      expect(snow.visible).toBe(weather === 'snow');
      const mesh = weather === 'rain' ? rain : snow;
      for (let frame = 0; frame < 10; frame += 1) {
        effect.update(0.05, camera);
        for (let index = 0; index < mesh.count; index += 1) {
          const box = volumes[index % volumes.length];
          if (!box) throw new Error('Missing pane');
          const matrix = new Matrix4();
          mesh.getMatrixAt(index, matrix);
          const relative = new Vector3().setFromMatrixPosition(matrix).sub(box.centre);
          expect(relative.dot(box.outward)).toBeGreaterThan(0);
          expect(relative.dot(box.outward)).toBeLessThanOrEqual(box.depth);
          expect(Math.abs(relative.dot(box.across))).toBeLessThanOrEqual(box.width / 2 + 1e-6);
          expect(Math.abs(relative.y)).toBeLessThanOrEqual(box.height / 2 + 1e-6);
        }
      }
    }
    effect.apply('clear');
    effect.update(0, camera);
    const matrix = new Matrix4();
    steam.getMatrixAt(0, matrix);
    const anchor = cabin.steamAnchor.getWorldPosition(new Vector3());
    expect(new Vector3().setFromMatrixPosition(matrix).y - anchor.y).toBeCloseTo(0.06);
    disposeObjects([effect.root]);
  });

  it('blends every phase intensity for 600ms, retargets from the displayed mixture and cuts in still mode', () => {
    const lights = lighting(cabin);
    const values = () =>
      lights.root.children.map(
        (group) =>
          group.children
            .filter((node) => node instanceof HemisphereLight)
            .map((node) => node.intensity)[0]
      );
    lights.apply(state, true);
    lights.apply({ ...state, phase: 'night' }, true);
    lights.update(0.3);
    expect(values()).toEqual([expect.closeTo(0.45), 0, expect.closeTo(0.175)]);
    const allPoints: PointLight[] = [];
    lights.root.traverse((node) => {
      if (node instanceof PointLight) allPoints.push(node);
    });
    expect(
      allPoints.filter((point) => point.distance === 4).map((point) => point.intensity)
    ).toEqual([0.3, 0, 1.5]);
    lights.apply({ ...state, phase: 'evening' }, true);
    expect(values()).toEqual([expect.closeTo(0.45), 0, expect.closeTo(0.175)]);
    lights.update(0.3);
    expect(values()).toEqual([expect.closeTo(0.225), 0.25, expect.closeTo(0.0875)]);
    lights.update(0.3);
    expect(values()).toEqual([0, 0.5, 0]);
    lights.apply({ ...state, phase: 'night' }, false);
    expect(values()).toEqual([0, 0, 0.35]);
    lights.update(0, 1.15);
    expect(
      allPoints.filter((point) => point.distance === 4).map((point) => point.intensity)
    ).toEqual([0, 0, expect.closeTo(3.45)]);
    lights.update(0, 1.15);
    expect(allPoints.filter((point) => point.distance === 4)[2]?.intensity).toBeCloseTo(3.45);
    disposeObjects([lights.root]);
  });
});

describe('the token-gated diagonal wipe', () => {
  function target(duration: string) {
    const element = document.createElement('div');
    element.style.setProperty('--dur-3', duration);
    element.style.setProperty('--ease', 'cubic-bezier(0.2, 0, 0.2, 1)');
    document.body.append(element);
    return element;
  }
  function transition(element: HTMLElement, kind: string, property = 'clip-path') {
    const event = new Event(kind, { bubbles: true });
    Object.defineProperty(event, 'propertyName', { value: property });
    element.dispatchEvent(event);
  }
  it('resolves immediately at zero duration and restores the previous transition', async () => {
    const element = target('0ms');
    element.style.transition = 'opacity 1s';
    await wipe(element, 'in');
    expect(element.style.clipPath).toContain('200%');
    expect(element.style.transition).toBe('opacity 1s');
    element.remove();
  });
  it('waits only for its clip transition, cleans up cancellation and resolves a superseded wipe', async () => {
    const element = target('180ms');
    const complete = vi.fn();
    const first = wipe(element, 'in').then(complete);
    transition(element, 'transitionend', 'opacity');
    await Promise.resolve();
    expect(complete).not.toHaveBeenCalled();
    const second = wipe(element, 'out');
    await first;
    expect(complete).toHaveBeenCalledOnce();
    transition(element, 'transitioncancel');
    await second;
    expect(element.style.transition).toBe('');
    const third = wipe(element, 'in');
    transition(element, 'transitionend');
    await third;
    expect(element.style.transition).toBe('');
    element.remove();
  });
});
