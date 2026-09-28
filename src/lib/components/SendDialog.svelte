<script lang="ts">
  import { Button, Modal } from '@steven-cutting/biscuit-games';

  import type { SendControl } from '$lib/data/controls';
  import type { Item, WalkItem } from '$lib/domain/items';
  import GameIcon from './GameIcon.svelte';

  /**
   * The things she can be sent to, behind her control.
   *
   * `cabin.allium`'s HerControlSaysWhatSheIsDoing: the things are in a dialog
   * that carries the platform's Dialog guarantees (the `Modal`'s: focus
   * enters, Escape closes, focus returns to the opener when this unmounts),
   * and choosing one closes it at once. Where she is carries a state (the
   * `Button`'s `current`, `aria-current`) and the words "she is here", never
   * the fill alone (AppearanceNeverCarriesMeaningAlone). The whole name sits
   * in one hidden run with the visible word hidden from the tree: Chromium
   * puts a boundary space around a positioned span, so a hidden suffix after
   * the word would be named "Bed , she is here" there.
   */
  let {
    items,
    at,
    onselect,
    onclose
  }: {
    items: readonly SendControl[];
    at: Item | 'floor';
    onselect: (id: WalkItem) => void;
    onclose: () => void;
  } = $props();
</script>

<Modal title="Send Biscuit to" {onclose}>
  <div class="things">
    {#each items as item (item.id)}
      <Button
        size="md"
        current={item.id === at}
        onclick={() => {
          onselect(item.id);
          onclose();
        }}
      >
        <GameIcon name={item.icon} />
        {#if item.id === at}
          <span class="visually-hidden">{item.label}, she is here</span>
          <span aria-hidden="true">{item.label}</span>
        {:else}
          {item.label}
        {/if}
      </Button>
    {/each}
  </div>
</Modal>

<style>
  .things {
    display: grid;
    gap: var(--s-2);
  }

  .things :global(button) {
    inline-size: 100%;
    justify-content: flex-start;
  }
</style>
