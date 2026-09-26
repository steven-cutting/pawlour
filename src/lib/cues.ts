/**
 * What the sound switch plays, read off one state and the next.
 *
 * The director returns no effects, so the page compares the state it had with
 * the one `step` returned and hands the difference to the audio port. The
 * rule is `cabin.allium`'s SoundNeverStartsUnasked: nothing while sound is
 * off; once on, the fire always, the weather outside, and what she is doing
 * where it makes a sound. `sound` becomes true only after `enable()` has
 * resolved (the page's `SoundControl` handler), so a cue here never reaches a
 * port that has not started.
 */
import type { SceneState } from './domain/director';

export const LOOPS = ['fire', 'rain', 'wind', 'lapping', 'squeak'] as const;
export type Loop = (typeof LOOPS)[number];

export interface Cue {
  bed?: readonly Loop[];
  play?: readonly Loop[];
}

/** The loops that run together: the fire, and whatever the weather adds. */
export function bedFor(state: Pick<SceneState, 'weather'>): readonly Loop[] {
  switch (state.weather) {
    case 'rain':
      return ['fire', 'rain'];
    case 'snow':
      return ['fire', 'wind'];
    case 'clear':
      return ['fire'];
  }
}

/** The one-shot an activity starts with, or none. */
function soundOf(activity: SceneState['activity']): Loop | undefined {
  if (activity === 'drink') return 'lapping';
  if (activity === 'play') return 'squeak';
  return undefined;
}

export function cueFor(previous: SceneState, next: SceneState): Cue {
  if (!next.sound) return {};
  const cue: Cue = {};
  const bed = bedFor(next);
  if (!previous.sound || bed.join() !== bedFor(previous).join()) {
    cue.bed = bed;
  }
  // A pet hands her back to what it interrupted, not into it again (§6.1).
  const started = soundOf(next.activity);
  if (started !== undefined && previous.activity !== next.activity && previous.activity !== 'pet') {
    cue.play = [started];
  }
  return cue;
}
