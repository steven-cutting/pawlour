import { describe, expect, it } from 'vitest';

import { initialState } from '../src/lib/domain/director';
import type { SceneState } from '../src/lib/domain/director';
import { drawsTheSame } from '../src/lib/drawn';

/*
 * cabin.allium — Cabin.@guarantee MotionOffIsAStillDiorama: "the room is drawn
 * once per change". The director ticks four times a second and returns a new
 * state each time, so the page hands the canvas the previous state again
 * whenever nothing the runtime draws has changed.
 */
function scene(overrides: Partial<SceneState> = {}): SceneState {
  return { ...initialState('evening', 'clear', false), ...overrides };
}

describe('drawsTheSame', () => {
  it('is true when only the bookkeeping moved', () => {
    const before = scene();
    const after = scene({ elapsed: 0.25, untilIdleChoice: 20, shown: ['a'] });

    expect(drawsTheSame(before, after)).toBe(true);
  });

  it.each([
    ['activity', { activity: 'sleep' }],
    ['at', { at: 'bed' }],
    ['target', { target: { spot: 'spot.bed', item: 'bed' } }],
    ['lookAt', { lookAt: { x: 1, z: 1 } }],
    ['phase', { phase: 'night' }],
    ['weather', { weather: 'snow' }],
    ['lights', { lights: { lamp: false, strings: true } }],
    ['fire', { fire: 0.2 }],
    ['camera', { camera: 'window' }],
    ['caption', { caption: { text: 'Biscuit has gone to bed.', sequence: 1 } }],
    ['motion', { motion: true }]
  ] as const)('is false when %s changed', (_field, change) => {
    expect(drawsTheSame(scene(), scene(change))).toBe(false);
  });

  it('is false when a lookAt clears', () => {
    expect(drawsTheSame(scene({ lookAt: { x: 1, z: 1 } }), scene())).toBe(false);
  });
});
