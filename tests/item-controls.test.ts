import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import ItemControls from '../src/lib/components/ItemControls.svelte';
import { ITEM_CONTROLS } from '../src/lib/data/controls';

/*
 * cabin.allium — Cabin.@guarantee EveryItemIsAControl: each thing she can be
 * sent to, each of the two lights, and she herself, as a named control outside
 * the canvas, reached by keyboard the way a thumb reaches the room
 * (FullyKeyboardOperable). Where she is carries a word as well as a state
 * (AppearanceNeverCarriesMeaningAlone): the platform `Button`'s `current`.
 * A light's button carries its state in its name, because the canvas that
 * shows it lit is hidden from the tree.
 */
const DARK = { lamp: false, strings: false };
const NAMES = ['Bed', 'Chair', 'Water', 'Food', 'Toy', 'Lamp, off', 'Lights, off', 'Pet'];

describe('ItemControls', () => {
  it('is a button per thing, one per light, and one for her', () => {
    render(ItemControls, {
      items: ITEM_CONTROLS,
      active: 'floor',
      lights: DARK,
      onselect: vi.fn()
    });

    for (const name of NAMES) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button')).toHaveLength(NAMES.length);
  });

  it('marks where she is with a state and a word', () => {
    render(ItemControls, { items: ITEM_CONTROLS, active: 'bed', lights: DARK, onselect: vi.fn() });

    const bed = screen.getByRole('button', { name: 'Bed, she is here' });
    expect(bed).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Chair' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('button', { current: true })).toHaveLength(1);
  });

  it('never marks her own button, because she is not somewhere to be at', () => {
    render(ItemControls, {
      items: ITEM_CONTROLS,
      active: 'floor',
      lights: DARK,
      onselect: vi.fn()
    });

    expect(screen.getByRole('button', { name: 'Pet' })).not.toHaveAttribute('aria-current');
    expect(screen.queryAllByRole('button', { current: true })).toHaveLength(0);
  });

  it('names each light with its state, and follows it', async () => {
    const { rerender } = render(ItemControls, {
      items: ITEM_CONTROLS,
      active: 'floor',
      lights: { lamp: true, strings: false },
      onselect: vi.fn()
    });

    expect(screen.getByRole('button', { name: 'Lamp, on' })).toHaveTextContent('on');
    expect(screen.getByRole('button', { name: 'Lights, off' })).toHaveTextContent('off');
    expect(screen.getByRole('button', { name: 'Lamp, on' })).not.toHaveAttribute('aria-current');

    await rerender({ lights: { lamp: false, strings: true } });

    expect(screen.getByRole('button', { name: 'Lamp, off' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lights, on' })).toBeInTheDocument();
  });

  it('reports the thing tapped by id', async () => {
    const onselect = vi.fn();
    render(ItemControls, { items: ITEM_CONTROLS, active: 'floor', lights: DARK, onselect });

    await userEvent.click(screen.getByRole('button', { name: 'Water' }));
    await userEvent.click(screen.getByRole('button', { name: 'Lights, off' }));

    expect(onselect.mock.calls).toEqual([['water'], ['lights']]);
  });

  it('reaches her by keyboard and reports biscuit', async () => {
    const onselect = vi.fn();
    render(ItemControls, { items: ITEM_CONTROLS, active: 'floor', lights: DARK, onselect });

    screen.getByRole('button', { name: 'Pet' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onselect).toHaveBeenCalledWith('biscuit');
  });

  it('lets the page close the row with one more control', () => {
    render(ItemControls, {
      items: ITEM_CONTROLS,
      active: 'floor',
      lights: DARK,
      onselect: vi.fn(),
      children: createRawSnippet(() => ({ render: () => '<button type="button">Photo</button>' }))
    });

    expect(screen.getAllByRole('button')).toHaveLength(NAMES.length + 1);
    expect(screen.getAllByRole('button').at(-1)).toHaveAccessibleName('Photo');
  });
});
