import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import SendDialog from '../src/lib/components/SendDialog.svelte';
import { SEND_CONTROLS } from '../src/lib/data/controls';

/*
 * cabin.allium — Cabin.@guarantee HerControlSaysWhatSheIsDoing: the things she
 * can be sent to are behind her control, in a dialog that carries the
 * platform's Dialog guarantees (H operation.allium: focus enters, Escape
 * closes, focus returns when it goes). Choosing one closes it at once. Where
 * she is carries a state and the words "she is here", never the fill alone
 * (AppearanceNeverCarriesMeaningAlone).
 */
const THINGS = ['Bed', 'Chair', 'Water', 'Food', 'Toy'];

type Props = ComponentProps<typeof SendDialog>;

function props(overrides: Partial<Props> = {}): Props {
  return { items: SEND_CONTROLS, at: 'floor', onselect: vi.fn(), onclose: vi.fn(), ...overrides };
}

describe('SendDialog', () => {
  it('is a dialog named Send Biscuit to holding the five things', () => {
    render(SendDialog, props());

    const dialog = screen.getByRole('dialog', { name: 'Send Biscuit to' });
    for (const name of THINGS) {
      expect(within(dialog).getByRole('button', { name })).toBeInTheDocument();
    }
    // The five, and the Modal's own Close.
    expect(within(dialog).getAllByRole('button')).toHaveLength(THINGS.length + 1);
  });

  it('marks where she is with a state and a word', () => {
    render(SendDialog, props({ at: 'bed' }));

    const bed = screen.getByRole('button', { name: 'Bed, she is here' });
    expect(bed).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Chair' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('button', { current: true })).toHaveLength(1);
  });

  it('marks nothing while she is on the floor', () => {
    render(SendDialog, props());

    expect(screen.queryAllByRole('button', { current: true })).toHaveLength(0);
  });

  it('reports the thing chosen and closes at once', async () => {
    const onselect = vi.fn();
    const onclose = vi.fn();
    render(SendDialog, props({ onselect, onclose }));

    await userEvent.click(screen.getByRole('button', { name: 'Water' }));

    expect(onselect.mock.calls).toEqual([['water']]);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('takes focus when it opens', () => {
    render(SendDialog, props());

    expect(screen.getByRole('dialog', { name: 'Send Biscuit to' })).toContainElement(
      document.activeElement as HTMLElement
    );
  });

  it('closes on Escape and from its Close button', async () => {
    const onclose = vi.fn();
    render(SendDialog, props({ onclose }));

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onclose).toHaveBeenCalledTimes(2);
  });

  it('returns focus to the opener when it goes', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { unmount } = render(SendDialog, props());
    expect(document.activeElement).not.toBe(opener);

    unmount();

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
