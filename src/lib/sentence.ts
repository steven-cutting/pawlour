/**
 * The scene in words, for the visually hidden sentence beside the canvas.
 *
 * The canvas is `aria-hidden`; this is what a reader who cannot see the room
 * is told about it, and it changes with the state. CONVENTIONS.md §7 fixes the
 * shape: "Biscuit is asleep in the bed. It is night. Snow." Third person,
 * present tense, no first person, like the captions (§6.3).
 */
import type { Activity, SceneState } from './domain/director';
import type { Item } from './domain/items';

const DOING: Readonly<Record<Exclude<Activity, 'walk'>, string>> = {
  'idle.stand': 'standing',
  'idle.sit': 'sitting',
  sit: 'settling',
  lie: 'lying down',
  stand: 'getting up',
  sleep: 'asleep',
  drink: 'drinking',
  eat: 'eating',
  play: 'playing',
  pet: 'being petted'
};

const THING: Readonly<Record<Item, string>> = {
  bed: 'bed',
  chair: 'chair',
  water: 'water bowl',
  food: 'food bowl',
  toy: 'toy',
  lamp: 'lamp',
  lights: 'lights'
};

const PLACE: Readonly<Record<Item | 'floor', string>> = {
  bed: 'in the bed',
  chair: 'in the chair',
  water: 'at the water bowl',
  food: 'at the food bowl',
  toy: 'with the toy',
  lamp: 'by the lamp',
  lights: 'by the lights',
  floor: 'on the floor'
};

/**
 * What she is doing, as the sentence says it between "Biscuit is" and the
 * phase: "drinking at the water bowl", "walking to the bed", "walking". Her
 * control reuses it (HerControlSaysWhatSheIsDoing), so the two agree.
 */
export function whatSheIsDoing(state: Pick<SceneState, 'activity' | 'at' | 'target'>): string {
  if (state.activity !== 'walk') {
    return `${DOING[state.activity]} ${PLACE[state.at]}`;
  }
  const item = state.target?.item;
  return item === undefined || item === 'floor' ? 'walking' : `walking to the ${THING[item]}`;
}

function capitalised(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function describeScene(state: SceneState): string {
  return `Biscuit is ${whatSheIsDoing(state)}. It is ${state.phase}. ${capitalised(state.weather)}.`;
}
