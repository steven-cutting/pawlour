/**
 * The director: what Biscuit does about a tap, and about time passing.
 *
 * A pure reducer. The page hands it every command, from a control, from the
 * picture of the room, from the timer every `TICK_MS` and from the clock every
 * minute, and draws whatever state it returns. The rules are `cabin.allium`'s:
 * `ATapIsAnInvitation` (a tap asks, and she answers once whatever she has
 * settled into has had its minimum; a tap on her is a reaction that hands her
 * back), `ACaptionIsShownAndAnnounced` (one sentence once she has settled, or
 * after a long idle, and never the same one twice), `TimeFollowsTheClockUntilOverridden`,
 * `MotionOffIsAStillDiorama` and `TheCameraFollowsHerUntilPinned`. The figures
 * are `timing.ts`'s, and the part of the room each camera owns is `zones.ts`'s.
 *
 * The runtime plays whatever `activity` says and sequences nothing itself: it
 * reports `arrived` when a walk reaches `target`, because distances are the
 * room's and not the director's. While motion is off nothing walks, so no
 * `arrived` comes: after every command the director resolves anything in
 * motion to where it leads, the way `motionChanged(false)` does, and the still
 * shows her there. On a walk it also reports `reached` at each place she
 * passes, which is how the camera follows her into another part of the room.
 *
 * Randomness goes through `deps.random` in a fixed order, so a test's fake
 * says which candidate comes next: a caption draws once when there is a
 * sentence left to draw; an idle stretch draws its interval when it begins;
 * and her own choice draws the thing, then the next interval.
 */
import type { RandomPort } from '../ports/random';
import { chooseCaption } from './captions';
import { activityFor, isWalkItem, lightFor } from './items';
import type { Item, Plan, Settled, WalkItem } from './items';
import { fireLevel, idleWeights } from './phases';
import type { Phase } from './phases';
import {
  DURATION,
  IDLE_FACTOR,
  IDLE_INTERVAL,
  IDLE_LONG,
  MINIMUM_ACTIVITY,
  SLEEP,
  TRANSITION
} from './timing';
import type { Weather } from './weather';
import { zoneOf } from './zones';
import type { Camera } from './zones';

export type { Camera } from './zones';

export type Activity =
  | 'idle.stand'
  | 'idle.sit'
  | 'walk'
  | 'sit'
  | 'lie'
  | 'stand'
  | 'sleep'
  | 'drink'
  | 'eat'
  | 'play'
  | 'pet';
export interface Point {
  x: number;
  z: number;
}
export interface Target {
  spot: string;
  item: Item | 'floor';
}
export interface SceneState {
  activity: Activity;
  at: Item | 'floor';
  target?: Target;
  lookAt?: Point | { item: Item }; // a floor point, or an item the runtime resolves
  phase: Phase;
  phaseOverride?: Phase;
  weather: Weather;
  lights: { lamp: boolean; strings: boolean };
  fire: number;
  camera: Camera; // the preset shown
  cameraOverride?: Camera; // the preset the player pinned, if any
  passed: string; // the last place she passed or settled at, which Auto follows
  sound: boolean;
  caption?: { text: string; sequence: number };
  motion: boolean;
  elapsed: number; // seconds in the current activity
  resume?: { activity: Activity; elapsed: number }; // what a pet interrupted
  standFrom?: 'lying' | 'sitting'; // what `stand` reverses; set on entering it
  untilIdleChoice: number; // seconds until she chooses for herself
  shown: readonly string[]; // captions shown this visit
}
export type Command =
  | { kind: 'tap'; item: Item }
  | { kind: 'tapBiscuit' }
  | { kind: 'tapFloor'; point: Point }
  | { kind: 'tick'; ms: number }
  | { kind: 'arrived' }
  | { kind: 'reached'; node: string }
  | { kind: 'setPhase'; phase: Phase | 'auto' }
  | { kind: 'clockPhase'; phase: Phase }
  | { kind: 'setWeather'; weather: Weather }
  | { kind: 'toggleLight'; light: 'lamp' | 'strings' }
  | { kind: 'setSound'; on: boolean }
  | { kind: 'setCamera'; camera: Camera | 'auto' }
  | { kind: 'motionChanged'; active: boolean };
export interface Deps {
  random: RandomPort;
}

type Resume = NonNullable<SceneState['resume']>;

/** Whole seconds she may idle before choosing, before the phase scales them. */
const INTERVALS: readonly number[] = Array.from(
  { length: IDLE_INTERVAL.max - IDLE_INTERVAL.min + 1 },
  (_, index) => IDLE_INTERVAL.min + index
);

/** What she is getting up from, for the activities she answers a tap from by standing. */
const RISING: Partial<Record<Activity, 'lying' | 'sitting'>> = {
  sleep: 'lying',
  'idle.sit': 'sitting'
};

export function initialState(phase: Phase, weather: Weather, motion: boolean): SceneState {
  return {
    activity: 'idle.stand',
    at: 'floor',
    phase,
    weather,
    lights: lightsFor(phase),
    fire: fireLevel(phase),
    camera: 'hearth',
    // She opens standing at nav.0, so a visit that never walked follows the hearth.
    passed: 'nav.0',
    sound: false,
    motion,
    elapsed: 0,
    // Nothing has drawn an interval yet and there is no random port here, so she waits the longest.
    untilIdleChoice: scaled(IDLE_INTERVAL.max, phase),
    shown: []
  };
}

export function step(state: SceneState, command: Command, deps: Deps): SceneState {
  const next = apply(state, command, deps);
  return next.motion ? next : still(next, deps);
}

function apply(state: SceneState, command: Command, deps: Deps): SceneState {
  switch (command.kind) {
    case 'tap':
      return tap(state, command.item, deps);
    case 'tapBiscuit':
      return tapBiscuit(state, deps);
    case 'tapFloor':
      return { ...state, lookAt: command.point };
    case 'tick':
      return proceed(advance(state, command.ms / 1_000, deps), deps);
    case 'arrived':
      // A report that lands after motion went off finds her already there, and changes nothing.
      return state.activity === 'walk' ? arrive(state, heading(state), deps) : state;
    case 'reached':
      // Like `arrived`, a report that lands once she has stopped walking changes nothing.
      return state.activity === 'walk' ? follow(state, command.node) : state;
    case 'setPhase':
      return command.phase === 'auto'
        ? { ...state, phaseOverride: undefined }
        : { ...changePhase(state, command.phase), phaseOverride: command.phase };
    case 'clockPhase':
      return state.phaseOverride === undefined ? changePhase(state, command.phase) : state;
    case 'setWeather':
      return { ...state, weather: command.weather };
    case 'toggleLight':
      return toggle(state, command.light);
    case 'setSound':
      return { ...state, sound: command.on };
    case 'setCamera':
      return command.camera === 'auto'
        ? follow({ ...state, cameraOverride: undefined }, state.passed)
        : { ...state, camera: command.camera, cameraOverride: command.camera };
    case 'motionChanged':
      return { ...state, motion: command.active };
  }
}

// ---------------------------------------------------------------- taps ---

function tap(state: SceneState, item: Item, deps: Deps): SceneState {
  if (!isWalkItem(item)) {
    return { ...toggle(state, lightFor(item)), lookAt: { item } };
  }
  if (isUsing(state, item) || state.target?.item === item) {
    return state;
  }
  return proceed({ ...state, target: { spot: activityFor(item).spot, item } }, deps);
}

/**
 * Whether she is at a thing and doing what it is for, or on her way down to
 * it. Under a pet, what counts is what the pet interrupted. Idling beside a
 * thing is not using it: a tap there sets her doing it again.
 */
function isUsing(state: SceneState, item: WalkItem): boolean {
  const plan = activityFor(item);
  const doing = state.activity === 'pet' ? interrupted(state).activity : state.activity;
  return (
    state.at === item &&
    (doing === plan.activity || plan.transitions.some((transition) => transition === doing))
  );
}

function tapBiscuit(state: SceneState, deps: Deps): SceneState {
  switch (state.activity) {
    case 'idle.stand':
    case 'idle.sit':
    case 'drink':
    case 'eat':
    case 'play': {
      const petted: SceneState = {
        ...state,
        activity: 'pet',
        elapsed: 0,
        resume: { activity: state.activity, elapsed: state.elapsed },
        lookAt: undefined
      };
      return say(petted, 'pet', deps);
    }
    case 'sleep':
      // Asleep, a tap on her wakes her as a tap on a thing would; inside the minimum it has nowhere to wait.
      return ready(state) ? stand(state, 'lying') : state;
    case 'walk':
    case 'sit':
    case 'lie':
    case 'stand':
    case 'pet':
      return state;
  }
}

/** Answers a waiting tap, if whatever she is doing has had its time. */
function proceed(state: SceneState, deps: Deps): SceneState {
  return state.target !== undefined && ready(state) ? go(state, state.target, deps) : state;
}

/** Whether a tap would be answered now: at once when idle, after the minimum when settled. */
function ready(state: SceneState): boolean {
  switch (state.activity) {
    case 'idle.stand':
    case 'idle.sit':
      return true;
    case 'drink':
    case 'eat':
    case 'play':
    case 'sleep':
      return state.elapsed >= MINIMUM_ACTIVITY;
    case 'walk':
    case 'sit':
    case 'lie':
    case 'stand':
    case 'pet':
      return false;
  }
}

function go(state: SceneState, target: Target, deps: Deps): SceneState {
  const from = RISING[state.activity];
  return from === undefined ? setOff(state, target, deps) : stand(state, from);
}

/** Walks her to the target, or, when she is already at it, starts on it where she is. */
function setOff(state: SceneState, target: Target, deps: Deps): SceneState {
  return target.item === state.at
    ? arrive(state, target, deps)
    : { ...state, activity: 'walk', elapsed: 0, caption: undefined };
}

// ---------------------------------------------------------- activities ---

function arrive(state: SceneState, target: Target, deps: Deps): SceneState {
  const there: SceneState = follow(
    { ...state, at: target.item, target: undefined, elapsed: 0, caption: undefined },
    target.spot
  );
  const plan = planAt(target.item);
  if (plan === undefined) {
    return idle(there, 'idle.stand', deps);
  }
  const first = plan.transitions[0];
  return first === undefined ? settle(there, plan, deps) : { ...there, activity: first };
}

/**
 * The end of `sit` or `lie`. At the bed or the chair each leads to the next
 * transition and then to sleep, whoever started it: sitting down there is the
 * first step of lying down in it. Anywhere else, a sit leads to sitting idle.
 */
function afterTransition(state: SceneState, deps: Deps): SceneState {
  const plan = planAt(state.at);
  const index = plan ? plan.transitions.findIndex((each) => each === state.activity) : -1;
  if (plan === undefined || index === -1) {
    return idle(state, 'idle.sit', deps);
  }
  const following = plan.transitions[index + 1];
  return following === undefined
    ? settle(state, plan, deps)
    : { ...state, activity: following, elapsed: 0 };
}

function stand(state: SceneState, from: 'lying' | 'sitting'): SceneState {
  return { ...state, activity: 'stand', standFrom: from, elapsed: 0, caption: undefined };
}

function standLength(state: SceneState): number {
  return state.standFrom === 'lying' ? TRANSITION.lie + TRANSITION.sit : TRANSITION.sit;
}

function afterStand(state: SceneState, deps: Deps): SceneState {
  const up: SceneState = { ...state, standFrom: undefined };
  return state.target === undefined ? idle(up, 'idle.stand', deps) : setOff(up, state.target, deps);
}

function settle(state: SceneState, plan: Plan, deps: Deps): SceneState {
  return say({ ...state, activity: plan.activity, elapsed: 0 }, plan.settled, deps);
}

/** A new idle stretch, with its own interval before she chooses for herself. */
function idle(state: SceneState, activity: 'idle.stand' | 'idle.sit', deps: Deps): SceneState {
  return { ...state, activity, elapsed: 0, untilIdleChoice: interval(state.phase, deps) };
}

/** Back to what a pet interrupted, exactly as it was: not settled into again, so nothing is said. */
function restore(state: SceneState): SceneState {
  const { activity, elapsed } = interrupted(state);
  return { ...state, activity, elapsed, resume: undefined };
}

// ---------------------------------------------------------------- time ---

function advance(state: SceneState, seconds: number, deps: Deps): SceneState {
  const elapsed = state.elapsed + seconds;
  const moved: SceneState = { ...state, elapsed };
  switch (state.activity) {
    case 'idle.stand':
    case 'idle.sit':
      return idling(state, seconds, deps);
    case 'walk':
      return moved;
    case 'sit':
    case 'lie':
      return elapsed >= TRANSITION[state.activity] ? afterTransition(moved, deps) : moved;
    case 'stand':
      return elapsed >= standLength(state) ? afterStand(moved, deps) : moved;
    case 'sleep':
      return elapsed >= SLEEP[state.phase] ? stand(moved, 'lying') : moved;
    case 'drink':
    case 'eat':
    case 'play':
      return elapsed >= DURATION[state.activity]
        ? idle({ ...moved, caption: undefined }, 'idle.stand', deps)
        : moved;
    case 'pet':
      return elapsed >= DURATION.pet ? restore(moved) : moved;
  }
}

/**
 * An idle tick. When the interval runs out she chooses; otherwise, the tick
 * that carries the stretch past the long-idle mark says so, once, because
 * `elapsed` only crosses it once a stretch. A choice on the same tick wins.
 */
function idling(state: SceneState, seconds: number, deps: Deps): SceneState {
  const moved: SceneState = {
    ...state,
    elapsed: state.elapsed + seconds,
    untilIdleChoice: state.untilIdleChoice - seconds
  };
  if (moved.untilIdleChoice <= 0) {
    return choose(moved, deps);
  }
  const long = scaled(IDLE_LONG, state.phase);
  return state.elapsed < long && moved.elapsed >= long ? say(moved, 'idle.long', deps) : moved;
}

/** Her own choice, weighted by the phase: a thing is taken as a tap on it; a sit, where she is. */
function choose(state: SceneState, deps: Deps): SceneState {
  const choice = deps.random.uniformChoice(idleWeights(state.phase));
  const reset: SceneState = { ...state, untilIdleChoice: interval(state.phase, deps) };
  if (choice !== 'sit') {
    return tap(reset, choice, deps);
  }
  return state.activity === 'idle.stand' ? { ...reset, activity: 'sit', elapsed: 0 } : reset;
}

function interval(phase: Phase, deps: Deps): number {
  return scaled(deps.random.uniformChoice(INTERVALS), phase);
}

/** Seconds scaled by the phase, to the millisecond, so a tick lands on them exactly. */
function scaled(seconds: number, phase: Phase): number {
  return Math.round(seconds * IDLE_FACTOR[phase] * 1_000) / 1_000;
}

// --------------------------------------------------------------- still ---

/**
 * Motion off: nothing she does may be in motion, so each movement resolves to
 * where it leads. A walk arrives, a transition finishes, a stand gets her up
 * and off, and a pet hands her straight back, keeping its words, because
 * there is no still of a pet.
 */
function still(state: SceneState, deps: Deps): SceneState {
  switch (state.activity) {
    case 'walk':
      return still(arrive(state, heading(state), deps), deps);
    case 'sit':
    case 'lie':
      return still(afterTransition(state, deps), deps);
    case 'stand':
      return still(afterStand(state, deps), deps);
    case 'pet':
      return still(proceed(restore(state), deps), deps);
    case 'idle.stand':
    case 'idle.sit':
    case 'sleep':
    case 'drink':
    case 'eat':
    case 'play':
      return state;
  }
}

// -------------------------------------------------------------- camera ---

/**
 * She is at `node`: record it, and unless the player has pinned a preset, cut
 * to the one whose part of the room it is. Only a walk moves her, so only a
 * `reached`, an arrival and the player handing the choice back come here; a
 * name the room's map does not know changes nothing.
 */
function follow(state: SceneState, node: string): SceneState {
  const zone = zoneOf(node);
  return zone === undefined
    ? state
    : { ...state, passed: node, camera: state.cameraOverride ?? zone };
}

// -------------------------------------------------------------- phases ---

function changePhase(state: SceneState, phase: Phase): SceneState {
  return phase === state.phase
    ? state
    : { ...state, phase, lights: lightsFor(phase), fire: fireLevel(phase) };
}

/** The practical lights a phase turns on: the lamp by evening and night, the strings by night. */
function lightsFor(phase: Phase): SceneState['lights'] {
  return { lamp: phase !== 'morning', strings: phase === 'night' };
}

function toggle(state: SceneState, light: 'lamp' | 'strings'): SceneState {
  return { ...state, lights: { ...state.lights, [light]: !state.lights[light] } };
}

// ------------------------------------------------------------- helpers ---

function planAt(at: Item | 'floor'): Plan | undefined {
  return isWalkItem(at) ? activityFor(at) : undefined;
}

function say(state: SceneState, key: Settled, deps: Deps): SceneState {
  const text = chooseCaption(key, state.shown, deps.random);
  return text === undefined
    ? state
    : {
        ...state,
        caption: { text, sequence: state.shown.length + 1 },
        shown: [...state.shown, text]
      };
}

/*
 * Two invariants the state carries rather than the type: `walk` always has a
 * `target` (a tap sets it before she sets off, and arriving clears both), and
 * `pet` always has a `resume` (entering it records one, and leaving clears
 * it). The assertions state them instead of adding a branch no state reaches.
 */
function heading(state: SceneState): Target {
  return state.target as Target;
}

function interrupted(state: SceneState): Resume {
  return state.resume as Resume;
}
