/**
 * Whether two states draw the same picture.
 *
 * `cabin.allium`'s MotionOffIsAStillDiorama says the room is drawn once per
 * change, and the runtime draws once per state it is handed. The director
 * ticks four times a second and every tick returns a new object, so the page
 * compares what the runtime draws (§5.4: her activity, where she is and is
 * going, where she looks, the phase, the weather, the lights, the fire, the
 * camera, the caption the still is named by, and whether motion is on) and
 * hands the canvas the previous state again when none of it moved.
 */
import type { SceneState } from './domain/director';

const DRAWN = [
  'activity',
  'at',
  'target',
  'lookAt',
  'phase',
  'weather',
  'lights',
  'fire',
  'camera',
  'caption',
  'motion'
] as const satisfies readonly (keyof SceneState)[];

export function drawsTheSame(previous: SceneState, next: SceneState): boolean {
  return DRAWN.every((field) => JSON.stringify(previous[field]) === JSON.stringify(next[field]));
}
