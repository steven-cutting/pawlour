import { describe, expect, it } from 'vitest';

import { fireLevel, idleWeights, phaseAt, phaseForHour } from '../src/lib/domain/phases';
import type { Phase } from '../src/lib/domain/phases';
import { chooseWeather } from '../src/lib/domain/weather';
import type { Weather } from '../src/lib/domain/weather';
import { createFakeRandom } from '../src/lib/ports/random';

const PHASES: readonly Phase[] = ['morning', 'evening', 'night'];

function share(entries: readonly string[], entry: string): number {
  return entries.filter((each) => each === entry).length / entries.length;
}

/*
 * TimeFollowsTheClockUntilOverridden: morning from `morning_starts`, evening
 * from `evening_starts`, and night from `night_starts` until the next morning.
 * The override is the director's; this is the clock's half.
 */
describe('the phase the clock is in', () => {
  it('is morning from five until two in the afternoon', () => {
    expect(phaseForHour(5)).toBe('morning');
    expect(phaseForHour(9)).toBe('morning');
    expect(phaseForHour(13)).toBe('morning');
  });

  it('is evening from two in the afternoon until nine', () => {
    expect(phaseForHour(14)).toBe('evening');
    expect(phaseForHour(20)).toBe('evening');
  });

  it('is night from nine through midnight until five', () => {
    expect(phaseForHour(21)).toBe('night');
    expect(phaseForHour(23)).toBe('night');
    expect(phaseForHour(0)).toBe('night');
    expect(phaseForHour(4)).toBe('night');
  });

  it('reads the hour a moment falls in through the function it is given', () => {
    const hours = new Map([
      [1_000, 6],
      [2_000, 15],
      [3_000, 22]
    ]);
    const hourOf = (ms: number): number => hours.get(ms) ?? -1;

    expect(phaseAt(1_000, hourOf)).toBe('morning');
    expect(phaseAt(2_000, hourOf)).toBe('evening');
    expect(phaseAt(3_000, hourOf)).toBe('night');
  });

  // The default reads the device's own zone, which is whatever this machine is in.
  it('reads the hour in the device zone by default', () => {
    const moment = Date.UTC(2026, 8, 25, 12);

    expect(phaseAt(moment)).toBe(phaseForHour(new Date(moment).getHours()));
  });
});

describe('what she prefers when she chooses for herself', () => {
  it('plays soonest in the morning', () => {
    const weights = idleWeights('morning');

    expect(share(weights, 'toy')).toBeCloseTo(0.4);
    expect(share(weights, 'water')).toBeCloseTo(0.2);
    expect(share(weights, 'sit')).toBeCloseTo(0.2);
    expect(share(weights, 'bed')).toBeCloseTo(0.1);
    expect(share(weights, 'chair')).toBeCloseTo(0.1);
  });

  it('favours the chair by evening', () => {
    const weights = idleWeights('evening');

    expect(share(weights, 'chair')).toBeCloseTo(0.3);
    expect(share(weights, 'bed')).toBeCloseTo(0.2);
    expect(share(weights, 'sit')).toBeCloseTo(0.2);
    expect(share(weights, 'water')).toBeCloseTo(0.15);
    expect(share(weights, 'toy')).toBeCloseTo(0.15);
  });

  it('goes to bed soonest at night', () => {
    const weights = idleWeights('night');

    expect(share(weights, 'bed')).toBeCloseTo(0.5);
    expect(share(weights, 'chair')).toBeCloseTo(0.3);
    expect(share(weights, 'sit')).toBeCloseTo(0.2);
  });

  it('never chooses food for herself', () => {
    for (const phase of PHASES) {
      expect(idleWeights(phase)).not.toContain('food');
    }
  });
});

describe('the fire', () => {
  it('burns brighter as the day goes on', () => {
    expect(fireLevel('morning')).toBe(0.35);
    expect(fireLevel('evening')).toBe(0.7);
    expect(fireLevel('night')).toBe(1);
  });
});

describe('the weather', () => {
  it('is clear half the time, rain three in ten and snow one in five', () => {
    const drawn: Weather[] = [];
    for (let offset = 0; offset < 10; offset += 1) {
      drawn.push(chooseWeather(createFakeRandom([offset])));
    }

    expect(share(drawn, 'clear')).toBeCloseTo(0.5);
    expect(share(drawn, 'rain')).toBeCloseTo(0.3);
    expect(share(drawn, 'snow')).toBeCloseTo(0.2);
  });

  it('is chosen through the random port', () => {
    expect(chooseWeather(createFakeRandom([0]))).toBe('clear');
    expect(chooseWeather(createFakeRandom([9]))).toBe('snow');
  });
});
