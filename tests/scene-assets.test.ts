import { NodeIO } from '@gltf-transform/core';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  BoxGeometry,
  DataTexture,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3
} from 'three';
import rig from '../blender/model/rig.json';
import clips from '../src/lib/assets/biscuit.clips.json';
import { stubCabin } from '../scripts/stub_cabin.mjs';
import { initialState } from '../src/lib/domain/director';
import { BONE_NAMES, requireBiscuit } from '../src/routes/scene/biscuit';
import { assetName, CAMERA_NAMES, requireCabin } from '../src/routes/scene/cabin';
import type { Cabin } from '../src/routes/scene/cabin';
import { FLOOR_CORNERS, frameCamera } from '../src/routes/scene/camera';
import { hitAt, tapGesture } from '../src/routes/scene/hit';
import { disposeObjects } from '../src/routes/scene/scene';
import { renderOnce, stillFor } from '../src/routes/scene/still';
import { asset, loader } from './helpers/scene';

async function stub(): Promise<Cabin> {
  const bytes = await new NodeIO().writeBinary(stubCabin());
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

  for (const name of CAMERA_NAMES)
    it(`frames the entire floor from ${name} at 320 and 390 pixels without FOV drift`, () => {
      const camera = new PerspectiveCamera();
      const preset = cabin.cameras[name];
      frameCamera(camera, preset, { width: 1200, height: 844 });
      expect(camera.position.distanceTo(preset.node.getWorldPosition(new Vector3()))).toBe(0);
      const direction = new Vector3(0, 0, -1).applyQuaternion(
        preset.node.getWorldQuaternion(new Quaternion())
      );
      for (const width of [320, 390, 320]) {
        frameCamera(camera, cabin.cameras[name], { width, height: 844 });
        expect(camera.fov).toBe(cabin.cameras[name].fov);
        expect(camera.getWorldDirection(new Vector3()).distanceTo(direction)).toBeLessThan(1e-6);
        expect(new Vector3(1, 0, 0).applyQuaternion(camera.quaternion).y).toBeCloseTo(0, 6);
        expect(new Vector3(0, 1, 0).applyQuaternion(camera.quaternion).y).toBeGreaterThan(0);
        for (const corner of FLOOR_CORNERS) {
          const point = corner.clone().project(camera);
          expect(Math.abs(point.x)).toBeLessThan(1);
          expect(Math.abs(point.y)).toBeLessThan(1);
          expect(Math.abs(point.z)).toBeLessThan(1);
        }
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
