/*
 * `docs/specs/pawlour.allium` — Play.@guarantee EveryFigureHoldsAtTheNarrowestWidth
 * carries the platform's legibility floors (4.5 for text, 3.0 for a boundary),
 * and H `appearance.allium`'s EveryCombinationMeetsTheLegibilityFloor says they
 * hold in all four combinations of theme and high contrast.
 *
 * The overlay register (CONVENTIONS.md §5.3) is the game's own: scarlet, black
 * and white, declared once in `src/lib/components/overlay.css` under `:root`
 * and unchanged by theme, because the photo frame is painted into the PNG the
 * same whatever the page shows. This reads that file from disk the way the
 * platform's `tests/contrast.test.ts` reads `app.css`, drives every combination
 * through the root attributes anyway, and measures each pair the frame paints.
 * The scarlet was chosen by this test: a P5 scarlet near #e60012 fails white
 * text at 4.5, so the word is black on scarlet and white is only ever on black.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MINIMUM_BOUNDARY_CONTRAST, MINIMUM_TEXT_CONTRAST } from '../src/lib/config';

// Read from disk rather than imported: Vite claims `.css` and hands back an
// empty string, which would assert against an empty cascade.
const overlayCss = readFileSync(
  resolve(process.cwd(), 'src', 'lib', 'components', 'overlay.css'),
  'utf8'
);

let stylesheet: HTMLStyleElement;

beforeEach(() => {
  stylesheet = document.createElement('style');
  stylesheet.textContent = overlayCss;
  document.head.append(stylesheet);
});

afterEach(() => {
  stylesheet.remove();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-high-contrast');
});

/** A token's value, following `var()` to whatever it names; jsdom does not substitute. */
function token(name: string): string {
  const root = document.documentElement;
  let value = getComputedStyle(root).getPropertyValue(name).trim();

  for (let hops = 0; value.startsWith('var('); hops += 1) {
    if (hops > 4) {
      throw new Error(`${name} does not settle: ${value}`);
    }
    value = getComputedStyle(root).getPropertyValue(value.slice('var('.length, -1).trim()).trim();
  }

  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`${name} is ${JSON.stringify(value)}, which is not a six-digit hex colour`);
  }
  return value;
}

/** WCAG 2.2 relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
}

/** WCAG 2.2 contrast, symmetric in its pair. */
function ratio(one: string, other: string): number {
  const [lo, hi] = [luminance(one), luminance(other)].sort((a, b) => a - b);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

interface Combination {
  name: string;
  theme: 'light' | 'dark';
  highContrast: boolean;
}

const COMBINATIONS: readonly Combination[] = [
  { name: 'light', theme: 'light', highContrast: false },
  { name: 'light, high contrast', theme: 'light', highContrast: true },
  { name: 'dark', theme: 'dark', highContrast: false },
  { name: 'dark, high contrast', theme: 'dark', highContrast: true }
];

function apply(combination: Combination): void {
  document.documentElement.setAttribute('data-theme', combination.theme);
  if (combination.highContrast) {
    document.documentElement.setAttribute('data-high-contrast', 'true');
  } else {
    document.documentElement.removeAttribute('data-high-contrast');
  }
}

/** The text pairs the photo frame paints: ink on its ground. */
const TEXT_PAIRS: readonly [ink: string, ground: string][] = [
  ['--overlay-ink-on-scarlet', '--overlay-scarlet'],
  ['--overlay-ink-on-black', '--overlay-black'],
  ['--overlay-ink-on-white', '--overlay-white']
];

/** The edges of the diagonals: scarlet against each neighbour. */
const BOUNDARY_PAIRS: readonly [one: string, other: string][] = [
  ['--overlay-scarlet', '--overlay-black'],
  ['--overlay-scarlet', '--overlay-white']
];

describe.each(COMBINATIONS)('the overlay register under $name', (combination) => {
  beforeEach(() => {
    apply(combination);
  });

  it.each(TEXT_PAIRS)('reads %s on %s at the text floor', (ink, ground) => {
    expect(ratio(token(ink), token(ground))).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST);
  });

  it.each(BOUNDARY_PAIRS)('separates %s from %s at the boundary floor', (one, other) => {
    expect(ratio(token(one), token(other))).toBeGreaterThanOrEqual(MINIMUM_BOUNDARY_CONTRAST);
  });

  it('is the same register whatever the theme says', () => {
    expect(token('--overlay-scarlet')).toBe('#f5222d');
    expect(token('--overlay-black')).toBe('#000000');
    expect(token('--overlay-white')).toBe('#ffffff');
  });
});

describe('the scarlet', () => {
  // The record of why the word is black: white on this scarlet is below the
  // text floor, so the register never sets white type on it.
  it('does not carry white text, which is why the word is set black', () => {
    expect(ratio(token('--overlay-white'), token('--overlay-scarlet'))).toBeLessThan(
      MINIMUM_TEXT_CONTRAST
    );
    expect(token('--overlay-ink-on-scarlet')).toBe(token('--overlay-black'));
  });
});
