import { describe, expect, it } from 'vitest';

import { bedFor, cueFor } from '../src/lib/cues';
import { initialState } from '../src/lib/domain/director';
import type { SceneState } from '../src/lib/domain/director';

/*
 * What the sound switch plays, derived from one state and the next. The
 * director returns no effects, so the page compares states; these are the
 * rules of that comparison, from `cabin.allium`'s SoundNeverStartsUnasked:
 * "what is heard follows the room — the fire always, the weather outside, and
 * what she is doing where it makes a sound".
 */

function scene(overrides: Partial<SceneState> = {}): SceneState {
  return { ...initialState('evening', 'clear', true), sound: true, ...overrides };
}

describe('the bed', () => {
  it('is the fire alone when the sky is clear', () => {
    expect(bedFor(scene({ weather: 'clear' }))).toEqual(['fire']);
  });

  it('adds rain outside when it rains', () => {
    expect(bedFor(scene({ weather: 'rain' }))).toEqual(['fire', 'rain']);
  });

  it('adds wind outside when it snows', () => {
    expect(bedFor(scene({ weather: 'snow' }))).toEqual(['fire', 'wind']);
  });
});

describe('cues between two states', () => {
  it('are nothing while sound is off, whatever changed', () => {
    const before = scene({ sound: false, weather: 'clear', activity: 'idle.stand' });
    const after = scene({ sound: false, weather: 'rain', activity: 'drink' });
    expect(cueFor(before, after)).toEqual({});
  });

  it('start the bed the moment sound turns on', () => {
    const before = scene({ sound: false, weather: 'snow' });
    const after = scene({ sound: true, weather: 'snow' });
    expect(cueFor(before, after)).toEqual({ bed: ['fire', 'wind'] });
  });

  it('reset the bed when the weather changes', () => {
    expect(cueFor(scene({ weather: 'clear' }), scene({ weather: 'rain' }))).toEqual({
      bed: ['fire', 'rain']
    });
  });

  it('leave the bed alone when nothing about it changed', () => {
    expect(cueFor(scene({ weather: 'rain' }), scene({ weather: 'rain', elapsed: 3 }))).toEqual({});
  });

  it('lap when she starts drinking', () => {
    expect(cueFor(scene({ activity: 'walk' }), scene({ activity: 'drink' }))).toEqual({
      play: ['lapping']
    });
  });

  it('squeak when she starts playing', () => {
    expect(cueFor(scene({ activity: 'idle.stand' }), scene({ activity: 'play' }))).toEqual({
      play: ['squeak']
    });
  });

  it('do not repeat a one-shot while the activity continues', () => {
    expect(cueFor(scene({ activity: 'drink' }), scene({ activity: 'drink', elapsed: 1 }))).toEqual(
      {}
    );
  });

  it('do not replay a one-shot when a pet hands her back to it', () => {
    expect(cueFor(scene({ activity: 'pet' }), scene({ activity: 'play' }))).toEqual({});
    expect(cueFor(scene({ activity: 'pet' }), scene({ activity: 'drink' }))).toEqual({});
  });

  it('make no sound for eating, sleeping or being petted', () => {
    for (const activity of ['eat', 'sleep', 'pet', 'sit', 'lie', 'stand', 'idle.sit'] as const) {
      expect(cueFor(scene({ activity: 'walk' }), scene({ activity }))).toEqual({});
    }
  });

  it('carry both when sound turns on as she starts drinking', () => {
    const before = scene({ sound: false, activity: 'walk' });
    const after = scene({ sound: true, activity: 'drink' });
    expect(cueFor(before, after)).toEqual({ bed: ['fire'], play: ['lapping'] });
  });
});
