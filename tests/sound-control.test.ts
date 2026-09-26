import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SoundControl from '../src/lib/components/SoundControl.svelte';

/*
 * cabin.allium — Cabin.@guarantee SoundNeverStartsUnasked: off whenever the
 * room opens; turning the switch on is the only thing that starts sound. The
 * start is awaited inside the change handler so an `AudioContext` begins
 * inside the gesture (CONVENTIONS.md §6.2, §12); when it cannot, the switch
 * stays off and says so in words.
 */
describe('SoundControl', () => {
  it('is a switch named Ambient sound, off by default', () => {
    render(SoundControl, { on: false, onenable: vi.fn(), ondisable: vi.fn() });

    expect(screen.getByRole('switch', { name: 'Ambient sound' })).not.toBeChecked();
  });

  it('shows on when the page says so', () => {
    render(SoundControl, { on: true, onenable: vi.fn(), ondisable: vi.fn() });

    expect(screen.getByRole('switch', { name: 'Ambient sound' })).toBeChecked();
  });

  it('starts sound inside the change and reads on once it has', async () => {
    let started = false;
    const onenable = vi.fn(async () => {
      started = true;
      await Promise.resolve();
    });
    const { rerender } = render(SoundControl, { on: false, onenable, ondisable: vi.fn() });

    await userEvent.click(screen.getByRole('switch', { name: 'Ambient sound' }));

    expect(onenable).toHaveBeenCalledTimes(1);
    expect(started).toBe(true);
    await rerender({ on: true, onenable, ondisable: vi.fn() });
    expect(screen.getByRole('switch', { name: 'Ambient sound' })).toBeChecked();
  });

  it('stays off and says so when sound could not start', async () => {
    const onenable = vi.fn().mockRejectedValue(new Error('no context'));
    render(SoundControl, { on: false, onenable, ondisable: vi.fn() });

    await userEvent.click(screen.getByRole('switch', { name: 'Ambient sound' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Sound could not start.');
    });
    expect(screen.getByRole('switch', { name: 'Ambient sound' })).not.toBeChecked();
  });

  it('stops sound when turned off, and drops the failure notice', async () => {
    const ondisable = vi.fn();
    render(SoundControl, { on: true, onenable: vi.fn(), ondisable });

    await userEvent.click(screen.getByRole('switch', { name: 'Ambient sound' }));

    expect(ondisable).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
