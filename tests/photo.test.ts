import { describe, expect, it } from 'vitest';

import type { Phase } from '../src/lib/domain/phases';
import { composePhoto } from '../src/lib/photo';
import type { Placed, Polygon } from '../src/lib/photo';

/*
 * The photo card, composed without a canvas: geometry and words the page draws
 * over the captured frame. `PRD.md` forbids first-person copy anywhere; the
 * register is CONVENTIONS.md §5.3's (scarlet, black and white panels split by
 * hard diagonals, the word in the display face).
 */

const PHASES: readonly Phase[] = ['morning', 'evening', 'night'];
const FRAME = { width: 1170, height: 2532 };

function inside(polygon: Polygon, width: number, height: number): boolean {
  return polygon.points.every(
    (point) => point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height
  );
}

function words(texts: readonly Placed[]): string {
  return texts.map((text) => text.text).join(' ');
}

describe('composePhoto', () => {
  it.each(PHASES)('carries the word and the %s phase over a scarlet band', (phase) => {
    const card = composePhoto({ ...FRAME, phase });

    expect(card.panels.map((panel) => panel.fill)).toContain('scarlet');
    expect(card.panels.every((panel) => inside(panel, FRAME.width, FRAME.height))).toBe(true);
    expect(card.panels.every((panel) => panel.points.length >= 3)).toBe(true);

    const word = card.texts.find((text) => text.text === 'PAWLOUR');
    expect(word).toMatchObject({ font: 'display', ink: 'black' });
    expect(words(card.texts)).toContain(phase.charAt(0).toUpperCase() + phase.slice(1));
  });

  it.each(PHASES)('adds a black wedge with the caption in white by %s', (phase) => {
    const caption = 'Biscuit has gone to bed.';
    const card = composePhoto({ ...FRAME, phase, caption });

    expect(card.panels.map((panel) => panel.fill)).toEqual(['scarlet', 'black']);
    const placed = card.texts.find((text) => text.text === caption);
    expect(placed).toMatchObject({ ink: 'white', font: 'ui' });
    expect(card.panels.every((panel) => inside(panel, FRAME.width, FRAME.height))).toBe(true);
  });

  it('has no wedge and no caption text without a caption', () => {
    const card = composePhoto({ ...FRAME, phase: 'night' });

    expect(card.panels.map((panel) => panel.fill)).toEqual(['scarlet']);
    expect(card.texts.map((text) => text.text)).toEqual(['PAWLOUR', 'Night']);
  });

  it('places every text inside the frame with a positive size', () => {
    const card = composePhoto({ ...FRAME, phase: 'morning', caption: 'The rope has lost.' });

    for (const text of card.texts) {
      expect(text.x).toBeGreaterThanOrEqual(0);
      expect(text.x).toBeLessThanOrEqual(FRAME.width);
      expect(text.y).toBeGreaterThanOrEqual(0);
      expect(text.y).toBeLessThanOrEqual(FRAME.height);
      expect(text.size).toBeGreaterThan(0);
    }
  });

  it('scales with the frame rather than carrying fixed pixels', () => {
    const small = composePhoto({ width: 300, height: 600, phase: 'evening' });
    const large = composePhoto({ width: 600, height: 1200, phase: 'evening' });

    small.panels.forEach((panel, index) => {
      panel.points.forEach((point, at) => {
        expect(large.panels[index]?.points[at]).toEqual({ x: point.x * 2, y: point.y * 2 });
      });
    });
    small.texts.forEach((text, index) => {
      expect(large.texts[index]).toMatchObject({
        x: text.x * 2,
        y: text.y * 2,
        size: text.size * 2
      });
    });
  });

  it('speaks in no first person', () => {
    const card = composePhoto({ ...FRAME, phase: 'night', caption: 'Biscuit has allowed it.' });

    expect(words(card.texts)).not.toMatch(/\b(I|me|my|we|our|us)\b/);
  });

  it('is deterministic', () => {
    const one = composePhoto({ ...FRAME, phase: 'night', caption: 'Dinner has been located.' });
    const two = composePhoto({ ...FRAME, phase: 'night', caption: 'Dinner has been located.' });

    expect(one).toEqual(two);
  });
});
