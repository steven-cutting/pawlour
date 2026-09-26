import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import PhotoButton from '../src/lib/components/PhotoButton.svelte';

/*
 * PRD.md, photo mode: a plain PNG download from one control. The platform's
 * `Button` carries the 44px target and the pressed ring
 * (EveryControlIsAComfortableTarget, ATouchIsAcknowledged); the word is the
 * name, the camera glyph sits beside it.
 */
describe('PhotoButton', () => {
  it('is a button named Photo that asks for a capture', async () => {
    const oncapture = vi.fn().mockResolvedValue(undefined);
    render(PhotoButton, { oncapture, busy: false });

    await userEvent.click(screen.getByRole('button', { name: 'Photo' }));

    expect(oncapture).toHaveBeenCalledTimes(1);
  });

  it('is unavailable while a capture is in progress', () => {
    render(PhotoButton, { oncapture: vi.fn(), busy: true });

    expect(screen.getByRole('button', { name: 'Photo' })).toBeDisabled();
  });
});
