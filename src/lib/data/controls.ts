/**
 * The controls under the room: the things she can be sent to, and the lights.
 *
 * `SendDialog` lists the first and `LightsDialog` the second, so the treat
 * jar's entry (v1.1) is a line here once the `treat` clip lands. Her own
 * control and the Pet button are the bar's, not entries: she is not somewhere
 * to be sent, and a tap on her is a reaction rather than an invitation
 * (EveryItemIsAControl, ATapIsAnInvitation).
 */
import type { WalkItem } from '../domain/items';
import type { GameIconName } from '../icons';

export interface SendControl {
  id: WalkItem;
  label: string;
  icon: GameIconName;
}

export interface LightControl {
  id: 'lamp' | 'lights';
  label: string;
  icon: GameIconName;
}

const SEND_ICONS: Readonly<Record<WalkItem, GameIconName>> = {
  bed: 'bed',
  chair: 'armchair',
  water: 'glass-water',
  food: 'bone',
  toy: 'toy-brick'
};

export const SEND_CONTROLS: readonly SendControl[] = [
  { id: 'bed', label: 'Bed', icon: SEND_ICONS.bed },
  { id: 'chair', label: 'Chair', icon: SEND_ICONS.chair },
  { id: 'water', label: 'Water', icon: SEND_ICONS.water },
  { id: 'food', label: 'Food', icon: SEND_ICONS.food },
  { id: 'toy', label: 'Toy', icon: SEND_ICONS.toy }
];

export const LIGHT_CONTROLS: readonly LightControl[] = [
  { id: 'lamp', label: 'Lamp', icon: 'lamp-floor' },
  { id: 'lights', label: 'Lights', icon: 'sparkles' }
];

/** The icon a thing is drawn with, wherever it is drawn: here and on her control. */
export function iconFor(item: WalkItem): GameIconName {
  return SEND_ICONS[item];
}
