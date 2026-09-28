import { render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import ControlBar from '../src/lib/components/ControlBar.svelte';
import { initialState } from '../src/lib/domain/director';
import type { SceneState } from '../src/lib/domain/director';

/*
 * cabin.allium — Cabin.@guarantee EveryItemIsAControl: each thing, each of the
 * two lights, and she herself, reached from a named control outside the
 * canvas. HerControlSaysWhatSheIsDoing: her control says what she is doing in
 * shape and words and is read when reached, never spoken when it changes; the
 * things are behind it and the lights behind one of their own, each an opener
 * that says it opens a dialog; a tap on her stays one tap away. The Dialog
 * guarantees (H operation.allium) are the platform `Modal`'s and are held
 * here only where the bar owes them: focus comes back to the opener.
 */
const DARK = { lamp: false, strings: false };
const ON_THE_FLOOR = 'Biscuit, standing on the floor. Send her somewhere';

type Props = ComponentProps<typeof ControlBar>;

function scene(overrides: Partial<SceneState> = {}): SceneState {
  return { ...initialState('night', 'snow', false), lights: DARK, ...overrides };
}

function props(overrides: Partial<Props> = {}): Props {
  return { scene: scene(), onselect: vi.fn(), ...overrides };
}

const photo = createRawSnippet(() => ({ render: () => '<button type="button">Photo</button>' }));

const her = () => screen.getByRole('button', { name: /^Biscuit, / });
const lights = () => screen.getByRole('button', { name: /^Lights: / });

describe('ControlBar', () => {
  it('is her, the lights, Pet and the page’s last control, in that order', () => {
    render(ControlBar, props({ children: photo }));

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[0]).toHaveAccessibleName(ON_THE_FLOOR);
    expect(buttons[1]).toHaveAccessibleName('Lights: lamp off, lights off');
    expect(buttons[2]).toHaveAccessibleName('Pet');
    expect(buttons[3]).toHaveAccessibleName('Photo');
  });

  it('says what she is doing in words, and never speaks it unasked', async () => {
    const { container, rerender } = render(ControlBar, props());

    expect(her()).toHaveAccessibleName(ON_THE_FLOOR);

    await rerender({ scene: scene({ activity: 'drink', at: 'water' }) });
    expect(her()).toHaveAccessibleName('Biscuit, drinking at the water bowl. Send her somewhere');

    await rerender({
      scene: scene({ activity: 'walk', at: 'water', target: { spot: 'spot.bed', item: 'bed' } })
    });
    expect(her()).toHaveAccessibleName('Biscuit, walking to the bed. Send her somewhere');

    await rerender({ scene: scene({ activity: 'pet', at: 'bed' }) });
    expect(her()).toHaveAccessibleName('Biscuit, being petted in the bed. Send her somewhere');

    // The hidden sentence beside the canvas is the one voice that says the room.
    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('says each light’s state as a visible word, and follows it', async () => {
    const { rerender } = render(
      ControlBar,
      props({ scene: scene({ lights: { lamp: true, strings: false } }) })
    );

    expect(lights()).toHaveAccessibleName('Lights: lamp on, lights off');
    expect(lights()).toHaveTextContent('on');
    expect(lights()).toHaveTextContent('off');

    await rerender({ scene: scene({ lights: { lamp: false, strings: true } }) });

    expect(lights()).toHaveAccessibleName('Lights: lamp off, lights on');
  });

  it('says that her control and the lights open a dialog, and Pet does not', () => {
    render(ControlBar, props());

    expect(her()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(lights()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.getByRole('button', { name: 'Pet' })).not.toHaveAttribute('aria-haspopup');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pets her at once', async () => {
    const onselect = vi.fn();
    render(ControlBar, props({ onselect }));

    await userEvent.click(screen.getByRole('button', { name: 'Pet' }));

    expect(onselect.mock.calls).toEqual([['biscuit']]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('reaches her by keyboard', async () => {
    const onselect = vi.fn();
    render(ControlBar, props({ onselect }));

    screen.getByRole('button', { name: 'Pet' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onselect).toHaveBeenCalledWith('biscuit');
  });

  it('opens the things behind her control, sends her, and hands focus back', async () => {
    const onselect = vi.fn();
    render(ControlBar, props({ onselect, scene: scene({ activity: 'sleep', at: 'bed' }) }));

    await userEvent.click(her());
    const dialog = await screen.findByRole('dialog', { name: 'Send Biscuit to' });
    expect(within(dialog).getByRole('button', { name: 'Bed, she is here' })).toHaveAttribute(
      'aria-current',
      'true'
    );

    await userEvent.click(within(dialog).getByRole('button', { name: 'Water' }));

    expect(onselect.mock.calls).toEqual([['water']]);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(document.activeElement).toBe(her());
  });

  it('opens the lights, leaves them open across a toggle, and hands focus back on Escape', async () => {
    const onselect = vi.fn();
    render(ControlBar, props({ onselect }));

    await userEvent.click(lights());
    const dialog = await screen.findByRole('dialog', { name: 'Lights' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Lamp, off' }));

    expect(onselect.mock.calls).toEqual([['lamp']]);
    expect(screen.getByRole('dialog', { name: 'Lights' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(document.activeElement).toBe(lights());
  });
});
