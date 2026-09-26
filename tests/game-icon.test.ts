import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import GameIcon from '../src/lib/components/GameIcon.svelte';
import { ICONS } from '../src/lib/icons';
import type { GameIconName } from '../src/lib/icons';

/*
 * H `appearance.allium` AppearanceNeverCarriesMeaningAlone, seen from the
 * glyph's side: an icon sits beside the words and never instead of them, so it
 * is hidden from the accessibility tree and the control around it carries the
 * name. The map is the whole icon API, held equal to the directory as the
 * platform's own `icons.test.ts` does.
 */

const NAMES = Object.keys(ICONS) as GameIconName[];

describe('GameIcon', () => {
  it.each(NAMES)('draws %s as an inline svg the tree never sees', (name) => {
    const { container } = render(GameIcon, { name });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('stroke-width')).toBe('1.5');
    expect(svg?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('takes a size in pixels', () => {
    const { container } = render(GameIcon, { name: 'camera', size: 24 });

    expect(container.querySelector('.icon')?.getAttribute('style')).toContain('24px');
  });

  it('maps every file in the directory and nothing else', () => {
    const files = readdirSync(resolve(process.cwd(), 'src', 'lib', 'icons'))
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.slice(0, -'.svg'.length))
      .sort();

    expect([...NAMES].sort()).toEqual(files);
  });
});
