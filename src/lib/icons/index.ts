/**
 * The game's own icons, for the things in the room.
 *
 * The platform's `Icon` map has no bed, bowl or paw, so this game carries the
 * nine it needs the way the platform carries its own: Lucide SVGs restroked to
 * 1.5 with `stroke="currentColor"`, inlined through `?raw`, covered by the ISC
 * text beside them. They live here rather than under `src/lib/assets/` because
 * the asset manifest walks that directory and has no source form for an ISC
 * file. `GameIcon` renders one; a name not here is a type error.
 */
import armchair from './armchair.svg?raw';
import bed from './bed.svg?raw';
import bone from './bone.svg?raw';
import camera from './camera.svg?raw';
import glassWater from './glass-water.svg?raw';
import hand from './hand.svg?raw';
import lampFloor from './lamp-floor.svg?raw';
import sparkles from './sparkles.svg?raw';
import toyBrick from './toy-brick.svg?raw';

export const ICONS = {
  armchair,
  bed,
  bone,
  camera,
  'glass-water': glassWater,
  hand,
  'lamp-floor': lampFloor,
  sparkles,
  'toy-brick': toyBrick
} as const;

export type GameIconName = keyof typeof ICONS;
