import { describe, expect, it } from 'vitest';

import { CAPTIONS } from '../src/lib/data/captions';
import { chooseCaption } from '../src/lib/domain/captions';
import type { Settled } from '../src/lib/domain/items';
import { createFakeRandom } from '../src/lib/ports/random';

const KEYS: readonly Settled[] = [
  'sleep.bed',
  'sleep.chair',
  'drink',
  'eat',
  'play',
  'pet',
  'idle.long'
];

const EVERY = Object.values(CAPTIONS).flat();

/*
 * The seed set CONVENTIONS.md §6.3 gives, and the one sentence per row the
 * product requirements' interaction table names. They are the register the
 * rest were written in, so they stay in the bank.
 */
const SEEDS: Readonly<Record<Settled, readonly string[]>> = {
  'sleep.bed': [
    'Biscuit has gone to bed.',
    'Biscuit is asleep in front of the fire.',
    'Biscuit has stopped watching.'
  ],
  'sleep.chair': ['Biscuit has taken the chair.', 'The chair is occupied.'],
  drink: ['Biscuit has had some water.', 'Biscuit is drinking. It is taking a while.'],
  eat: ['Biscuit is eating. Nothing else is happening.', 'Dinner has been located.'],
  play: ['Biscuit has found the rope.', 'The rope has lost.'],
  pet: ['Biscuit has allowed it.', 'Biscuit has decided that was acceptable.'],
  'idle.long': ['Biscuit is considering her options.', 'Nothing has happened for some time.']
};

describe('the caption bank', () => {
  it('holds at least five sentences for everything she settles into', () => {
    expect(Object.keys(CAPTIONS).sort()).toEqual([...KEYS].sort());
    for (const key of KEYS) {
      expect(CAPTIONS[key].length, key).toBeGreaterThanOrEqual(5);
    }
  });

  it('holds at least forty sentences in all, with no sentence twice', () => {
    expect(EVERY.length).toBeGreaterThanOrEqual(40);
    expect(new Set(EVERY).size).toBe(EVERY.length);
  });

  it('keeps the seed sentences under the keys they were written for', () => {
    for (const key of KEYS) {
      expect(CAPTIONS[key]).toEqual(expect.arrayContaining([...SEEDS[key]]));
    }
  });

  it('never exclaims and never asks', () => {
    for (const text of EVERY) {
      expect(text, text).not.toMatch(/[!?]/);
    }
  });

  it('never speaks in the first person', () => {
    for (const text of EVERY) {
      expect(text, text).not.toMatch(/\b(I|me|my|we)\b/i);
    }
  });

  it('keeps every sentence under twelve words', () => {
    for (const text of EVERY) {
      expect(text.split(/\s+/).length, text).toBeLessThan(12);
    }
  });
});

describe('choosing a caption', () => {
  it('chooses uniformly among the sentences for what she is doing', () => {
    const drink = CAPTIONS.drink;

    expect(chooseCaption('drink', [], createFakeRandom([0]))).toBe(drink[0]);
    expect(chooseCaption('drink', [], createFakeRandom([2]))).toBe(drink[2]);
  });

  it('never chooses a sentence already shown this visit', () => {
    const drink = CAPTIONS.drink;
    const shown = drink.slice(0, -1);

    for (const offset of [0, 1, 2, 3, 4, 5]) {
      const chosen = chooseCaption('drink', shown, createFakeRandom([offset]));
      expect(chosen).toBe(drink.at(-1));
      expect(shown).not.toContain(chosen);
    }
  });

  it('has nothing to say once every sentence for it has been shown', () => {
    expect(chooseCaption('pet', CAPTIONS.pet, createFakeRandom())).toBeUndefined();
  });

  it('is not held back by what was shown for something else', () => {
    expect(chooseCaption('eat', CAPTIONS.drink, createFakeRandom([0]))).toBe(CAPTIONS.eat[0]);
  });
});
