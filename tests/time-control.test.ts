import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TimeControl from '../src/lib/components/TimeControl.svelte';

/*
 * cabin.allium — Cabin.@guarantee TimeFollowsTheClockUntilOverridden: the
 * phase is the clock's until the player chooses one, and Auto hands it back.
 * The platform's `SegmentedControl` is native radios in a fieldset, so the
 * group is one tab stop and arrows move within it; the test holds the role,
 * the names and the one shared group name.
 */
describe('TimeControl', () => {
  it('offers Auto and the three phases as one group', () => {
    render(TimeControl, { value: 'auto', onchange: vi.fn() });

    const group = screen.getByRole('group', { name: 'Time of day' });
    const radios = ['Auto', 'Morning', 'Evening', 'Night'].map((name) =>
      screen.getByRole('radio', { name })
    );
    expect(group).toBeInTheDocument();
    expect(new Set(radios.map((radio) => radio.getAttribute('name'))).size).toBe(1);
    expect(screen.getByRole('radio', { name: 'Auto' })).toBeChecked();
  });

  it('shows the chosen phase', () => {
    render(TimeControl, { value: 'night', onchange: vi.fn() });

    expect(screen.getByRole('radio', { name: 'Night' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Auto' })).not.toBeChecked();
  });

  it('reports a phase, and Auto, by value', async () => {
    const onchange = vi.fn();
    render(TimeControl, { value: 'auto', onchange });

    await userEvent.click(screen.getByRole('radio', { name: 'Evening' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Auto' }));

    expect(onchange.mock.calls).toEqual([['evening'], ['auto']]);
  });
});
