/**
 * What her control shows: the shape and the words.
 *
 * `cabin.allium`'s HerControlSaysWhatSheIsDoing: her control says what she is
 * doing in shape and in words and, while she walks, where she is heading. The
 * shape is one of four: the thing she is at, the hand while she is petted, the
 * thing she is heading for, or nothing beside the paw. The words are the
 * sentence's own phrase, so the control and the sentence never disagree.
 */
import type { SceneState } from './domain/director';
import { isWalkItem } from './domain/items';
import type { WalkItem } from './domain/items';
import { whatSheIsDoing } from './sentence';

export type Doing =
  | { kind: 'at'; item: WalkItem } // settled or idle at a thing: its icon
  | { kind: 'pet' } // the hand
  | { kind: 'heading'; item: WalkItem } // the paw, an arrow, the thing's icon
  | { kind: 'alone' }; // the paw alone

type Doable = Pick<SceneState, 'activity' | 'at' | 'target'>;

export function doingOf(state: Doable): Doing {
  if (state.activity === 'pet') return { kind: 'pet' };
  if (state.activity === 'walk') {
    const item = state.target?.item;
    return item !== undefined && isWalkItem(item) ? { kind: 'heading', item } : { kind: 'alone' };
  }
  return isWalkItem(state.at) ? { kind: 'at', item: state.at } : { kind: 'alone' };
}

/** The control's name: what she is doing, then what pressing it offers. */
export function describeDoing(state: Doable): string {
  return `Biscuit, ${whatSheIsDoing(state)}. Send her somewhere`;
}
