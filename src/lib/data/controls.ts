/**
 * The row of controls under the room: one per thing, and one for her.
 *
 * `ItemControls` takes this as a prop, so the treat jar's button (v1.1) is a
 * line here once the `treat` clip lands. The Pet entry mirrors the canvas's
 * `biscuit` hit: the row offers what the hit-test offers (EveryItemIsAControl).
 */
import type { Item } from '../domain/items';
import type { GameIconName } from '../icons';

export interface ItemControl {
  id: Item | 'biscuit';
  label: string;
  icon: GameIconName;
}

export const ITEM_CONTROLS: readonly ItemControl[] = [
  { id: 'bed', label: 'Bed', icon: 'bed' },
  { id: 'chair', label: 'Chair', icon: 'armchair' },
  { id: 'water', label: 'Water', icon: 'glass-water' },
  { id: 'food', label: 'Food', icon: 'bone' },
  { id: 'toy', label: 'Toy', icon: 'toy-brick' },
  { id: 'lamp', label: 'Lamp', icon: 'lamp-floor' },
  { id: 'lights', label: 'Lights', icon: 'sparkles' },
  { id: 'biscuit', label: 'Pet', icon: 'hand' }
];
