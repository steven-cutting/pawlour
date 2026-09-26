import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Caption from '../src/lib/components/Caption.svelte';

/*
 * cabin.allium — Cabin.@guarantee ACaptionIsShownAndAnnounced: shown in words
 * and announced in the same words. The platform's `Notice` is both at once
 * (visible text with role="status"), so the caption is one live region that
 * stays mounted and whose contents come and go; a second announcer would be
 * heard twice.
 */
describe('Caption', () => {
  it('keeps a silent status region when there is nothing to say', () => {
    render(Caption, {});

    const region = screen.getByRole('status');
    expect(region).toBeInTheDocument();
    expect(region).toHaveTextContent('');
  });

  it('shows the sentence in the status region', () => {
    render(Caption, { caption: { text: 'Biscuit has gone to bed.', sequence: 1 } });

    expect(screen.getByRole('status')).toHaveTextContent('Biscuit has gone to bed.');
  });

  it('replaces the nodes when the sequence advances, so a repeat is heard', async () => {
    const { rerender } = render(Caption, {
      caption: { text: 'Biscuit has allowed it.', sequence: 1 }
    });
    const before = screen.getByText('Biscuit has allowed it.');

    await rerender({ caption: { text: 'Biscuit has allowed it.', sequence: 2 } });

    const after = screen.getByText('Biscuit has allowed it.');
    expect(after).not.toBe(before);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('falls silent again when the caption clears', async () => {
    const { rerender } = render(Caption, {
      caption: { text: 'The chair is occupied.', sequence: 1 }
    });

    await rerender({ caption: undefined });

    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
