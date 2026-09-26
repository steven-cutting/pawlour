import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { AdditiveAnimationBlendMode, LoopOnce, LoopRepeat, Quaternion, Vector3 } from 'three';
import type { AnimationAction, Bone } from 'three';
import clips from '../src/lib/assets/biscuit.clips.json';
import { initialState } from '../src/lib/domain/director';
import type { SceneState } from '../src/lib/domain/director';
import { activityFor } from '../src/lib/domain/items';
import { createFakeFrames } from '../src/lib/ports/frame';
import { createFakeRandom } from '../src/lib/ports/random';
import { requireBiscuit } from '../src/routes/scene/biscuit';
import { requireCabin } from '../src/routes/scene/cabin';
import type { Cabin } from '../src/routes/scene/cabin';
import { createIdle } from '../src/routes/scene/idle';
import { CORE_CLIPS, createFrameLoop, createMotion } from '../src/routes/scene/motion';
import { createWalk, pathTo, walkingSpeed } from '../src/routes/scene/walk';
import { disposeObjects } from '../src/routes/scene/scene';
import { asset } from './helpers/scene';

const state = initialState('morning', 'clear', true);
let cabin: Cabin;
const cleanup: (() => void)[] = [];
beforeAll(async () => {
  cabin = requireCabin((await asset('src/lib/assets/cabin.glb')).scene);
});
afterEach(() => {
  for (const dispose of cleanup.splice(0)) dispose();
});
async function fixture() {
  const gltf = await asset('src/lib/assets/biscuit.glb');
  const biscuit = requireBiscuit(gltf, clips);
  const arrived = vi.fn();
  const motion = createMotion({
    biscuit,
    clips: gltf.animations,
    table: clips,
    cabin,
    onArrived: arrived
  });
  cleanup.push(() => {
    motion.dispose();
    biscuit.dispose();
    disposeObjects([biscuit.root]);
  });
  return { biscuit, motion, arrived, gltf };
}
function action(
  motion: Awaited<ReturnType<typeof fixture>>['motion'],
  name: string
): AnimationAction {
  const result = motion.actions.get(name);
  if (!result) throw new Error(`Missing test action ${name}`);
  return result;
}

describe('named playback on the real rig', () => {
  it('requires every core clip and obeys the exported loop table', async () => {
    const { biscuit, motion, gltf } = await fixture();
    expect([...motion.actions.keys()]).toEqual(CORE_CLIPS);
    for (const entry of clips.clips) {
      expect(action(motion, entry.name).loop).toBe(entry.loop ? LoopRepeat : LoopOnce);
      expect(action(motion, entry.name).clampWhenFinished).toBe(!entry.loop);
    }
    expect(() =>
      createMotion({
        biscuit,
        clips: gltf.animations.filter((clip) => clip.name !== 'drink'),
        table: clips,
        cabin,
        onArrived: vi.fn()
      })
    ).toThrow('missing clip drink');
  });

  it('crossfades for 250ms without restarting on caption, camera or elapsed updates', async () => {
    const { motion } = await fixture();
    motion.apply(state);
    motion.update(0.5);
    const idle = action(motion, 'idle.stand');
    motion.apply({
      ...state,
      elapsed: 0.5,
      camera: 'chair',
      caption: { text: 'Still here.', sequence: 1 }
    });
    expect(idle.time).toBeCloseTo(0.5);
    motion.apply({ ...state, activity: 'drink' });
    motion.update(0.125);
    expect(idle.getEffectiveWeight()).toBeCloseTo(0.5);
    expect(action(motion, 'drink').getEffectiveWeight()).toBeCloseTo(0.5);
    motion.update(0.125);
    expect(idle.getEffectiveWeight()).toBeCloseTo(0);
    expect(action(motion, 'drink').getEffectiveWeight()).toBeCloseTo(1);
  });

  it('holds one-shots, reverses lying then sitting on director time, and protects the sign', async () => {
    const { motion } = await fixture();
    motion.apply({ ...state, activity: 'sit' });
    motion.update(2);
    expect(action(motion, 'sit').time).toBe(action(motion, 'sit').getClip().duration);
    expect(action(motion, 'sit').paused).toBe(true);
    motion.apply({ ...state, activity: 'sleep' });
    motion.update(0.25);
    motion.apply({ ...state, activity: 'stand', standFrom: 'lying' });
    const lie = action(motion, 'lie');
    const start = lie.time;
    motion.update(0.1);
    expect(lie.time).toBeCloseTo(start - 0.1);
    expect(lie.getEffectiveTimeScale()).toBe(-1);
    motion.apply({ ...state, activity: 'stand', standFrom: 'lying', elapsed: 1.25 });
    const sit = action(motion, 'sit');
    expect(sit.time).toBeCloseTo(sit.getClip().duration - 0.05);
    motion.update(0.1);
    expect(sit.getEffectiveTimeScale()).toBe(-1);
    motion.apply({
      ...state,
      activity: 'walk',
      target: { item: 'toy', spot: 'item.toy.approach' }
    });
    motion.update(0.1);
    expect(action(motion, 'walk').getEffectiveTimeScale()).toBe(1);
    expect(sit.getEffectiveTimeScale()).toBe(-1);
    motion.reset();
    motion.apply({ ...state, activity: 'idle.sit' });
    motion.update(0.5);
    motion.apply({ ...state, activity: 'stand', standFrom: 'sitting' });
    motion.update(0.1);
    expect(sit.time).toBeCloseTo(sit.getClip().duration - 0.1);
    expect(lie.isRunning()).toBe(false);
  });

  it('pets additively over a continuously playing drink and resumes without resetting it', async () => {
    const { motion, gltf } = await fixture();
    motion.apply({ ...state, activity: 'drink' });
    motion.update(0.5);
    const drink = action(motion, 'drink');
    motion.apply({ ...state, activity: 'pet', resume: { activity: 'drink', elapsed: 0.5 } });
    motion.update(0.25);
    expect(drink.time).toBeCloseTo(0.75);
    expect(drink.getEffectiveWeight()).toBe(1);
    expect(action(motion, 'pet').blendMode).toBe(AdditiveAnimationBlendMode);
    expect(action(motion, 'pet').getEffectiveWeight()).toBe(1);
    expect(action(motion, 'sit').isRunning()).toBe(false);
    expect(gltf.animations.find((clip) => clip.name === 'pet')?.blendMode).not.toBe(
      AdditiveAnimationBlendMode
    );
    motion.update(1.75);
    // The clip has finished and its own fade-out is half way when the director resumes.
    motion.update(0.125);
    expect(action(motion, 'pet').getEffectiveWeight()).toBeCloseTo(0.5);
    const resumedAt = drink.time;
    motion.apply({ ...state, activity: 'drink', elapsed: 0.5 });
    expect(drink.time).toBe(resumedAt);
    motion.update(0.0625);
    expect(action(motion, 'pet').getEffectiveWeight()).toBeCloseTo(0.25);
    motion.update(0.1875);
    expect(drink.time).toBeCloseTo(resumedAt + 0.25);
    expect(action(motion, 'pet').getEffectiveWeight()).toBe(0);
  });
});

describe('the room waypoint graph', () => {
  it('uses the nearest endpoints and the exported stride once, turning before translating', async () => {
    const { biscuit } = await fixture();
    const speed = walkingSpeed(clips, biscuit.scale);
    expect(speed).toBeCloseTo(0.18276318243234008, 8);
    const path = pathTo(cabin, new Vector3(), 'spot.bed');
    expect(path.map((point) => point.toArray())).toEqual([
      cabin.nav.get('nav.0')?.node.getWorldPosition(new Vector3()).toArray(),
      cabin.nav.get('nav.1')?.node.getWorldPosition(new Vector3()).toArray(),
      cabin.spots.bed.getWorldPosition(new Vector3()).toArray()
    ]);
    const walk = createWalk(biscuit.root, cabin, speed);
    walk.apply('spot.bed');
    walk.update(0.05);
    expect(biscuit.root.position.length()).toBe(0);
    expect(biscuit.root.quaternion.angleTo(new Quaternion())).toBeCloseTo(Math.PI * 0.05);
    const direction = (path[1] as Vector3).clone().normalize();
    biscuit.root.quaternion.setFromAxisAngle(
      new Vector3(0, 1, 0),
      Math.atan2(direction.x, direction.z)
    );
    walk.update(0.05);
    expect(biscuit.root.position.length()).toBeCloseTo(speed * 0.05, 8);
  });

  for (const item of ['bed', 'chair', 'water', 'food', 'toy'] as const)
    it(`reaches ${item}, adopts its facing and reports one arrival`, async () => {
      const { biscuit, motion, arrived } = await fixture();
      const target = { item, spot: activityFor(item).spot };
      const walking: SceneState = { ...state, activity: 'walk', target };
      motion.apply(walking);
      for (let frame = 0; frame < 1200; frame += 1) {
        motion.apply({ ...walking, elapsed: frame / 20 });
        motion.update(0.05);
      }
      expect(arrived).toHaveBeenCalledTimes(1);
      const node = item === 'bed' || item === 'chair' ? cabin.spots[item] : cabin.approaches[item];
      expect(biscuit.root.position.distanceTo(node.getWorldPosition(new Vector3()))).toBeLessThan(
        1e-6
      );
      const expected = new Vector3(0, 0, -1).applyQuaternion(
        node.getWorldQuaternion(new Quaternion())
      );
      expect(
        new Vector3(0, 0, 1).applyQuaternion(biscuit.root.quaternion).distanceTo(expected)
      ).toBeLessThan(1e-6);
      expect(action(motion, 'walk').getEffectiveTimeScale()).toBe(1);
    });

  it('retargets a walk from its current position, and a light look does not restart it', async () => {
    const { biscuit, motion, arrived } = await fixture();
    motion.apply({ ...state, activity: 'walk', target: { item: 'bed', spot: 'spot.bed' } });
    for (let frame = 0; frame < 60; frame += 1) motion.update(0.05);
    const position = biscuit.root.position.clone();
    const next: SceneState = {
      ...state,
      activity: 'walk',
      target: { item: 'toy', spot: 'item.toy.approach' }
    };
    motion.apply(next);
    expect(biscuit.root.position.toArray()).toEqual(position.toArray());
    motion.apply({ ...next, lookAt: { item: 'lamp' }, lights: { lamp: false, strings: false } });
    for (let frame = 0; frame < 1200; frame += 1) motion.update(0.05);
    expect(arrived).toHaveBeenCalledTimes(1);
    expect(
      biscuit.root.position.distanceTo(cabin.approaches.toy.getWorldPosition(new Vector3()))
    ).toBeLessThan(1e-6);
  });

  it('turns into the destination facing before reporting arrival', async () => {
    const { biscuit } = await fixture();
    biscuit.root.position.copy(cabin.approaches.toy.getWorldPosition(new Vector3()));
    const walk = createWalk(biscuit.root, cabin, walkingSpeed(clips, biscuit.scale));
    walk.apply('item.toy.approach');
    expect(walk.update(0.05)).toBe(false);
    expect(biscuit.root.quaternion.angleTo(new Quaternion())).toBeCloseTo(Math.PI * 0.05);
    for (let frame = 0; frame < 20; frame += 1) walk.update(0.05);
    expect(walk.update(0)).toBe(true);
  });
});

describe('the procedural layer and frame lifetime', () => {
  it('adds the specified breath and tail, removes offsets before the next pose, and quiets sleep', async () => {
    const { biscuit } = await fixture();
    const idle = createIdle(biscuit, cabin, createFakeRandom());
    const chest = biscuit.bones.get('chest') as Bone;
    const tail = biscuit.bones.get('tail.1') as Bone;
    const ear = biscuit.bones.get('ear.1.L') as Bone;
    const scale = chest.scale.clone();
    const tailPose = tail.quaternion.clone();
    const earPose = ear.quaternion.clone();
    idle.update(state, 0.625);
    expect(tail.quaternion.angleTo(tailPose)).toBeCloseTo((8 * Math.PI) / 180);
    idle.clear();
    idle.update(state, 0.375);
    expect(chest.scale.x / scale.x).toBeCloseTo(1.015);
    idle.clear();
    idle.update(state, 5);
    idle.clear();
    idle.update(state, 0.12);
    expect(ear.quaternion.angleTo(earPose)).toBeCloseTo((12 * Math.PI) / 180);
    idle.clear();
    idle.update({ ...state, activity: 'sleep' }, 0.01);
    expect(tail.quaternion.toArray()).toEqual(tailPose.toArray());
    expect(ear.quaternion.toArray()).toEqual(earPose.toArray());
    for (let frame = 0; frame < 1000; frame += 1) {
      idle.clear();
      idle.update(state, 0.05);
    }
    idle.clear();
    expect(chest.scale.toArray()).toEqual(scale.toArray());
    expect(tail.quaternion.toArray()).toEqual(tailPose.toArray());
  });

  it('splits a clamped local head turn across neck and head, then eases back', async () => {
    const { biscuit } = await fixture();
    const idle = createIdle(biscuit, cabin, createFakeRandom());
    const head = biscuit.bones.get('head') as Bone;
    const neck = biscuit.bones.get('neck') as Bone;
    const headPose = head.quaternion.clone();
    const neckPose = neck.quaternion.clone();
    idle.update({ ...state, lookAt: { x: 5, z: 0 } }, 0.4);
    expect(head.quaternion.angleTo(headPose)).toBeCloseTo((20 * Math.PI) / 180);
    expect(neck.quaternion.angleTo(neckPose)).toBeCloseTo((20 * Math.PI) / 180);
    idle.clear();
    biscuit.root.rotation.y = Math.PI / 2;
    idle.update({ ...state, lookAt: { x: 5, z: 0 } }, 0.05);
    expect(head.quaternion.angleTo(headPose)).toBeCloseTo(0);
    expect(neck.quaternion.angleTo(neckPose)).toBeCloseTo(0);
    idle.clear();
    idle.update(state, 0.4);
    expect(head.quaternion.angleTo(headPose)).toBeCloseTo(0);
    expect(neck.quaternion.angleTo(neckPose)).toBeCloseTo(0);
    idle.clear();
  });

  it('subscribes once, clamps long gaps, stops immediately, restarts without catch-up and stops on failure', () => {
    const frames = createFakeFrames();
    const each = vi.spyOn(frames, 'each');
    const tick = vi.fn();
    const failed = vi.fn();
    const loop = createFrameLoop(frames, tick, failed);
    frames.step(500);
    expect(each).not.toHaveBeenCalled();
    expect(loop.running).toBe(false);
    loop.start();
    loop.start();
    expect(each).toHaveBeenCalledTimes(1);
    expect(loop.running).toBe(true);
    frames.step(1000);
    frames.step(1100);
    frames.step(1116);
    expect(tick.mock.calls).toEqual([[0], [0.05], [0.016]]);
    loop.stop();
    expect(loop.running).toBe(false);
    frames.step(5000);
    expect(tick).toHaveBeenCalledTimes(3);
    loop.start();
    frames.step(6000);
    expect(tick).toHaveBeenLastCalledWith(0);
    tick.mockImplementationOnce(() => {
      throw new Error('draw failed');
    });
    frames.step(6016);
    expect(failed).toHaveBeenCalledOnce();
    frames.step(6032);
    expect(tick).toHaveBeenCalledTimes(5);
  });
});
