import { NodeIO } from '@gltf-transform/core';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  BoxGeometry,
  DataTexture,
  DoubleSide,
  Frustum,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Scene,
  Vector3
} from 'three';
import rig from '../blender/model/rig.json';
import clips from '../src/lib/assets/biscuit.clips.json';
import { stubCabin } from '../scripts/stub_cabin.mjs';
import { initialState } from '../src/lib/domain/director';
import { CAMERAS, ZONES } from '../src/lib/domain/zones';
import type { Camera } from '../src/lib/domain/zones';
import { BONE_NAMES, requireBiscuit } from '../src/routes/scene/biscuit';
import { assetName, CAMERA_NAMES, isMesh, requireCabin } from '../src/routes/scene/cabin';
import type { Cabin } from '../src/routes/scene/cabin';
import { frameCamera, framedFor, frameSet, SETTLE_HEIGHT } from '../src/routes/scene/camera';
import { hitAt, tapGesture } from '../src/routes/scene/hit';
import { disposeObjects } from '../src/routes/scene/scene';
import { renderOnce, stillFor } from '../src/routes/scene/still';
import { asset, loader } from './helpers/scene';

async function stub(): Promise<Cabin> {
  const bytes = await new NodeIO().writeBinary(stubCabin(CAMERA_NAMES));
  return requireCabin((await loader().parseAsync(new Uint8Array(bytes).buffer, '')).scene);
}

describe('the scene asset boundary', () => {
  let cabin: Cabin;
  beforeAll(async () => {
    cabin = requireCabin((await asset('src/lib/assets/cabin.glb')).scene);
  });

  it('accepts the real room with sanitized names, all three panes and its eight waypoints', () => {
    expect(cabin.nav.size).toBe(8);
    expect(cabin.glass.map(assetName)).toEqual([
      'glass.window',
      'glass.window.left',
      'glass.window.hearth'
    ]);
    expect(cabin.cameras.window.node.name).toBe('camerawindow');
    expect(assetName(cabin.cameras.window.node)).toBe('camera.window');
    expect(cabin.items.shelf.getWorldPosition(new Vector3()).toArray()).toEqual(
      expect.arrayContaining([expect.closeTo(-2.3, 2), expect.closeTo(-0.4, 2)])
    );
  });

  it('accepts the generated stub and refuses a missing camera by its original name', async () => {
    const fixture = await stub();
    expect(fixture.nav.size).toBe(4);
    fixture.cameras.window.node.removeFromParent();
    expect(() => requireCabin(fixture.root)).toThrow(
      'cabin.glb is missing camera.window: camera.window'
    );
  });

  it('rejects broken navigation, metadata and a pane outside item.window', async () => {
    const fixture = await stub();
    const waypoint = fixture.nav.get('nav.0');
    if (!waypoint) throw new Error('Stub has no nav.0');
    waypoint.node.userData.edges = ['nav.missing'];
    expect(() => requireCabin(fixture.root)).toThrow('non-reciprocal edge nav.missing');
    waypoint.node.userData.edges = waypoint.edges;
    fixture.cameras.hearth.node.userData.fov = 0;
    expect(() => requireCabin(fixture.root)).toThrow('invalid fov');
    fixture.cameras.hearth.node.userData.fov = 40;
    const pane = fixture.glass[0];
    if (!pane) throw new Error('Stub has no glass');
    fixture.root.attach(pane);
    expect(() => requireCabin(fixture.root)).toThrow('must belong to item.window');
  });

  it('checks every bone, scales the actual quantized bind geometry and shares outline deformation', async () => {
    expect([...BONE_NAMES].sort()).toEqual(rig.bones.map((bone) => bone.name).sort());
    const model = await asset('src/lib/assets/biscuit.glb');
    const biscuit = requireBiscuit(model, clips);
    expect(biscuit.scale).toBe(0.55 / clips.height);
    expect(biscuit.bindBounds.getSize(new Vector3()).y).toBeCloseTo(0.55, 4);
    expect(biscuit.meshes).toHaveLength(14);
    for (const [index, outline] of biscuit.outlines.entries()) {
      const mesh = biscuit.meshes[index];
      expect(outline.geometry).toBe(mesh?.geometry);
      expect(outline.skeleton).toBe(mesh?.skeleton);
      expect(outline.morphTargetInfluences).toBe(mesh?.morphTargetInfluences);
    }
    const state = {
      ...initialState('night', 'clear', false),
      at: 'chair' as const,
      activity: 'sleep' as const
    };
    biscuit.apply(state, cabin);
    expect(
      biscuit.root.position.distanceTo(cabin.spots.chair.getWorldPosition(new Vector3()))
    ).toBeLessThan(0.00001);
    const pose = biscuit.bones.get('head')?.quaternion.toArray();
    biscuit.apply({ ...state, elapsed: 900 }, cabin);
    expect(biscuit.bones.get('head')?.quaternion.toArray()).toEqual(pose);
    biscuit.dispose();
    disposeObjects([biscuit.root]);
  });

  it('names a missing rig bone before drawing', async () => {
    const model = await asset('src/lib/assets/biscuit.glb');
    model.scene.traverse((node) => {
      if (assetName(node) === 'tail.7') {
        node.userData.name = 'missing';
        node.name = 'missing';
      }
    });
    expect(() => requireBiscuit(model, clips)).toThrow('biscuit.glb is missing bone tail.7');
    disposeObjects([model.scene]);
  });

  /*
   * TheCameraFollowsHerUntilPinned, on the real room. Every place she can
   * stand belongs to one preset (`zones.ts`), and each preset keeps its zone
   * and every node one step beyond it in frame, at the floor and at her
   * height, at the two phone orientations, a desktop and the narrowest width,
   * with nothing of the room between her and the eye. Each fit backs away no
   * further than the farthest point needs: whenever it has moved at all, that
   * point sits on the 0.96 margin.
   */
  const SIZES = [
    { width: 844, height: 390 },
    { width: 1200, height: 844 },
    { width: 390, height: 844 },
    { width: 320, height: 568 }
  ] as const;
  const at = (size: { width: number; height: number }): string =>
    `${String(size.width)}x${String(size.height)}`;

  /*
   * From the hearth, the jar's stand (item.jar at x = 0.3, z = 1.7) stands in
   * line with the two nodes at x = 0.3 behind it and hides them at knee height;
   * her head is clear. She never stands at either in v1: the jar does nothing,
   * and no walk to the five things she goes to passes nav.5. The maintainer
   * kept the hearth where it is on 2026-09-28 rather than move it 0.6 m right
   * (P22's hand-back), so those two are held at her head alone, from there alone.
   */
  const HEAD_ONLY: Partial<Record<Camera, readonly string[]>> = {
    hearth: ['item.jar.approach', 'nav.5']
  };
  function sightHeights(name: Camera, node: string): readonly number[] {
    // On the furniture only her head: a ray to the seat itself would graze the cushion she sits on.
    return node.startsWith('spot.') || HEAD_ONLY[name]?.includes(node)
      ? [SETTLE_HEIGHT]
      : [0.3, SETTLE_HEIGHT];
  }

  function worldPoint(root: Object3D, name: string): Vector3 {
    let found: Object3D | undefined;
    root.traverse((node) => {
      if (assetName(node) === name) found = node;
    });
    if (!found) throw new Error(`The room has no ${name}`);
    return found.getWorldPosition(new Vector3());
  }

  it('gives every place she can stand to exactly one preset', () => {
    const places = new Set<string>();
    cabin.root.traverse((node) => {
      const name = assetName(node);
      if (/^nav\.\d+$/.test(name) || /^item\.\w+\.approach$/.test(name) || /^spot\./.test(name))
        places.add(name);
    });
    const named = CAMERAS.flatMap((camera) => ZONES[camera]);
    expect(places.size).toBe(8 + 8 + 2);
    expect(named).toHaveLength(places.size);
    expect([...named].sort()).toEqual([...places].sort());
  });

  it('frames each zone with the nodes one step beyond it, both ways along the walk graph', () => {
    expect(frameSet(cabin, 'bowls')).toEqual([
      'item.water.approach',
      'item.food.approach',
      'nav.3'
    ]);
    expect(frameSet(cabin, 'chair')).toEqual(['spot.chair', 'nav.2']);
    expect(frameSet(cabin, 'window')).toContain('spot.chair');
    for (const name of CAMERAS)
      expect(framedFor(cabin, name).map((point) => point.toArray())).toEqual(
        frameSet(cabin, name).map((node) => worldPoint(cabin.root, node).toArray())
      );
  });

  it('holds only the room itself under the cabin root, every face drawn from both sides', () => {
    let meshes = 0;
    cabin.root.traverse((node) => {
      if (!isMesh(node)) return;
      meshes += 1;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        expect(material.name).toMatch(/^cabin\./);
        // A one-sided face would hide from a ray behind it and show nothing there either.
        expect(material.side).toBe(DoubleSide);
      }
    });
    expect(meshes).toBeGreaterThan(0);
  });

  for (const name of CAMERAS)
    it(`fits ${name}'s zone and the step beyond it at four sizes, with nothing in the way`, () => {
      const preset = cabin.cameras[name];
      const origin = preset.node.getWorldPosition(new Vector3());
      const direction = new Vector3(0, 0, -1).applyQuaternion(
        preset.node.getWorldQuaternion(new Quaternion())
      );
      const nodes = frameSet(cabin, name);
      const points = framedFor(cabin, name);
      const raycaster = new Raycaster();
      // One camera across every size: each fit starts again from the authored preset.
      const camera = new PerspectiveCamera();
      for (const size of SIZES) {
        frameCamera(camera, preset, size, points);
        expect(camera.fov).toBe(preset.fov);
        expect(camera.getWorldDirection(new Vector3()).distanceTo(direction)).toBeLessThan(1e-6);
        expect(new Vector3(1, 0, 0).applyQuaternion(camera.quaternion).y).toBeCloseTo(0, 6);
        expect(new Vector3(0, 1, 0).applyQuaternion(camera.quaternion).y).toBeGreaterThan(0);
        // On the authored axis, behind the preset or at it, never in front.
        const offset = camera.position.clone().sub(origin);
        expect(offset.clone().cross(direction).length()).toBeLessThan(1e-6);
        expect(offset.dot(direction)).toBeLessThanOrEqual(1e-9);
        const frustum = new Frustum().setFromProjectionMatrix(
          new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
        );
        let extreme = 0;
        for (const [index, point] of points.entries()) {
          const node = nodes[index] ?? '';
          for (const height of [0, SETTLE_HEIGHT]) {
            const lifted = point.clone().setY(point.y + height);
            expect(frustum.containsPoint(lifted), `${node} +${String(height)} at ${at(size)}`).toBe(
              true
            );
            const projected = lifted.clone().project(camera);
            extreme = Math.max(extreme, Math.abs(projected.x), Math.abs(projected.y));
          }
          // Her body at knee height and at her head, so a rim or an arm cannot hide her.
          for (const height of sightHeights(name, node)) {
            const target = point.clone().setY(point.y + height);
            const ray = target.clone().sub(camera.position);
            raycaster.set(camera.position, ray.clone().normalize());
            raycaster.far = ray.length();
            const hits = raycaster.intersectObject(cabin.root, true);
            expect(
              hits.map((hit) => assetName(hit.object)),
              `${name} to ${node} +${String(height)} at ${at(size)}, from ${camera.position
                .toArray()
                .map((value) => value.toFixed(2))
                .join(', ')}`
            ).toEqual([]);
          }
        }
        if (offset.length() > 1e-6)
          expect(
            Math.abs(extreme - 0.96),
            `${name} at ${at(size)} retreated ${offset.length().toFixed(2)} m`
          ).toBeLessThanOrEqual(1e-3);
      }
    });
});

describe('static rendering and input', () => {
  it('selects all six still activities and phases, preserving an interrupted activity', () => {
    const state = initialState('morning', 'clear', false);
    for (const phase of ['morning', 'evening', 'night'] as const) {
      expect(stillFor({ ...state, phase })).toBe(`idle.${phase}`);
      for (const at of ['bed', 'chair'] as const)
        expect(stillFor({ ...state, phase, at, activity: 'sleep' })).toBe(`sleep.${at}.${phase}`);
      for (const activity of ['drink', 'eat', 'play'] as const)
        expect(stillFor({ ...state, phase, activity })).toBe(`${activity}.${phase}`);
    }
    expect(stillFor({ ...state, activity: 'pet', resume: { activity: 'drink', elapsed: 1 } })).toBe(
      'drink.morning'
    );
    const render = vi.fn();
    renderOnce({ render }, new Scene(), new PerspectiveCamera());
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('returns the nearest item or Biscuit, bounded floor points, and null for a miss', async () => {
    const cabin = await stub();
    const camera = new PerspectiveCamera(60, 1, 0.1, 20);
    camera.position.set(0, 5, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    const biscuit = { meshes: [] };
    const size = { width: 500, height: 500 };
    expect(hitAt(250, 250, size, camera, cabin, biscuit)?.kind).toBe('floor');
    const item = cabin.items.toy
      .getWorldPosition(new Vector3())
      .add(new Vector3(0, 0.3, 0))
      .project(camera);
    expect(hitAt((item.x + 1) * 250, (1 - item.y) * 250, size, camera, cabin, biscuit)).toEqual({
      kind: 'item',
      item: 'item.toy'
    });
    expect(hitAt(0, 0, size, camera, cabin, biscuit)).toBeNull();
    expect(hitAt(-1, 10, size, camera, cabin, biscuit)).toBeNull();
    // The supplied originals alone are raycast; an outline beside them cannot win.
    const model = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    model.position.y = 1;
    model.updateMatrixWorld(true);
    expect(hitAt(250, 250, size, camera, cabin, { meshes: [model] })).toEqual({ kind: 'biscuit' });
  });

  it('distinguishes a tap, threshold drag, returning drag, cancellation and a second finger', () => {
    const gesture = tapGesture();
    const pointer = (x: number, id = 1, primary = true) =>
      new PointerEvent('pointerdown', {
        pointerId: id,
        isPrimary: primary,
        clientX: x,
        clientY: 0,
        button: 0
      });
    gesture.down(pointer(0));
    expect(gesture.up(pointer(7))).toBe(true);
    gesture.down(pointer(0));
    expect(gesture.up(pointer(8))).toBe(false);
    gesture.down(pointer(0));
    gesture.move(pointer(9));
    expect(gesture.up(pointer(0))).toBe(false);
    gesture.down(pointer(0));
    gesture.cancel();
    expect(gesture.up(pointer(0))).toBe(false);
    gesture.down(pointer(0));
    gesture.down(pointer(0, 2, false));
    expect(gesture.up(pointer(0))).toBe(false);
  });

  it('disposes shared resources once', () => {
    const root = new Group();
    const texture = new DataTexture();
    const material = new MeshBasicMaterial({ map: texture });
    const geometry = new BoxGeometry();
    const instances = new InstancedMesh(geometry, material, 2);
    root.add(instances);
    root.add(new Mesh(geometry, material), new Mesh(geometry, material), new Object3D());
    const textureDispose = vi.spyOn(texture, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const instanceDispose = vi.spyOn(instances, 'dispose');
    disposeObjects([root], [material]);
    expect(textureDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(instanceDispose).toHaveBeenCalledTimes(1);
  });
});
