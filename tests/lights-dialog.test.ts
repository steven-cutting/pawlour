import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import LightsDialog from '../src/lib/components/LightsDialog.svelte';
import { LIGHT_CONTROLS } from '../src/lib/data/controls';

/*
 * cabin.allium — Cabin.@guarantee HerControlSaysWhatSheIsDoing: the two lights
 * are behind a control of their own, in a dialog that carries the platform's
 * Dialog guarantees, and turning one on or off leaves the dialog open so both
 * can be set in one visit. Each light's control carries "on" or "off" in its
 * name and as a visible word, because the canvas that shows it lit is hidden
 * from the tree (FullyKeyboardOperable).
 */
const DARK = { lamp: false, strings: false };

type Props = ComponentProps<typeof LightsDialog>;

function props(overrides: Partial<Props> = {}): Props {
  return { items: LIGHT_CONTROLS, lights: DARK, onselect: vi.fn(), onclose: vi.fn(), ...overrides };
}

describe('LightsDialog', () => {
  it('is a dialog named Lights holding the two toggles, named with their state', () => {
    render(LightsDialog, props());

    const dialog = screen.getByRole('dialog', { name: 'Lights' });
    expect(within(dialog).getByRole('button', { name: 'Lamp, off' })).toHaveTextContent('off');
    expect(within(dialog).getByRole('button', { name: 'Lights, off' })).toHaveTextContent('off');
    expect(within(dialog).getAllByRole('button')).toHaveLength(3);
  });

  it('reports a toggle and stays open', async () => {
    const onselect = vi.fn();
    const onclose = vi.fn();
    render(LightsDialog, props({ onselect, onclose }));

    await userEvent.click(screen.getByRole('button', { name: 'Lamp, off' }));

    expect(onselect.mock.calls).toEqual([['lamp']]);
    expect(onclose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Lights' })).toBeInTheDocument();
  });

  it('follows the lights', async () => {
    const { rerender } = render(LightsDialog, props({ lights: { lamp: true, strings: false } }));

    expect(screen.getByRole('button', { name: 'Lamp, on' })).toHaveTextContent('on');
    expect(screen.getByRole('button', { name: 'Lamp, on' })).not.toHaveAttribute('aria-current');

    await rerender({ lights: { lamp: false, strings: true } });

    expect(screen.getByRole('button', { name: 'Lamp, off' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lights, on' })).toHaveTextContent('on');
  });

  it('takes focus when it opens', () => {
    render(LightsDialog, props());

    expect(screen.getByRole('dialog', { name: 'Lights' })).toContainElement(
      document.activeElement as HTMLElement
    );
  });

  it('closes on Escape and from its Close button', async () => {
    const onclose = vi.fn();
    render(LightsDialog, props({ onclose }));

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onclose).toHaveBeenCalledTimes(2);
  });
});
