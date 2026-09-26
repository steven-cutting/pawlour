import {
  AdditiveAnimationBlendMode,
  AnimationMixer,
  AnimationUtils,
  LoopOnce,
  LoopRepeat
} from 'three';
import type { AnimationAction, AnimationClip } from 'three';
import type { SceneState } from '$lib/domain/director';
import type { FramePort } from '$lib/ports/frame';
import { TRANSITION } from '$lib/domain/timing';
import type { Biscuit, ClipTable } from './biscuit';
import type { Cabin } from './cabin';
import { createWalk, walkingSpeed } from './walk';

export const CORE_CLIPS = [
  'idle.stand',
  'idle.sit',
  'walk',
  'sit',
  'lie',
  'sleep',
  'drink',
  'eat',
  'play',
  'pet'
] as const;
const FADE = 0.25;

export function createMotion({
  biscuit,
  clips,
  table,
  cabin,
  onArrived
}: {
  biscuit: Biscuit;
  clips: readonly AnimationClip[];
  table: ClipTable;
  cabin: Cabin;
  onArrived: () => void;
}) {
  const mixer = new AnimationMixer(biscuit.model);
  const actions = new Map<string, AnimationAction>();
  for (const name of CORE_CLIPS) {
    const clip = clips.find((candidate) => candidate.name === name);
    const entry = table.clips.find((candidate) => candidate.name === name);
    if (!clip) throw new Error(`biscuit.glb is missing clip ${name}`);
    if (!entry) throw new Error(`biscuit.clips.json is missing ${name}`);
    const action = mixer.clipAction(
      name === 'pet' ? AnimationUtils.makeClipAdditive(clip.clone()) : clip
    );
    action.setLoop(entry.loop ? LoopRepeat : LoopOnce, entry.loop ? Infinity : 1);
    action.clampWhenFinished = !entry.loop;
    if (name === 'pet') action.blendMode = AdditiveAnimationBlendMode;
    actions.set(name, action);
  }
  const actionFor = (name: string): AnimationAction => {
    const action = actions.get(name);
    if (!action) throw new Error(`No action for ${name}`);
    return action;
  };
  const walker = createWalk(biscuit.root, cabin, walkingSpeed(table, biscuit.scale));
  let state: SceneState | undefined;
  let current: AnimationAction | undefined;
  let key = '';
  let petting = false;
  let arrived = false;
  let target: string | undefined;
  const pet = actionFor('pet');
  const finished = (event: { action: AnimationAction }): void => {
    if (event.action === pet) pet.fadeOut(FADE);
  };
  mixer.addEventListener('finished', finished);
  const reset = (): void => {
    mixer.stopAllAction();
    current = undefined;
    state = undefined;
    key = '';
    petting = false;
    arrived = false;
    target = undefined;
    walker.apply(undefined);
  };
  return {
    mixer,
    actions: actions as ReadonlyMap<string, AnimationAction>,
    reset,
    apply(next: SceneState) {
      const previous = state;
      state = next;
      const activity =
        next.activity === 'pet' ? (next.resume?.activity ?? 'idle.stand') : next.activity;
      const elapsed = next.activity === 'pet' ? (next.resume?.elapsed ?? 0) : next.elapsed;
      const reverse = activity === 'stand';
      const lying =
        next.standFrom === 'lying' ||
        (!next.standFrom && (previous?.activity === 'sleep' || previous?.activity === 'lie'));
      const name = reverse ? (lying && elapsed < TRANSITION.lie ? 'lie' : 'sit') : activity;
      const nextKey = `${name}:${reverse ? 'reverse' : 'forward'}`;
      if (nextKey !== key) {
        const action = actionFor(name);
        action
          .reset()
          .setEffectiveWeight(1)
          .setEffectiveTimeScale(reverse ? -1 : 1)
          .play();
        if (reverse) {
          const offset = name === 'sit' && lying ? TRANSITION.lie : 0;
          action.time = Math.max(0, action.getClip().duration - Math.max(0, elapsed - offset));
        } else if (!current) {
          action.time =
            action.loop === LoopRepeat
              ? elapsed % action.getClip().duration
              : Math.min(elapsed, action.getClip().duration);
        }
        if (current && current !== action) {
          // Warping changes walk speed and overwrites a reverse action's sign.
          const warp =
            !reverse &&
            !key.endsWith(':reverse') &&
            name !== 'walk' &&
            current.getClip().name !== 'walk';
          current.crossFadeTo(action, FADE, warp);
        }
        current = action;
        key = nextKey;
      }
      if (next.activity === 'pet' && !petting)
        pet.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).fadeIn(FADE).play();
      // fadeOut always restarts from full weight: once the clip has finished and
      // its own fade is under way, a second call would snap the lean back up.
      else if (next.activity !== 'pet' && petting && pet.isRunning()) pet.fadeOut(FADE);
      petting = next.activity === 'pet';
      const nextTarget = activity === 'walk' ? next.target?.spot : undefined;
      if (nextTarget !== target) {
        arrived = false;
        target = nextTarget;
        walker.apply(target);
      }
    },
    update(dt: number) {
      mixer.update(dt);
      if (state?.activity === 'walk' && !arrived && walker.update(dt)) {
        arrived = true;
        onArrived();
      }
    },
    dispose() {
      reset();
      mixer.removeEventListener('finished', finished);
      mixer.uncacheRoot(biscuit.model);
    }
  };
}

/** One subscription; no wall-clock catch-up after a pause or a hidden tab. */
export function createFrameLoop(
  frames: FramePort,
  tick: (dt: number) => void,
  onError: (error: unknown) => void
) {
  let unsubscribe: (() => void) | undefined;
  const stop = (): void => {
    unsubscribe?.();
    unsubscribe = undefined;
  };
  return {
    stop,
    get running() {
      return unsubscribe !== undefined;
    },
    start() {
      if (unsubscribe) return;
      let previous: number | undefined;
      unsubscribe = frames.each((now) => {
        const dt =
          previous === undefined ? 0 : Math.min(0.05, Math.max(0, (now - previous) / 1000));
        previous = now;
        try {
          tick(dt);
        } catch (error) {
          stop();
          onError(error);
        }
      });
    }
  };
}
