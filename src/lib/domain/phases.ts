/**
 * The three parts of the day, and what each one changes.
 *
 * `cabin.allium`'s `TimeFollowsTheClockUntilOverridden` says the phase is the
 * device's hour until the player chooses one; the hours below are that
 * module's `morning_starts`, `evening_starts` and `night_starts`. The rest is
 * tuning the module leaves beside the code: which things she prefers when she
 * chooses for herself, and how bright the fire burns.
 */
import type { WalkItem } from './items';

export type Phase = 'morning' | 'evening' | 'night';

const MORNING_STARTS = 5;
const EVENING_STARTS = 14;
const NIGHT_STARTS = 21;

/** The phase an hour of the device's clock, 0 to 23, falls in. */
export function phaseForHour(hour: number): Phase {
  if (hour >= MORNING_STARTS && hour < EVENING_STARTS) {
    return 'morning';
  }
  if (hour >= EVENING_STARTS && hour < NIGHT_STARTS) {
    return 'evening';
  }
  return 'night';
}

/**
 * The phase at a moment read from the clock port.
 *
 * The hour is the device's own: the player lives in its time zone, not in
 * UTC. It is an argument so a test names the hour instead of depending on the
 * zone the suite happens to run in.
 */
export function phaseAt(ms: number, hourOf: (ms: number) => number = hourInThisZone): Phase {
  return phaseForHour(hourOf(ms));
}

function hourInThisZone(ms: number): number {
  return new Date(ms).getHours();
}

/** What she may choose when she has idled long enough: a thing, or to sit where she is. */
type Choice = WalkItem | 'sit';

/*
 * What she chooses between when she has idled long enough, as a list she draws
 * from uniformly: an entry repeated is an entry weighted. `toy` is play, and
 * `sit` is sitting down where she is. Morning: play 0.4, water 0.2, sit 0.2,
 * bed 0.1, chair 0.1. Evening: chair 0.3, bed 0.2, sit 0.2, water 0.15, play
 * 0.15. Night: bed 0.5, chair 0.3, sit 0.2.
 */
const IDLE_WEIGHTS: Readonly<Record<Phase, readonly Choice[]>> = {
  morning: ['toy', 'toy', 'toy', 'toy', 'water', 'water', 'sit', 'sit', 'bed', 'chair'],
  evening: [
    ...repeat('chair', 6),
    ...repeat('bed', 4),
    ...repeat('sit', 4),
    ...repeat('water', 3),
    ...repeat('toy', 3)
  ],
  night: ['bed', 'bed', 'bed', 'bed', 'bed', 'chair', 'chair', 'chair', 'sit', 'sit']
};

function repeat(entry: Choice, times: number): Choice[] {
  return Array.from({ length: times }, () => entry);
}

export function idleWeights(phase: Phase): readonly (WalkItem | 'sit')[] {
  return IDLE_WEIGHTS[phase];
}

const FIRE_LEVEL: Readonly<Record<Phase, number>> = { morning: 0.35, evening: 0.7, night: 1 };

/** How much of the room's light the fire gives, from 0 to 1. */
export function fireLevel(phase: Phase): number {
  return FIRE_LEVEL[phase];
}
