import { describe, expect, it } from 'vitest';

import { initialState } from '../src/lib/domain/director';
import type { Activity, SceneState } from '../src/lib/domain/director';
import type { Item } from '../src/lib/domain/items';
import type { Phase } from '../src/lib/domain/phases';
import type { Weather } from '../src/lib/domain/weather';
import { describeScene } from '../src/lib/sentence';

/*
 * The visually hidden sentence beside the canvas: what a reader who cannot see
 * the room is told about it. CONVENTIONS.md §7 fixes the shape ("Biscuit is
 * asleep in the bed. It is night. Snow."), so every activity, place, phase and
 * weather is held here to a sentence of that shape.
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
const PHASES: readonly Phase[] = ['morning', 'evening', 'night'];
const WEATHERS: readonly Weather[] = ['clear', 'rain', 'snow'];

function scene(overrides: Partial<SceneState> = {}): SceneState {
  return { ...initialState('night', 'snow', false), ...overrides };
}

describe('the hidden sentence', () => {
  it('names activity, place, phase and weather in the shape §7 gives', () => {
    expect(describeScene(scene({ activity: 'sleep', at: 'bed' }))).toBe(
      'Biscuit is asleep in the bed. It is night. Snow.'
    );
  });

  it('starts the visit standing on the floor', () => {
    expect(describeScene(scene({ phase: 'morning', weather: 'clear' }))).toBe(
      'Biscuit is standing on the floor. It is morning. Clear.'
    );
  });

  it('says where she is walking to', () => {
    expect(
      describeScene(scene({ activity: 'walk', target: { spot: 'spot.bed', item: 'bed' } }))
    ).toBe('Biscuit is walking to the bed. It is night. Snow.');
    expect(
      describeScene(
        scene({ activity: 'walk', target: { spot: 'item.water.approach', item: 'water' } })
      )
    ).toContain('walking to the water bowl');
  });

  it.each(ACTIVITIES)('has three sentences for %s', (activity) => {
    const sentence = describeScene(scene({ activity, target: { spot: 'x', item: 'toy' } }));
    expect(sentence).toMatch(/^Biscuit is [a-z ]+\. It is night\. Snow\.$/);
  });

  it.each(PLACES)('names the place when she is at %s', (at) => {
    const sentence = describeScene(scene({ activity: 'idle.sit', at }));
    expect(sentence).toMatch(/^Biscuit is sitting (in|at|on|with|by) the [a-z ]+\./);
  });

  it.each(PHASES)('names the %s phase', (phase) => {
    expect(describeScene(scene({ phase }))).toContain(`It is ${phase}.`);
  });

  it.each(WEATHERS)('ends with the %s weather as one word', (weather) => {
    const word = weather.charAt(0).toUpperCase() + weather.slice(1);
    expect(describeScene(scene({ weather }))).toMatch(new RegExp(`\\. ${word}\\.$`));
  });

  it('never speaks in the first person', () => {
    for (const activity of ACTIVITIES) {
      for (const at of PLACES) {
        expect(describeScene(scene({ activity, at }))).not.toMatch(/\b(I|me|my|we|our|us)\b/);
      }
    }
  });
});
