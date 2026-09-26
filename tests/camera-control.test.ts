import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CameraControl from '../src/lib/components/CameraControl.svelte';

/*
 * CONVENTIONS.md §1 decision 6: a fixed diorama with three presets, cut
 * between. The control is the only route to them in v1 (PRD.md, the edge tap
 * is v1.1), a platform `SegmentedControl`: one tab stop, arrows within.
 */
describe('CameraControl', () => {
  it('offers the three presets as one group', () => {
    render(CameraControl, { value: 'hearth', onchange: vi.fn() });

    expect(screen.getByRole('group', { name: 'Camera' })).toBeInTheDocument();
    const radios = ['Hearth', 'Window', 'Chair'].map((name) => screen.getByRole('radio', { name }));
    expect(new Set(radios.map((radio) => radio.getAttribute('name'))).size).toBe(1);
    expect(screen.getByRole('radio', { name: 'Hearth' })).toBeChecked();
  });

  it('shows the chosen preset', () => {
    render(CameraControl, { value: 'chair', onchange: vi.fn() });

    expect(screen.getByRole('radio', { name: 'Chair' })).toBeChecked();
  });

  it('reports the preset by value', async () => {
    const onchange = vi.fn();
    render(CameraControl, { value: 'hearth', onchange });

    await userEvent.click(screen.getByRole('radio', { name: 'Window' }));

    expect(onchange).toHaveBeenCalledWith('window');
  });
});
