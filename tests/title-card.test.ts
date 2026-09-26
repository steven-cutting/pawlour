import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import TitleCard from '../src/lib/components/TitleCard.svelte';

/*
 * The loading and photo overlay, CONVENTIONS.md §5.3's register. cabin.allium
 * excludes the card (the PRD states it), so what is held here is the PRD's:
 * plain copy, no first person, progress in words as well as a rule, and the
 * copy in a polite live region so a reader hears the room arrive.
 */
describe('TitleCard', () => {
  it('draws nothing while hidden', () => {
    const { container } = render(TitleCard, { mode: 'hidden', progress: 0, phase: 'morning' });

    expect(container.textContent).toBe('');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('says the room is loading, with the progress as a rule', () => {
    render(TitleCard, { mode: 'loading', progress: 0.4, phase: 'evening' });

    expect(screen.getByText('Loading the room')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Loading the room' })).toHaveAttribute(
      'aria-valuenow',
      '40'
    );
    expect(screen.getByText('PAWLOUR')).toBeInTheDocument();
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
    expect(screen.getByText('PAWLOUR')).toBeInTheDocument();
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
});
