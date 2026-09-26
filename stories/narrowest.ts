/*
 * What every story at the narrowest supported width shares: the viewport pin
 * and the measurement. `stories/Lockup.stories.svelte` is the shape; this
 * keeps nine component stories from restating it.
 *
 * The pin is what makes the measurement evidence: the story run's default
 * viewport is 1200px wide, and without it a play would measure a layout no
 * phone renders. The measurement is `DirectManipulation.@invariant
 * EveryControlIsAComfortableTarget`: 44px both ways, and for a radio or a
 * switch the figure belongs to the label that contains it, which is what the
 * finger is aimed at.
 */
import { expect, within } from 'storybook/test';

import { MINIMUM_TOUCH_TARGET, NARROWEST_SUPPORTED_WIDTH } from '../src/lib/config';

/** The gutters `.shell` gives the page at every width. */
export const SHELL_GUTTER = '1rem';
export const FRAME_WIDTH = `${String(NARROWEST_SUPPORTED_WIDTH)}px`;

export const NARROWEST_PARAMETERS = {
  docs: { story: { inline: false } },
  viewport: {
    viewports: {
      narrowest: {
        name: 'Narrowest supported',
        styles: { width: FRAME_WIDTH, height: '568px' }
      }
    },
    defaultViewport: 'narrowest'
  }
} as const;

/** The element a control's target is measured on: the label around a field, else itself. */
function target(control: HTMLElement): HTMLElement {
  return control.closest('label') ?? control;
}

export async function expectNothingScrollsSideways(canvasElement: HTMLElement): Promise<void> {
  const frame = canvasElement.querySelector<HTMLElement>('[data-frame]');
  if (frame === null) {
    throw new Error('This story has no frame to measure against');
  }
  await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
}

/** Every button, radio and switch in the story, measured at the floor both ways. */
export async function expectComfortableTargets(canvasElement: HTMLElement): Promise<void> {
  const canvas = within(canvasElement);
  const controls = [
    ...canvas.queryAllByRole('button'),
    ...canvas.queryAllByRole('radio'),
    ...canvas.queryAllByRole('switch')
  ];
  if (controls.length === 0) {
    throw new Error('This story has no control to measure');
  }
  for (const control of controls) {
    const box = target(control).getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
    await expect(box.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
  }
}
