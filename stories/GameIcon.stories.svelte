<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect } from 'storybook/test';

  import GameIcon from '../src/lib/components/GameIcon.svelte';
  import { ICONS } from '../src/lib/icons';
  import type { GameIconName } from '../src/lib/icons';

  const NAMES = Object.keys(ICONS) as GameIconName[];

  const OVERVIEW = [
    'The game’s own icons: the things in the room, which the platform’s map has no glyph',
    'for. Lucide, restroked to 1.5 like the platform’s, inlined so each is a real `<svg>`',
    'in the ink of its control.',
    '',
    'H `appearance.allium` — AppearanceNeverCarriesMeaningAlone, from the glyph’s side: an',
    'icon is `aria-hidden` and sits beside the words, never instead of them. The play holds',
    'every one silent.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/GameIcon',
    component: GameIcon,
    tags: ['autodocs'],
    parameters: { docs: { description: { component: OVERVIEW } } },
    args: { name: 'bed', size: 24 }
  });
</script>

<Story name="Bed" />

<Story
  name="Every icon"
  play={async ({ canvasElement }) => {
    const hidden = canvasElement.querySelectorAll('[aria-hidden="true"] svg');
    await expect(hidden).toHaveLength(NAMES.length);
  }}
>
  {#snippet template()}
    <ul class="set">
      {#each NAMES as name (name)}
        <li><GameIcon {name} size={24} /><span>{name}</span></li>
      {/each}
    </ul>
  {/snippet}
</Story>

<style>
  .set {
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: var(--s-6) var(--s-9);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text);
  }

  li {
    display: flex;
    gap: var(--s-4);
    align-items: center;
    font-family: var(--font-ui);
    font-size: var(--fs-small);
  }
</style>
