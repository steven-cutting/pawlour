/**
 * The photo card, composed as geometry and words.
 *
 * Photo mode (`PRD.md`) saves the captured frame with the game's title card
 * over it: CONVENTIONS.md §5.3's register, flat scarlet, black and white panels
 * split by hard diagonals, the word in the display face. This is pure so the
 * layout is tested to the floor; the page draws the result onto a canvas with
 * the tokens in `components/overlay.css`. Every figure scales from the frame,
 * so any capture size composes the same card.
 */
import type { Phase } from './domain/phases';

export type Fill = 'scarlet' | 'black' | 'white';
export type Ink = 'black' | 'white';

export interface Point2 {
  x: number;
  y: number;
}
export interface Polygon {
  fill: Fill;
  points: readonly Point2[];
}
export interface Placed {
  text: string;
  x: number;
  y: number;
  /** The type size in frame pixels. */
  size: number;
  ink: Ink;
  font: 'display' | 'ui';
  align: 'left' | 'right';
}
export interface PhotoCard {
  panels: readonly Polygon[];
  texts: readonly Placed[];
}
export interface PhotoInput {
  width: number;
  height: number;
  caption?: string;
  phase: Phase;
}

/** The band across the bottom, as a fraction of the height. */
const BAND = 0.2;

export function composePhoto({ width, height, caption, phase }: PhotoInput): PhotoCard {
  const band = height * BAND;
  const bottom = height;
  const scarlet: Polygon = {
    fill: 'scarlet',
    points: [
      { x: 0, y: bottom - band * 1.25 },
      { x: width, y: bottom - band * 0.75 },
      { x: width, y: bottom },
      { x: 0, y: bottom }
    ]
  };
  const panels: Polygon[] = [scarlet];
  const texts: Placed[] = [
    {
      text: 'PAWLOUR',
      x: width * 0.04,
      y: bottom - band * 0.15,
      size: band * 0.5,
      ink: 'black',
      font: 'display',
      align: 'left'
    },
    {
      text: phase.charAt(0).toUpperCase() + phase.slice(1),
      x: width * 0.04,
      y: bottom - band * 0.75,
      size: band * 0.22,
      ink: 'black',
      font: 'ui',
      align: 'left'
    }
  ];
  if (caption !== undefined) {
    panels.push({
      fill: 'black',
      points: [
        { x: width * 0.42, y: bottom - band * 0.95 },
        { x: width, y: bottom - band * 0.6 },
        { x: width, y: bottom },
        { x: width * 0.5, y: bottom }
      ]
    });
    texts.push({
      text: caption,
      x: width * 0.97,
      y: bottom - band * 0.2,
      size: band * 0.16,
      ink: 'white',
      font: 'ui',
      align: 'right'
    });
  }
  return { panels, texts };
}
