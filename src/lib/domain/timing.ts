/**
 * The director's figures, in seconds unless the name says otherwise.
 *
 * `cabin.allium` states the four-second minimum as `minimum_activity_seconds`
 * and leaves the rest as tuning that lives beside the code using it. The
 * transitions are the clip lengths: `sit` is thirty frames and `lie`
 * thirty-six, at thirty frames a second.
 */
export const TICK_MS = 250;
export const MINIMUM_ACTIVITY = 4;
export const DURATION = { drink: 6, eat: 10, play: 15, pet: 2 } as const;
export const TRANSITION = { sit: 1.0, lie: 1.2 } as const; // the clip lengths, §4.1
export const SLEEP = { morning: 90, evening: 150, night: 300 } as const;
export const IDLE_INTERVAL = { min: 20, max: 40 } as const;
export const IDLE_FACTOR = { morning: 0.7, evening: 1, night: 1.5 } as const;
export const IDLE_LONG = 20; // idle seconds, × IDLE_FACTOR[phase], before idle.long
export const CLOCK_INTERVAL_MS = 60_000;
