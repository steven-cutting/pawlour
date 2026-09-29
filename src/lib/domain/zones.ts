/**
 * The camera presets, and the part of the room each one owns.
 *
 * `cabin.allium`'s TheCameraFollowsHerUntilPinned: until the player pins a
 * preset, every place she can stand belongs to one of them, and the picture
 * cuts to it as she walks into its part of the room. The places are the
 * room's own node names: its waypoints, the spot in front of each thing, and
 * the two she settles on. The director cannot read the room, so the map lives
 * here, and `tests/scene-assets.test.ts` holds it to the real room: every
 * node named once, and each preset seeing its zone and one step beyond it
 * with nothing in the way.
 *
 * The bowls are a close-up the picture cuts to as she reaches a bowl, and the
 * chair one it cuts to as she reaches the seat; the hearth, the wide one,
 * keeps the middle of the room and its left side, and the window the right.
 */
export const CAMERAS = ['hearth', 'window', 'chair', 'bowls'] as const;
export type Camera = (typeof CAMERAS)[number];

export const ZONES: Readonly<Record<Camera, readonly string[]>> = {
  hearth: [
    'nav.0',
    'nav.1',
    'nav.3',
    'nav.5',
    'nav.7',
    'item.bed.approach',
    'spot.bed',
    'item.lights.approach',
    'item.jar.approach'
  ],
  window: [
    'nav.2',
    'nav.4',
    'nav.6',
    'item.chair.approach',
    'item.lamp.approach',
    'item.toy.approach'
  ],
  chair: ['spot.chair'],
  bowls: ['item.water.approach', 'item.food.approach']
};

/** The preset whose part of the room a node is in, or undefined for a name the map does not know. */
export function zoneOf(node: string): Camera | undefined {
  return CAMERAS.find((camera) => ZONES[camera].includes(node));
}
