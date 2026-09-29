import { describe, expect, it } from 'vitest';

import { CAMERAS, ZONES, zoneOf } from '../src/lib/domain/zones';

/*
 * TheCameraFollowsHerUntilPinned: every place she can stand belongs to one
 * position. The map is the director's, because it cannot read the room;
 * `scene-assets.test.ts` holds it to the real room's nodes and sight lines.
 */
describe('the zones of the room', () => {
  it('names the four floor presets first, hearth opening', () => {
    expect(CAMERAS.slice(0, 4)).toEqual(['hearth', 'window', 'chair', 'bowls']);
    expect(Object.keys(ZONES)).toEqual([...CAMERAS]);
  });

  it('gives every place to exactly one preset', () => {
    const names = CAMERAS.flatMap((camera) => ZONES[camera]);
    expect(new Set(names).size).toBe(names.length);
    for (const camera of CAMERAS)
      for (const node of ZONES[camera]) expect(zoneOf(node)).toBe(camera);
  });

  it('opens on the hearth, where she stands at nav.0', () => {
    expect(zoneOf('nav.0')).toBe('hearth');
  });

  it('cuts to the bowls at the bowls, and to the chair on its seat', () => {
    expect(zoneOf('item.water.approach')).toBe('bowls');
    expect(zoneOf('item.food.approach')).toBe('bowls');
    expect(zoneOf('nav.3')).toBe('hearth');
    expect(zoneOf('spot.chair')).toBe('chair');
  });

  it('knows nothing of a place the room does not name', () => {
    expect(zoneOf('nowhere')).toBeUndefined();
  });
});
