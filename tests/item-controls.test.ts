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
 */
const NAMES = ['Bed', 'Chair', 'Water', 'Food', 'Toy', 'Lamp', 'Lights', 'Pet'];

describe('ItemControls', () => {
  it('is a button per thing, and one for her', () => {
    render(ItemControls, { items: ITEM_CONTROLS, active: 'floor', onselect: vi.fn() });

    for (const name of NAMES) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button')).toHaveLength(NAMES.length);
  });

  it('marks where she is with a state and a word', () => {
    render(ItemControls, { items: ITEM_CONTROLS, active: 'bed', onselect: vi.fn() });

    const bed = screen.getByRole('button', { name: 'Bed, she is here' });
    expect(bed).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Chair' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('button', { current: true })).toHaveLength(1);
  });

  it('never marks her own button, because she is not somewhere to be at', () => {
    render(ItemControls, { items: ITEM_CONTROLS, active: 'floor', onselect: vi.fn() });

    expect(screen.getByRole('button', { name: 'Pet' })).not.toHaveAttribute('aria-current');
    expect(screen.queryAllByRole('button', { current: true })).toHaveLength(0);
  });

  it('reports the thing tapped by id', async () => {
    const onselect = vi.fn();
    render(ItemControls, { items: ITEM_CONTROLS, active: 'floor', onselect });

    await userEvent.click(screen.getByRole('button', { name: 'Water' }));
    await userEvent.click(screen.getByRole('button', { name: 'Lights' }));

    expect(onselect.mock.calls).toEqual([['water'], ['lights']]);
  });

  it('reaches her by keyboard and reports biscuit', async () => {
    const onselect = vi.fn();
    render(ItemControls, { items: ITEM_CONTROLS, active: 'floor', onselect });

    screen.getByRole('button', { name: 'Pet' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onselect).toHaveBeenCalledWith('biscuit');
  });

  it('lets the page close the row with one more control', () => {
    render(ItemControls, {
      items: ITEM_CONTROLS,
      active: 'floor',
      onselect: vi.fn(),
      children: createRawSnippet(() => ({ render: () => '<button type="button">Photo</button>' }))
    });

    expect(screen.getAllByRole('button')).toHaveLength(NAMES.length + 1);
    expect(screen.getAllByRole('button').at(-1)).toHaveAccessibleName('Photo');
  });
});
