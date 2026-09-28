<script lang="ts">
  import { Button, Modal } from '@steven-cutting/biscuit-games';

  import type { LightControl } from '$lib/data/controls';
  import type { SceneState } from '$lib/domain/director';
  import { lightFor } from '$lib/domain/items';
  import GameIcon from './GameIcon.svelte';

  /**
   * The two lights, behind a control of their own.
   *
   * `cabin.allium`'s HerControlSaysWhatSheIsDoing: a dialog carrying the
   * platform's Dialog guarantees, and a toggle leaves it open so both lights
   * can be set in one visit. The canvas that shows a light lit is
   * `aria-hidden`, so each button carries "on" or "off" in its name and as a
   * visible word (FullyKeyboardOperable: the state of the control focus lands
   * on is reported as well as drawn). The platform `Button` has no `pressed`,
   * so the state is in the name rather than `aria-pressed`. One hidden run
   * for the name, the visible words hidden from the tree, as `SendDialog`
   * says why.
   */
  let {
    items,
    lights,
    onselect,
    onclose
  }: {
    items: readonly LightControl[];
    lights: SceneState['lights'];
    onselect: (id: LightControl['id']) => void;
    onclose: () => void;
  } = $props();
</script>

<Modal title="Lights" {onclose}>
  <div class="lights">
    {#each items as light (light.id)}
      {@const state = lights[lightFor(light.id)] ? 'on' : 'off'}
      <Button
        size="md"
        onclick={() => {
          onselect(light.id);
        }}
      >
        <GameIcon name={light.icon} />
        <span class="visually-hidden">{light.label}, {state}</span>
        <span aria-hidden="true">{light.label}</span>
        <span class="state" aria-hidden="true">{state}</span>
      </Button>
    {/each}
  </div>
</Modal>

<style>
  .lights {
    display: grid;
    gap: var(--s-2);
  }

  .lights :global(button) {
    inline-size: 100%;
    justify-content: flex-start;
  }

  /* The word, not a fade: opacity would spend the contrast the button owes. */
  .state {
    margin-inline-start: auto;
    font-weight: 400;
  }
</style>
