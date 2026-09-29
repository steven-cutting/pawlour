import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CameraControl from '../src/lib/components/CameraControl.svelte';

/*
 * cabin.allium's TheCameraFollowsHerUntilPinned: Auto follows her, and a
 * preset pins the picture until Auto hands it back. CONVENTIONS.md §1
 * decision 6 keeps it a diorama cut between fixed positions, never panned.
 * The control is a platform `SegmentedControl`: one tab stop, arrows within.
 */
describe('CameraControl', () => {
  it('offers Auto and every preset as one group, Auto first', () => {
    render(CameraControl, { value: 'auto', onchange: vi.fn() });

    expect(screen.getByRole('group', { name: 'Camera' })).toBeInTheDocument();
    const radios = ['Auto', 'Hearth', 'Window', 'Chair', 'Bowls'].map((name) =>
      screen.getByRole('radio', { name })
    );
    expect(screen.getAllByRole('radio')).toEqual(radios);
    expect(new Set(radios.map((radio) => radio.getAttribute('name'))).size).toBe(1);
    expect(screen.getByRole('radio', { name: 'Auto' })).toBeChecked();
  });

  it('shows a pinned preset', () => {
    render(CameraControl, { value: 'chair', onchange: vi.fn() });

    expect(screen.getByRole('radio', { name: 'Chair' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Auto' })).not.toBeChecked();
  });

  it('reports a preset, and Auto, by value', async () => {
    const onchange = vi.fn();
    render(CameraControl, { value: 'hearth', onchange });

    await userEvent.click(screen.getByRole('radio', { name: 'Bowls' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Auto' }));

    expect(onchange).toHaveBeenNthCalledWith(1, 'bowls');
    expect(onchange).toHaveBeenNthCalledWith(2, 'auto');
  });
});
