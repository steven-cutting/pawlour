<script lang="ts">
  import { Button } from '@steven-cutting/biscuit-games';
  import type { Snippet } from 'svelte';

  import type { ItemControl } from '$lib/data/controls';
  import type { Item } from '$lib/domain/items';
  import GameIcon from './GameIcon.svelte';

  /**
   * The row of things she can be sent to, and her.
   *
   * `cabin.allium`'s EveryItemIsAControl: each thing, each of the two lights,
   * and she herself, as a named control outside the canvas, so a keyboard or
   * a screen reader reaches the room the way a thumb does. The row and the
   * canvas issue identical commands; the canvas's tap is the convenience.
   *
   * Where she is carries a state (`aria-current`, the platform `Button`'s
   * `current`) and a word, never the fill alone
   * (AppearanceNeverCarriesMeaningAlone). Her own button never carries it: she
   * is not somewhere to be at. Three per row at the narrowest width, on a grid
   * the page's gutter frames; `children` is the cell after the last item, so
   * the page's photo control can close the row rather than start another.
   */
  let {
    items,
    active,
    onselect,
    children
  }: {
    items: readonly ItemControl[];
    active: Item | 'floor';
    onselect: (id: Item | 'biscuit') => void;
    children?: Snippet;
  } = $props();
</script>

<div class="row">
  {#each items as item (item.id)}
    <Button
      size="md"
      current={item.id === active}
      onclick={() => {
        onselect(item.id);
      }}
    >
      <GameIcon name={item.icon} />
      {#if item.id === active}
        <!--
          The whole name in one hidden run, the visible word beside it hidden
          from the tree: Chromium puts a boundary space around a positioned
          span, so a hidden suffix after the word would be named "Bed , she is
          here" there and "Bed, she is here" under jsdom.
        -->
        <span class="visually-hidden">{item.label}, she is here</span>
        <span aria-hidden="true">{item.label}</span>
      {:else}
        {item.label}
      {/if}
    </Button>
  {/each}
  {@render children?.()}
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s-4);
  }

  .row :global(button) {
    inline-size: 100%;
  }
</style>
