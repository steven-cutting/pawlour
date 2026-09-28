import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';

import Stage from '../src/lib/components/Stage.svelte';

/*
 * The page's layout (P21, decision 0016): the platform's chrome in its shell,
 * the room outside any shell, and the caption, the controls and the notice
 * beside or under it. What a layout engine alone can measure, the room's box
 * at the pinned viewports, is `stories/Stage.stories.svelte`'s; here is what
 * the markup owes whatever the width: the three slots in reading order, and
 * the room and what goes with it inside the page's one `main` landmark.
 */
const header = createRawSnippet(() => ({ render: () => '<h1>biscuit games / pawlour</h1>' }));
const room = createRawSnippet(() => ({ render: () => '<img alt="The room" src="" />' }));
const aside = createRawSnippet(() => ({ render: () => '<button type="button">Pet</button>' }));

describe('Stage', () => {
  it('renders the header, the room and the aside in reading order', () => {
    render(Stage, { header, room, aside });

    const heading = screen.getByRole('heading', { level: 1, name: 'biscuit games / pawlour' });
    const picture = screen.getByRole('img', { name: 'The room' });
    const pet = screen.getByRole('button', { name: 'Pet' });
    expect(heading.compareDocumentPosition(picture)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(picture.compareDocumentPosition(pet)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('keeps the room and the aside in the main landmark, and the header out of it', () => {
    render(Stage, { header, room, aside });

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByRole('img', { name: 'The room' }));
    expect(main).toContainElement(screen.getByRole('button', { name: 'Pet' }));
    expect(main).not.toContainElement(screen.getByRole('heading', { level: 1 }));
  });
});
