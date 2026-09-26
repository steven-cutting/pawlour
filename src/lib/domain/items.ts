/**
 * The things in the room a tap can reach, and what each one is for.
 *
 * `cabin.allium`'s `Item` is this list. The treat jar and the fire are in the
 * room as well, and in v1 a tap on either is a tap on the floor, so neither is
 * named here. The lamp and the string lights are lights rather than places:
 * she never walks to one, so they have no activity and no spot.
 */
import type { Activity } from './director';

export type Item = 'bed' | 'chair' | 'water' | 'food' | 'toy' | 'lamp' | 'lights';

/** The things she walks to. */
export type WalkItem = Exclude<Item, 'lamp' | 'lights'>;

/**
 * What she has settled into, as the caption bank is keyed. Sleep is two keys
 * because the narrator says something different about the bed and the chair;
 * `idle.long` is a long idle stretch rather than an activity.
 */
export type Settled = 'sleep.bed' | 'sleep.chair' | 'drink' | 'eat' | 'play' | 'pet' | 'idle.long';

/** How she uses a thing: the transitions on the way in, then the activity. */
export interface Plan {
  transitions: readonly ('sit' | 'lie')[];
  activity: Activity;
  settled: Settled;
  spot: string;
}

/*
 * The bed and the chair share the same pair of clips on the way down: a real
 * climb onto the chair is a later clip, and when it arrives only this table
 * changes. `spot` names the node in the room she ends up at.
 */
const PLANS: Readonly<Record<WalkItem, Plan>> = {
  bed: { transitions: ['sit', 'lie'], activity: 'sleep', settled: 'sleep.bed', spot: 'spot.bed' },
  chair: {
    transitions: ['sit', 'lie'],
    activity: 'sleep',
    settled: 'sleep.chair',
    spot: 'spot.chair'
  },
  water: { transitions: [], activity: 'drink', settled: 'drink', spot: 'item.water.approach' },
  food: { transitions: [], activity: 'eat', settled: 'eat', spot: 'item.food.approach' },
  toy: { transitions: [], activity: 'play', settled: 'play', spot: 'item.toy.approach' }
};

export function activityFor(item: WalkItem): Plan {
  return PLANS[item];
}

/** Which of the room's two practical lights a tap on a light item toggles. */
export function lightFor(item: 'lamp' | 'lights'): 'lamp' | 'strings' {
  return item === 'lamp' ? 'lamp' : 'strings';
}

/** Whether a thing is somewhere she goes, rather than a light or the floor. */
export function isWalkItem(thing: Item | 'floor'): thing is WalkItem {
  return Object.hasOwn(PLANS, thing);
}
