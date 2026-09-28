import { describe, expect, it } from 'vitest';

import { initialState } from '../src/lib/domain/director';
import type { Activity, SceneState } from '../src/lib/domain/director';
import type { Item, WalkItem } from '../src/lib/domain/items';
import { describeDoing, doingOf } from '../src/lib/doing';

/*
 * cabin.allium — Cabin.@guarantee HerControlSaysWhatSheIsDoing: her control
 * says what she is doing in shape and in words, and while she walks, where
 * she is heading. `doingOf` is the shape and `describeDoing` the words; both
 * are pure over the director's state, so the whole table is held here.
 */

const ACTIVITIES: readonly Activity[] = [
  'idle.stand',
  'idle.sit',
  'walk',
  'sit',
  'lie',
  'stand',
  'sleep',
  'drink',
  'eat',
  'play',
  'pet'
];
const PLACES: readonly (Item | 'floor')[] = [
  'bed',
  'chair',
  'water',
  'food',
  'toy',
  'lamp',
  'lights',
  'floor'
];
const SETTLED: readonly [Exclude<Activity, 'walk' | 'pet'>, WalkItem][] = [
  ['sleep', 'bed'],
  ['sleep', 'chair'],
  ['drink', 'water'],
  ['eat', 'food'],
  ['play', 'toy'],
  ['idle.sit', 'chair'],
  ['idle.stand', 'toy'],
  ['sit', 'bed'],
  ['lie', 'bed'],
  ['stand', 'bed']
];

function scene(overrides: Partial<SceneState> = {}): SceneState {
  return { ...initialState('night', 'snow', false), ...overrides };
}

describe('the shape of her control', () => {
  it.each(SETTLED)('shows the thing she is at while she is %s at the %s', (activity, at) => {
    expect(doingOf(scene({ activity, at }))).toEqual({ kind: 'at', item: at });
  });

  it('shows the hand while she is being petted, wherever she is', () => {
    expect(doingOf(scene({ activity: 'pet', at: 'water' }))).toEqual({ kind: 'pet' });
    expect(doingOf(scene({ activity: 'pet', at: 'floor' }))).toEqual({ kind: 'pet' });
  });

  it('points at where she is heading', () => {
    expect(
      doingOf(
        scene({
          activity: 'walk',
          at: 'floor',
          target: { spot: 'item.water.approach', item: 'water' }
        })
      )
    ).toEqual({ kind: 'heading', item: 'water' });
    expect(
      doingOf(scene({ activity: 'walk', at: 'bed', target: { spot: 'spot.chair', item: 'chair' } }))
    ).toEqual({ kind: 'heading', item: 'chair' });
  });

  it('is the paw alone on the floor', () => {
    expect(doingOf(scene({ activity: 'idle.stand', at: 'floor' }))).toEqual({ kind: 'alone' });
  });

  it('is the paw alone on a walk with nowhere named', () => {
    expect(doingOf(scene({ activity: 'walk', at: 'floor' }))).toEqual({ kind: 'alone' });
    expect(
      doingOf(scene({ activity: 'walk', at: 'bed', target: { spot: 'floor', item: 'floor' } }))
    ).toEqual({ kind: 'alone' });
  });

  it('never shows a light as a place, because she is never at one', () => {
    expect(doingOf(scene({ activity: 'idle.stand', at: 'lamp' }))).toEqual({ kind: 'alone' });
    expect(doingOf(scene({ activity: 'idle.stand', at: 'lights' }))).toEqual({ kind: 'alone' });
  });
});

describe('the words of her control', () => {
  it('say what she is doing and offer to send her', () => {
    expect(describeDoing(scene({ activity: 'drink', at: 'water' }))).toBe(
      'Biscuit, drinking at the water bowl. Send her somewhere'
    );
    expect(describeDoing(scene({ activity: 'sleep', at: 'chair' }))).toBe(
      'Biscuit, asleep in the chair. Send her somewhere'
    );
    expect(describeDoing(scene())).toBe('Biscuit, standing on the floor. Send her somewhere');
  });

  it('say where she is heading', () => {
    expect(
      describeDoing(scene({ activity: 'walk', target: { spot: 'spot.bed', item: 'bed' } }))
    ).toBe('Biscuit, walking to the bed. Send her somewhere');
    expect(describeDoing(scene({ activity: 'walk' }))).toBe('Biscuit, walking. Send her somewhere');
  });

  it('keep one shape and never speak in the first person', () => {
    for (const activity of ACTIVITIES) {
      for (const at of PLACES) {
        const words = describeDoing(scene({ activity, at }));
        expect(words).toMatch(/^Biscuit, [a-z ]+\. Send her somewhere$/);
        expect(words).not.toMatch(/\b(I|me|my|we|our|us)\b/);
      }
    }
  });
});
