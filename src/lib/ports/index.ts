/**
 * Every port the page constructs in `onMount` and hands down, as one bag.
 *
 * The page takes this as an optional prop so a route test can inject the
 * fakes; when it is absent the page builds the real adapters. Components never
 * import it: they take slices of state and callbacks (`docs/explanation/layering.md`).
 */
import type { PreferencesPort } from '@steven-cutting/biscuit-games';

import type { AudioPort } from './audio';
import type { ClockPort } from './clock';
import type { FramePort } from './frame';
import type { RandomPort } from './random';
import type { StoragePort } from './storage';
import type { TimerPort } from './timer';

export interface Ports {
  storage: StoragePort;
  clock: ClockPort;
  random: RandomPort;
  timer: TimerPort;
  frames: FramePort;
  audio: AudioPort;
  preferences: PreferencesPort;
}
