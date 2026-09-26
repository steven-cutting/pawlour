import { beforeEach, describe, expect, it } from 'vitest';

import { CAPTIONS } from '../src/lib/data/captions';
import { initialState, step } from '../src/lib/domain/director';
import type { Command, Deps, SceneState } from '../src/lib/domain/director';
import { activityFor, isWalkItem, lightFor } from '../src/lib/domain/items';
import type { Item } from '../src/lib/domain/items';
import type { Phase } from '../src/lib/domain/phases';
import {
  DURATION,
  IDLE_FACTOR,
  IDLE_LONG,
  MINIMUM_ACTIVITY,
  SLEEP,
  TICK_MS,
  TRANSITION
} from '../src/lib/domain/timing';
import { createFakeRandom } from '../src/lib/ports/random';

/*
 * The director is written from cabin.allium's clauses, one `describe` each,
 * and each test's title is the plain sentence it holds. Every draw goes through
 * the fake random port, whose offsets say which candidate comes next; with the
 * default single `0` every draw takes the first: the first unshown caption, the
 * shortest idle interval, and the first entry of the phase's preferences.
 */

const PHASES: readonly Phase[] = ['morning', 'evening', 'night'];

let deps: Deps;

beforeEach(() => {
  deps = { random: createFakeRandom() };
});

/** The draws the rest of the test takes, in order, cycling when they run out. */
function draws(...offsets: number[]): void {
  deps = { random: createFakeRandom(offsets) };
}

function run(state: SceneState, ...commands: readonly Command[]): SceneState {
  return commands.reduce((current, command) => step(current, command, deps), state);
}

const tick: Command = { kind: 'tick', ms: TICK_MS };

/** The ticks that make up a stretch of time, a quarter second apiece. */
function seconds(count: number): Command[] {
  return Array.from({ length: Math.round((count * 1_000) / TICK_MS) }, () => tick);
}
const pet: Command = { kind: 'tapBiscuit' };
const arrived: Command = { kind: 'arrived' };
const motionOff: Command = { kind: 'motionChanged', active: false };
const motionOn: Command = { kind: 'motionChanged', active: true };

function tap(item: Item): Command {
  return { kind: 'tap', item };
}

function clock(phase: Phase): Command {
  return { kind: 'clockPhase', phase };
}

function room(phase: Phase = 'evening', motion = true): SceneState {
  return initialState(phase, 'clear', motion);
}

/** At the water, drinking, `elapsed` seconds in. */
function drinking(elapsed = 0): SceneState {
  return run(room(), tap('water'), arrived, ...seconds(elapsed));
}

/** Asleep in the bed, `elapsed` seconds in: arrived, sat, lay down and settled. */
function asleep(elapsed = 0, phase: Phase = 'evening'): SceneState {
  return run(room(phase), tap('bed'), arrived, ...seconds(2.25), ...seconds(elapsed));
}

function sitting(phase: Phase = 'evening'): SceneState {
  return { ...room(phase), activity: 'idle.sit' };
}

describe('the things in the room', () => {
  it('sends her to lie down on the bed and the chair, and straight to the bowls and the toy', () => {
    expect(activityFor('bed')).toEqual({
      transitions: ['sit', 'lie'],
      activity: 'sleep',
      settled: 'sleep.bed',
      spot: 'spot.bed'
    });
    expect(activityFor('chair')).toEqual({
      transitions: ['sit', 'lie'],
      activity: 'sleep',
      settled: 'sleep.chair',
      spot: 'spot.chair'
    });
    expect(activityFor('water')).toEqual({
      transitions: [],
      activity: 'drink',
      settled: 'drink',
      spot: 'item.water.approach'
    });
    expect(activityFor('food')).toEqual({
      transitions: [],
      activity: 'eat',
      settled: 'eat',
      spot: 'item.food.approach'
    });
    expect(activityFor('toy')).toEqual({
      transitions: [],
      activity: 'play',
      settled: 'play',
      spot: 'item.toy.approach'
    });
  });

  it('toggles the lamp and the string lights rather than sending her anywhere', () => {
    expect(lightFor('lamp')).toBe('lamp');
    expect(lightFor('lights')).toBe('strings');
    expect(isWalkItem('lamp')).toBe(false);
    expect(isWalkItem('lights')).toBe(false);
    expect(isWalkItem('floor')).toBe(false);
    expect(isWalkItem('bed')).toBe(true);
  });
});

describe('the room when it opens', () => {
  it('has her standing idle on bare floor, with sound off and the hearth camera', () => {
    expect(initialState('evening', 'rain', true)).toEqual({
      activity: 'idle.stand',
      at: 'floor',
      phase: 'evening',
      weather: 'rain',
      lights: { lamp: true, strings: false },
      fire: 0.7,
      camera: 'hearth',
      sound: false,
      motion: true,
      elapsed: 0,
      untilIdleChoice: 40,
      shown: []
    });
  });

  it('has her wait the longest interval before she first chooses for herself', () => {
    expect(room('morning').untilIdleChoice).toBe(28);
    expect(room('evening').untilIdleChoice).toBe(40);
    expect(room('night').untilIdleChoice).toBe(60);
  });
});

describe('ATapIsAnInvitation', () => {
  it('A tap on a thing sends her walking to it when she is idle', () => {
    const state = run(room(), tap('water'));

    expect(state.activity).toBe('walk');
    expect(state.target).toEqual({ spot: 'item.water.approach', item: 'water' });
    expect(state.at).toBe('floor');
  });

  it('She walks until the room says she has arrived, then does the thing', () => {
    const walking = run(room(), tap('water'), ...seconds(3));

    expect(walking.activity).toBe('walk');

    const there = step(walking, arrived, deps);

    expect(there.activity).toBe('drink');
    expect(there.at).toBe('water');
    expect(there.target).toBeUndefined();
    expect(there.elapsed).toBe(0);
  });

  it('Arriving at the bed she sits, lies down and sleeps, each for its clip', () => {
    const there = run(room(), tap('bed'), arrived);

    expect(there.activity).toBe('sit');
    expect(there.at).toBe('bed');
    expect(run(there, ...seconds(TRANSITION.sit - 0.25)).activity).toBe('sit');
    expect(run(there, ...seconds(TRANSITION.sit)).activity).toBe('lie');
    expect(run(there, ...seconds(TRANSITION.sit + 1)).activity).toBe('lie');
    expect(run(there, ...seconds(TRANSITION.sit + 1.25)).activity).toBe('sleep');
  });

  it('The chair takes the same clips, on the chair', () => {
    const walking = run(room(), tap('chair'));

    expect(walking.target).toEqual({ spot: 'spot.chair', item: 'chair' });

    const settled = run(walking, arrived, ...seconds(2.25));

    expect(settled.activity).toBe('sleep');
    expect(settled.at).toBe('chair');
  });

  it('A tap before the minimum waits, and is answered once the minimum has passed', () => {
    const asked = run(drinking(), tap('food'));

    expect(asked.activity).toBe('drink');
    expect(asked.target).toEqual({ spot: 'item.food.approach', item: 'food' });
    expect(run(asked, ...seconds(MINIMUM_ACTIVITY - 0.25)).activity).toBe('drink');

    const answered = run(asked, ...seconds(MINIMUM_ACTIVITY));

    expect(answered.activity).toBe('walk');
    expect(answered.target?.item).toBe('food');
  });

  it('A tap after the minimum is answered at once', () => {
    const state = run(drinking(MINIMUM_ACTIVITY), tap('food'));

    expect(state.activity).toBe('walk');
    expect(state.target?.item).toBe('food');
  });

  it('A later tap replaces a waiting one, so the last tap wins', () => {
    const asked = run(drinking(), tap('food'), tap('toy'));

    expect(asked.target?.item).toBe('toy');
    expect(run(asked, ...seconds(MINIMUM_ACTIVITY)).target?.item).toBe('toy');
  });

  it('A tap while she walks sends her somewhere else instead', () => {
    const state = run(room(), tap('water'), tap('food'));

    expect(state.activity).toBe('walk');
    expect(state.target).toEqual({ spot: 'item.food.approach', item: 'food' });
  });

  it('A tap on the way down waits through the transitions and the minimum', () => {
    const asked = run(room(), tap('bed'), arrived, tap('water'));

    expect(asked.activity).toBe('sit');
    expect(asked.target?.item).toBe('water');

    const settled = run(asked, ...seconds(2.25));

    expect(settled.activity).toBe('sleep');
    expect(settled.target?.item).toBe('water');
    expect(run(settled, ...seconds(MINIMUM_ACTIVITY - 0.25)).activity).toBe('sleep');
    expect(run(settled, ...seconds(MINIMUM_ACTIVITY)).activity).toBe('stand');
  });

  it('A tap on the thing she is using changes nothing', () => {
    const drinks = drinking(1);
    const sleeps = asleep(10);
    const liesDown = run(room(), tap('bed'), arrived, ...seconds(1));

    expect(liesDown.activity).toBe('lie');
    expect(step(drinks, tap('water'), deps)).toBe(drinks);
    expect(step(sleeps, tap('bed'), deps)).toBe(sleeps);
    expect(step(liesDown, tap('bed'), deps)).toBe(liesDown);
  });

  it('A tap on the thing she is on her way to changes nothing', () => {
    const walking = run(room(), tap('water'));
    const standing = run(sitting(), tap('food'));
    const waiting = run(drinking(), tap('food'));

    expect(standing.activity).toBe('stand');
    expect(step(walking, tap('water'), deps)).toBe(walking);
    expect(step(standing, tap('food'), deps)).toBe(standing);
    expect(step(waiting, tap('food'), deps)).toBe(waiting);
  });

  it('A tap on the thing she has finished with sets her doing it again where she is', () => {
    const finished = run(drinking(), ...seconds(DURATION.drink));

    expect(finished.activity).toBe('idle.stand');
    expect(finished.at).toBe('water');

    const again = step(finished, tap('water'), deps);

    expect(again.activity).toBe('drink');
    expect(again.at).toBe('water');
    expect(again.target).toBeUndefined();
  });

  it('She drinks, eats and plays for as long as each takes, then stands idle there', () => {
    const cases: readonly [Item, SceneState['activity'], number][] = [
      ['water', 'drink', DURATION.drink],
      ['food', 'eat', DURATION.eat],
      ['toy', 'play', DURATION.play]
    ];

    for (const [item, activity, duration] of cases) {
      const there = run(room(), tap(item), arrived);

      expect(there.activity).toBe(activity);
      expect(run(there, ...seconds(duration - 0.25)).activity).toBe(activity);

      const done = run(there, ...seconds(duration));

      expect(done.activity).toBe('idle.stand');
      expect(done.at).toBe(item);
    }
  });

  it("She sleeps for the phase's sleep, then stands up from lying and stands idle", () => {
    for (const phase of PHASES) {
      const sleeps = asleep(0, phase);

      expect(run(sleeps, ...seconds(SLEEP[phase] - 0.25)).activity).toBe('sleep');

      const waking = run(sleeps, ...seconds(SLEEP[phase]));

      expect(waking.activity).toBe('stand');
      expect(waking.standFrom).toBe('lying');
      expect(run(waking, ...seconds(2)).activity).toBe('stand');

      const awake = run(waking, ...seconds(2.25));

      expect(awake.activity).toBe('idle.stand');
      expect(awake.standFrom).toBeUndefined();
      expect(awake.at).toBe('bed');
    }
  });

  it('A tap on a thing wakes her once she has slept the minimum, and she stands before she walks', () => {
    const waking = run(asleep(MINIMUM_ACTIVITY), tap('water'));

    expect(waking.activity).toBe('stand');
    expect(waking.standFrom).toBe('lying');
    expect(waking.target?.item).toBe('water');
    expect(run(waking, ...seconds(2)).activity).toBe('stand');

    const off = run(waking, ...seconds(TRANSITION.lie + TRANSITION.sit + 0.05));

    expect(off.activity).toBe('walk');
    expect(off.target?.item).toBe('water');
  });

  it('A tap in the first seconds of her sleep waits for the minimum', () => {
    const asked = run(asleep(), tap('water'));

    expect(asked.activity).toBe('sleep');
    expect(asked.target?.item).toBe('water');
    expect(run(asked, ...seconds(MINIMUM_ACTIVITY - 0.25)).activity).toBe('sleep');
    expect(run(asked, ...seconds(MINIMUM_ACTIVITY)).activity).toBe('stand');
  });

  it("Standing up from sitting takes the sit clip's length, and the last tap still wins", () => {
    const standing = run(sitting(), tap('food'));

    expect(standing.activity).toBe('stand');
    expect(standing.standFrom).toBe('sitting');

    const redirected = step(standing, tap('toy'), deps);

    expect(redirected.activity).toBe('stand');
    expect(run(redirected, ...seconds(TRANSITION.sit - 0.25)).activity).toBe('stand');

    const off = run(redirected, ...seconds(TRANSITION.sit));

    expect(off.activity).toBe('walk');
    expect(off.target?.item).toBe('toy');
    expect(off.standFrom).toBeUndefined();
  });

  it('A tap on a light turns it on or off at once and turns her head, and never walks her', () => {
    const walking = run(room('morning'), tap('water'));
    const lit = step(walking, tap('lamp'), deps);

    expect(lit.lights).toEqual({ lamp: true, strings: false });
    expect(lit.lookAt).toEqual({ item: 'lamp' });
    expect(lit.activity).toBe('walk');
    expect(lit.at).toBe(walking.at);
    expect(lit.target).toEqual(walking.target);

    const drinks = drinking(1);
    const strung = step(drinks, tap('lights'), deps);

    expect(strung.lights).toEqual({ lamp: true, strings: true });
    expect(strung.lookAt).toEqual({ item: 'lights' });
    expect(strung.activity).toBe('drink');
    expect(strung.target).toBeUndefined();
  });

  it('A tap on bare floor turns her head and changes nothing else', () => {
    const sleeps = asleep(10);

    expect(step(sleeps, { kind: 'tapFloor', point: { x: 1, z: -0.5 } }, deps)).toEqual({
      ...sleeps,
      lookAt: { x: 1, z: -0.5 }
    });
  });

  it('A tap on her while she idles, drinks, eats or plays plays the pet at once and hands her back with her time intact', () => {
    const before: readonly SceneState[] = [
      room(),
      { ...sitting(), elapsed: 3 },
      drinking(3),
      run(room(), tap('food'), arrived, ...seconds(3)),
      run(room(), tap('toy'), arrived, ...seconds(3))
    ];

    for (const state of before) {
      const petted = step(state, pet, deps);

      expect(petted.activity).toBe('pet');
      expect(petted.elapsed).toBe(0);
      expect(petted.resume).toEqual({ activity: state.activity, elapsed: state.elapsed });
      expect(run(petted, ...seconds(DURATION.pet - 0.25)).activity).toBe('pet');

      const after = run(petted, ...seconds(DURATION.pet));

      expect(after.activity).toBe(state.activity);
      expect(after.elapsed).toBe(state.elapsed);
      expect(after.resume).toBeUndefined();
      expect(after.untilIdleChoice).toBe(state.untilIdleChoice);
    }
  });

  it('A pet over drinking, eating or playing hands her back without a second caption', () => {
    for (const item of ['water', 'food', 'toy'] as const) {
      const busy = run(room(), tap(item), arrived, ...seconds(3));
      const after = run(busy, pet, ...seconds(DURATION.pet));

      expect(after.activity).toBe(busy.activity);
      expect(after.shown).toEqual([...busy.shown, CAPTIONS.pet[0]]);
      expect(after.caption?.text).toBe(CAPTIONS.pet[0]);
    }
  });

  it('A pet leaves a waiting tap waiting, with the minimum unspent', () => {
    const petted = run(drinking(2), tap('food'), pet);

    expect(petted.activity).toBe('pet');
    expect(petted.target?.item).toBe('food');

    const back = run(petted, ...seconds(DURATION.pet));

    expect(back.activity).toBe('drink');
    expect(back.elapsed).toBe(2);
    expect(back.target?.item).toBe('food');
    expect(run(back, ...seconds(MINIMUM_ACTIVITY - 2 - 0.25)).activity).toBe('drink');
    expect(run(back, ...seconds(MINIMUM_ACTIVITY - 2)).activity).toBe('walk');
  });

  it('A tap on a thing during a pet waits, and is answered as the activity she is handed back to would answer it', () => {
    const idle = run(room(), pet, tap('water'));

    expect(idle.activity).toBe('pet');
    expect(idle.target?.item).toBe('water');
    expect(run(idle, ...seconds(DURATION.pet)).activity).toBe('walk');

    const busy = run(drinking(MINIMUM_ACTIVITY + 1), pet, tap('food'));

    expect(busy.activity).toBe('pet');

    const answered = run(busy, ...seconds(DURATION.pet));

    expect(answered.activity).toBe('walk');
    expect(answered.target?.item).toBe('food');
  });

  it('A tap on the thing she is using changes nothing while she is petted over it', () => {
    const petted = run(drinking(1), pet);

    expect(petted.activity).toBe('pet');
    expect(step(petted, tap('water'), deps)).toBe(petted);
  });

  it('A tap on her while she walks, sits down, lies down, stands up or is being petted changes nothing', () => {
    const busy: readonly SceneState[] = [
      run(room(), tap('water')),
      run(room(), tap('bed'), arrived),
      run(room(), tap('bed'), arrived, ...seconds(1)),
      run(sitting(), tap('food')),
      run(room(), pet)
    ];

    expect(busy.map((state) => state.activity)).toEqual(['walk', 'sit', 'lie', 'stand', 'pet']);
    for (const state of busy) {
      expect(step(state, pet, deps)).toBe(state);
    }
  });

  it('A tap on her while she sleeps wakes her as any tap does', () => {
    const waking = step(asleep(10), pet, deps);

    expect(waking.activity).toBe('stand');
    expect(waking.standFrom).toBe('lying');
    expect(waking.target).toBeUndefined();
    expect(run(waking, ...seconds(2.25)).activity).toBe('idle.stand');
  });

  it('A tap on her in the first seconds of her sleep changes nothing', () => {
    const sleeps = asleep(1);

    expect(sleeps.activity).toBe('sleep');
    expect(step(sleeps, pet, deps)).toBe(sleeps);
  });

  it('A pet turns her attention from wherever she was looking', () => {
    const looking = run(room(), { kind: 'tapFloor', point: { x: 0, z: 1 } });

    expect(looking.lookAt).toEqual({ x: 0, z: 1 });
    expect(step(looking, pet, deps).lookAt).toBeUndefined();
  });
});

describe('ACaptionIsShownAndAnnounced', () => {
  it('A caption appears once she is doing what she was asked, never on the tap', () => {
    const walking = run(room(), tap('water'));

    expect(walking.caption).toBeUndefined();
    expect(run(walking, ...seconds(2)).caption).toBeUndefined();

    const there = step(walking, arrived, deps);

    expect(there.caption).toEqual({ text: CAPTIONS.drink[0], sequence: 1 });
    expect(there.shown).toEqual([CAPTIONS.drink[0]]);
  });

  it('On the way down to bed the caption comes with the tick that reaches sleep', () => {
    const lying = run(room(), tap('bed'), arrived, ...seconds(2));

    expect(lying.activity).toBe('lie');
    expect(lying.caption).toBeUndefined();

    const settled = step(lying, tick, deps);

    expect(settled.activity).toBe('sleep');
    expect(settled.caption?.text).toBe(CAPTIONS['sleep.bed'][0]);
  });

  it('Asleep in the chair, she is narrated in the chair', () => {
    const settled = run(room(), tap('chair'), arrived, ...seconds(2.25));

    expect(settled.caption?.text).toBe(CAPTIONS['sleep.chair'][0]);
  });

  it('A tap on her is answered in words as the pet plays', () => {
    expect(run(room(), pet).caption).toEqual({ text: CAPTIONS.pet[0], sequence: 1 });
  });

  it('Being handed back to an activity after a pet says nothing', () => {
    const after = run(drinking(1), pet, ...seconds(DURATION.pet));

    expect(after.activity).toBe('drink');
    expect(after.caption).toEqual({ text: CAPTIONS.pet[0], sequence: 2 });
    expect(after.shown).toEqual([CAPTIONS.drink[0], CAPTIONS.pet[0]]);
  });

  it('No sentence is shown twice in a visit, and she settles without one once they are spent', () => {
    let state = drinking();
    const said = [state.caption?.text];
    for (let again = 1; again < CAPTIONS.drink.length; again += 1) {
      state = run(state, ...seconds(DURATION.drink), tap('water'));
      said.push(state.caption?.text);
    }

    expect(new Set(said).size).toBe(CAPTIONS.drink.length);
    expect([...said].sort()).toEqual([...CAPTIONS.drink].sort());

    const spent = run(state, ...seconds(DURATION.drink), tap('water'));

    expect(spent.activity).toBe('drink');
    expect(spent.caption).toBeUndefined();
    expect(spent.shown).toEqual(state.shown);
  });

  it('Every caption in a visit is numbered after the last, so the same words twice would be heard twice', () => {
    const first = drinking();
    const second = run(first, ...seconds(DURATION.drink), tap('food'), arrived);
    const third = step(second, pet, deps);

    expect(first.caption?.sequence).toBe(1);
    expect(second.caption?.sequence).toBe(2);
    expect(third.caption?.sequence).toBe(3);
  });

  it('A caption clears when she moves on from what it describes', () => {
    const drinks = drinking(MINIMUM_ACTIVITY);
    const sleeps = asleep();

    expect(drinks.caption).toBeDefined();
    expect(sleeps.caption).toBeDefined();
    expect(run(drinks, ...seconds(DURATION.drink - MINIMUM_ACTIVITY)).caption).toBeUndefined();
    expect(run(drinks, tap('food')).caption).toBeUndefined();
    expect(run(sleeps, ...seconds(SLEEP.evening)).caption).toBeUndefined();
  });

  it('A long idle stretch is narrated once, at the same scaled point in every phase', () => {
    for (const phase of PHASES) {
      const long = IDLE_LONG * IDLE_FACTOR[phase];
      const opened = room(phase);

      expect(run(opened, ...seconds(long - 0.25)).caption).toBeUndefined();
      expect(run(opened, ...seconds(long)).caption?.text).toBe(CAPTIONS['idle.long'][0]);

      const later = run(opened, ...seconds(opened.untilIdleChoice - 0.25));

      expect(later.activity).toBe('idle.stand');
      expect(later.shown).toEqual([CAPTIONS['idle.long'][0]]);
    }
  });

  it('A choice made on the same tick as the long idle wins, and nothing is said', () => {
    const opened = { ...room('night'), untilIdleChoice: IDLE_LONG * IDLE_FACTOR.night };
    const chosen = run(opened, ...seconds(IDLE_LONG * IDLE_FACTOR.night));

    expect(chosen.activity).toBe('walk');
    expect(chosen.shown).toEqual([]);
  });

  it('Every idle stretch has a long idle of its own', () => {
    // The drink's caption, then the longest interval, then the long idle's caption.
    draws(0, 20, 0);
    const idle = run(drinking(), ...seconds(DURATION.drink));

    expect(idle.untilIdleChoice).toBe(40);

    const long = run(idle, ...seconds(IDLE_LONG));

    expect(long.caption?.text).toBe(CAPTIONS['idle.long'][0]);
    expect(long.shown).toEqual([CAPTIONS.drink[0], CAPTIONS['idle.long'][0]]);
  });
});

describe('TimeFollowsTheClockUntilOverridden', () => {
  it("Until the player chooses a phase, the phase is the clock's", () => {
    const state = run(room('morning'), clock('evening'));

    expect(state.phase).toBe('evening');
    expect(state.phaseOverride).toBeUndefined();
  });

  it('A phase the player chooses holds against the clock', () => {
    const state = run(room('morning'), { kind: 'setPhase', phase: 'night' }, clock('morning'));

    expect(state.phase).toBe('night');
    expect(state.phaseOverride).toBe('night');
  });

  it('Handing the choice back to the clock follows the clock from its next reading', () => {
    const handed = run(
      room('morning'),
      { kind: 'setPhase', phase: 'night' },
      { kind: 'setPhase', phase: 'auto' }
    );

    expect(handed.phaseOverride).toBeUndefined();
    expect(handed.phase).toBe('night');
    expect(step(handed, clock('morning'), deps).phase).toBe('morning');
  });

  it('The phase decides how the room is lit', () => {
    const lit: readonly [Phase, boolean, boolean, number][] = [
      ['morning', false, false, 0.35],
      ['evening', true, false, 0.7],
      ['night', true, true, 1]
    ];

    for (const [phase, lamp, strings, fire] of lit) {
      const opened = room(phase);
      const crossed = run(room(phase === 'night' ? 'morning' : 'night'), clock(phase));

      expect(opened.lights).toEqual({ lamp, strings });
      expect(opened.fire).toBe(fire);
      expect(crossed.lights).toEqual({ lamp, strings });
      expect(crossed.fire).toBe(fire);
    }
  });

  it('A light the player toggles stays as they left it until the phase next changes', () => {
    const toggled = run(room('evening'), { kind: 'toggleLight', light: 'lamp' });

    expect(toggled.lights).toEqual({ lamp: false, strings: false });
    expect(run(toggled, clock('evening')).lights).toEqual({ lamp: false, strings: false });
    expect(run(toggled, { kind: 'setPhase', phase: 'evening' }).lights.lamp).toBe(false);
    expect(run(toggled, clock('night')).lights).toEqual({ lamp: true, strings: true });
  });

  it('The phase decides which things she prefers when she chooses for herself', () => {
    const first: readonly [Phase, Item][] = [
      ['morning', 'toy'],
      ['evening', 'chair'],
      ['night', 'bed']
    ];

    for (const [phase, item] of first) {
      const chosen = run({ ...room(phase), untilIdleChoice: 0.25 }, tick);

      expect(chosen.activity).toBe('walk');
      expect(chosen.target?.item).toBe(item);
    }
  });

  it('The phase decides how long she idles before she next chooses', () => {
    // A sit chosen while sitting changes nothing but the interval, drawn from 20 to 40 and scaled.
    const intervals: readonly [Phase, number, number, number][] = [
      ['morning', 6, 0, 14],
      ['morning', 6, 2, 15.4],
      ['morning', 6, 20, 28],
      ['evening', 10, 5, 25],
      ['night', 8, 0, 30],
      ['night', 8, 20, 60]
    ];

    for (const [phase, sit, drawn, expected] of intervals) {
      draws(sit, drawn);
      const state = run({ ...sitting(phase), untilIdleChoice: 0.25 }, tick);

      expect(state.activity).toBe('idle.sit');
      expect(state.untilIdleChoice).toBe(expected);
    }
  });
});

describe('MotionOffIsAStillDiorama', () => {
  it('Motion going off mid-walk puts her at the thing, doing it, with its caption', () => {
    const drinks = run(room(), tap('water'), motionOff);

    expect(drinks.motion).toBe(false);
    expect(drinks.activity).toBe('drink');
    expect(drinks.at).toBe('water');
    expect(drinks.target).toBeUndefined();
    expect(drinks.caption?.text).toBe(CAPTIONS.drink[0]);

    const sleeps = run(room(), tap('bed'), motionOff);

    expect(sleeps.activity).toBe('sleep');
    expect(sleeps.at).toBe('bed');
    expect(sleeps.caption?.text).toBe(CAPTIONS['sleep.bed'][0]);
  });

  it('Motion going off on the way down or up jumps to where the movement leads', () => {
    const sittingDown = run(room(), tap('bed'), arrived, motionOff);
    const lyingDown = run(room(), tap('bed'), arrived, ...seconds(1), motionOff);
    const wakingAlone = run(asleep(10), pet, motionOff);
    const wakingToGo = run(asleep(10), tap('food'), motionOff);
    const standingToGo = run(sitting(), tap('toy'), motionOff);

    expect(sittingDown.activity).toBe('sleep');
    expect(lyingDown.activity).toBe('sleep');
    expect(wakingAlone.activity).toBe('idle.stand');
    expect(wakingAlone.standFrom).toBeUndefined();
    expect(wakingToGo.activity).toBe('eat');
    expect(wakingToGo.at).toBe('food');
    expect(standingToGo.activity).toBe('play');
    expect(standingToGo.at).toBe('toy');
  });

  it('Motion going off during a pet hands her back at once, and keeps the words', () => {
    const state = run(drinking(3), pet, motionOff);

    expect(state.activity).toBe('drink');
    expect(state.elapsed).toBe(3);
    expect(state.resume).toBeUndefined();
    expect(state.caption?.text).toBe(CAPTIONS.pet[0]);
  });

  it('With motion off, a tap on a thing cuts to a still of her at that thing', () => {
    const still = room('evening', false);

    const drinks = run(still, tap('water'));

    expect(drinks.activity).toBe('drink');
    expect(drinks.at).toBe('water');

    const sleeps = run(still, tap('bed'));

    expect(sleeps.activity).toBe('sleep');
    expect(sleeps.at).toBe('bed');

    const eats = run({ ...still, activity: 'idle.sit' }, tap('food'));

    expect(eats.activity).toBe('eat');
    expect(eats.at).toBe('food');
  });

  it('With motion off, a tap on her is answered in words', () => {
    const still = room('evening', false);
    const answered = run(still, pet);

    expect(answered.activity).toBe('idle.stand');
    expect(answered.resume).toBeUndefined();
    expect(answered.caption?.text).toBe(CAPTIONS.pet[0]);

    const woken = run(still, tap('bed'), ...seconds(MINIMUM_ACTIVITY), pet);

    expect(woken.activity).toBe('idle.stand');
    expect(woken.at).toBe('bed');
  });

  it('With motion off, time still passes', () => {
    const still = room('evening', false);

    expect(run(still, tap('water'), ...seconds(DURATION.drink)).activity).toBe('idle.stand');
    expect(run(still, tap('bed'), ...seconds(SLEEP.evening)).activity).toBe('idle.stand');

    const waited = run(still, tap('water'), tap('food'));

    expect(waited.activity).toBe('drink');
    expect(run(waited, ...seconds(MINIMUM_ACTIVITY)).activity).toBe('eat');

    draws(10);
    expect(run({ ...still, untilIdleChoice: 0.25 }, tick).activity).toBe('idle.sit');
  });

  it('With motion off, the lights, the time of day and the settings still work', () => {
    const still = room('evening', false);
    const state = run(
      still,
      tap('lamp'),
      clock('night'),
      { kind: 'toggleLight', light: 'strings' },
      { kind: 'setSound', on: true }
    );

    expect(state.phase).toBe('night');
    expect(state.lights).toEqual({ lamp: true, strings: false });
    expect(state.sound).toBe(true);
    expect(run(still, tap('lamp')).lights.lamp).toBe(false);
  });

  it('Motion coming back on changes nothing else', () => {
    const still = run(room('evening', false), tap('water'));

    expect(step(still, motionOn, deps)).toEqual({ ...still, motion: true });
  });

  it('An arrival the room reports after motion went off changes nothing', () => {
    const still = run(room(), tap('water'), motionOff);

    expect(still.activity).toBe('drink');
    expect(step(still, arrived, deps)).toBe(still);
  });
});

describe('what she does on her own', () => {
  it('Once she has idled long enough she chooses a thing and goes to it', () => {
    const opened = room('morning');

    expect(run(opened, ...seconds(opened.untilIdleChoice - 0.25)).activity).toBe('idle.stand');

    const chosen = run(opened, ...seconds(opened.untilIdleChoice));

    expect(chosen.activity).toBe('walk');
    expect(chosen.target?.item).toBe('toy');
  });

  it('Choosing to sit, she sits down where she is', () => {
    const standing: readonly SceneState[] = [
      { ...room('morning'), untilIdleChoice: 0.25 },
      { ...room('morning'), at: 'water', untilIdleChoice: 0.25 }
    ];

    for (const state of standing) {
      draws(6, 0);
      const sitsDown = run(state, tick);

      expect(sitsDown.activity).toBe('sit');
      expect(sitsDown.at).toBe(state.at);
      expect(run(sitsDown, ...seconds(TRANSITION.sit - 0.25)).activity).toBe('sit');
      expect(run(sitsDown, ...seconds(TRANSITION.sit)).activity).toBe('idle.sit');
    }
  });

  it('Choosing to sit while she stands in her bed, she lies down in it', () => {
    draws(8, 0, 0);
    const sitsDown = run({ ...room('night'), at: 'bed', untilIdleChoice: 0.25 }, tick);

    expect(sitsDown.activity).toBe('sit');

    const settled = run(sitsDown, ...seconds(2.25));

    expect(settled.activity).toBe('sleep');
    expect(settled.caption?.text).toBe(CAPTIONS['sleep.bed'][0]);
  });

  it('Choosing a thing while sitting, she stands up first', () => {
    const chosen = run({ ...sitting('night'), untilIdleChoice: 0.25 }, tick);

    expect(chosen.activity).toBe('stand');
    expect(chosen.standFrom).toBe('sitting');
    expect(chosen.target?.item).toBe('bed');
  });

  it('She idles a fresh interval after each thing she does', () => {
    // The drink's caption, then an interval of 25 seconds, which evening does not scale.
    draws(0, 5);
    const drinks = drinking(DURATION.drink - 0.25);

    expect(drinks.activity).toBe('drink');

    const idle = step(drinks, tick, deps);

    expect(idle.activity).toBe('idle.stand');
    expect(idle.untilIdleChoice).toBe(25);
    expect(idle.elapsed).toBe(0);
  });

  it('A walk to bare floor ends with her standing idle there', () => {
    const walking: SceneState = {
      ...room(),
      activity: 'walk',
      target: { spot: 'nav.3', item: 'floor' }
    };
    const there = step(walking, arrived, deps);

    expect(there.activity).toBe('idle.stand');
    expect(there.at).toBe('floor');
    expect(there.target).toBeUndefined();
  });
});

describe('the settings', () => {
  it('The weather, the sound and the camera change as the player asks, and nothing else does', () => {
    const opened = room();
    const set = run(
      opened,
      { kind: 'setWeather', weather: 'snow' },
      { kind: 'setSound', on: true },
      { kind: 'setCamera', camera: 'window' }
    );

    expect(set).toEqual({ ...opened, weather: 'snow', sound: true, camera: 'window' });
  });
});
