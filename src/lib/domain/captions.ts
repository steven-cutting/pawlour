/**
 * Which sentence the narrator says next.
 *
 * `ACaptionIsShownAndAnnounced`: no sentence is shown twice in one visit, and
 * once every sentence for what she is doing has been shown she settles into it
 * without one rather than repeating one. The choice among the rest is uniform,
 * so it goes through the random port.
 */
import { CAPTIONS } from '../data/captions';
import type { RandomPort } from '../ports/random';
import type { Settled } from './items';

export function chooseCaption(
  key: Settled,
  shown: readonly string[],
  random: RandomPort
): string | undefined {
  const remaining = CAPTIONS[key].filter((text) => !shown.includes(text));
  return remaining.length === 0 ? undefined : random.uniformChoice(remaining);
}
