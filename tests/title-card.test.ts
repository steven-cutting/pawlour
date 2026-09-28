import { render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { GAME_NAME } from '../src/lib/brand';
import TitleCard from '../src/lib/components/TitleCard.svelte';
import { platformFile } from './platform';

/*
 * The loading and saved card. cabin.allium excludes the card (the PRD states
 * it), so what is held here is the PRD's: plain copy, no first person,
 * progress in words as well as a rule, the copy in a polite live region so a
 * reader hears the room arrive, and the platform's look — the lockup the
 * header carries and nothing but the platform's tokens, so the card follows
 * the theme and high contrast and every pair it paints is one the platform
 * measures. The photo frame drawn into the PNG keeps the overlay register;
 * the card does not.
 */
const LOCKUP = `biscuit games / ${GAME_NAME}`;

describe('TitleCard', () => {
  it('draws nothing while hidden', () => {
    const { container } = render(TitleCard, { mode: 'hidden', progress: 0, phase: 'morning' });

    expect(container.textContent).toBe('');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('says the room is loading, under the lockup, with the progress as a rule', () => {
    render(TitleCard, { mode: 'loading', progress: 0.4, phase: 'evening' });

    expect(screen.getByText('Loading the room')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Loading the room' })).toHaveAttribute(
      'aria-valuenow',
      '40'
    );
    expect(screen.getByText(LOCKUP)).toBeInTheDocument();
  });

  it('says a photo was saved, with its caption', () => {
    render(TitleCard, {
      mode: 'photo',
      progress: 1,
      phase: 'night',
      caption: 'Biscuit has stopped watching.'
    });

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Biscuit has stopped watching.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText(LOCKUP)).toBeInTheDocument();
  });

  it('says a photo was saved without a caption too', () => {
    const { container } = render(TitleCard, { mode: 'photo', progress: 1, phase: 'night' });

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\b(I|me|my|we|our|us)\b/);
  });

  it('puts the copy in a polite live region', () => {
    const { container } = render(TitleCard, { mode: 'loading', progress: 0, phase: 'morning' });

    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent('Loading the room');
  });

  // Read from disk, as `overlay-contrast.test.ts` reads its stylesheet: a
  // rendered component carries no styles under jsdom.
  it('paints only tokens the platform declares, and none of the overlay register', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src', 'lib', 'components', 'TitleCard.svelte'),
      'utf8'
    );
    const declared = new Set(
      [...platformFile('app.css').matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1])
    );
    const used = [...source.matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1]);

    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !declared.has(name))).toEqual([]);
    expect(source).not.toMatch(/--overlay-|import '.*overlay\.css'/);
    expect(source).not.toMatch(/clip-path/);
  });
});
