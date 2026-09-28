<script lang="ts">
  import { Button, Icon } from '@steven-cutting/biscuit-games';
  import type { Snippet } from 'svelte';

  import { iconFor, LIGHT_CONTROLS, SEND_CONTROLS } from '$lib/data/controls';
  import type { LightControl } from '$lib/data/controls';
  import { describeDoing, doingOf } from '$lib/doing';
  import type { SceneState } from '$lib/domain/director';
  import { lightFor } from '$lib/domain/items';
  import type { Item } from '$lib/domain/items';
  import GameIcon from './GameIcon.svelte';
  import LightsDialog from './LightsDialog.svelte';
  import SendDialog from './SendDialog.svelte';

  /**
   * The bar under the room: her, the lights, Pet, and the page's last control.
   *
   * `cabin.allium`'s EveryItemIsAControl and HerControlSaysWhatSheIsDoing. Her
   * control says what she is doing before it offers anything: the paw, then
   * the shape `doingOf` gives, and the words `describeDoing` gives as its
   * name. It carries no live region; the sentence beside the canvas is the
   * one voice that says the room, and a second would be heard twice. The
   * things are behind it and the lights behind a control of their own, each
   * an opener that says so (`aria-haspopup`), and each dialog is mounted or
   * not the way `SettingsDialog` mounts the `Modal`, so focus comes back to
   * the opener when it goes. A tap on her is a reaction rather than an
   * invitation (ATapIsAnInvitation), so Pet stays one tap away.
   *
   * The two openers are native buttons rather than the platform `Button`,
   * which takes no `aria-haspopup`: a recorded deviation, and a hand-back
   * (`popup` on `Button`, `tickets/H01-hub-hand-backs.md`). They restate only
   * the secondary button's boundary from the same tokens; the minimum size,
   * the focus ring and the pressed ring are the platform stylesheet's and
   * reach a bare button unasked (FocusIsVisibleWhereverItLands).
   */
  let {
    scene,
    onselect,
    children
  }: {
    scene: Pick<SceneState, 'activity' | 'at' | 'target' | 'lights'>;
    onselect: (id: Item | 'biscuit') => void;
    children?: Snippet;
  } = $props();

  let sendOpen = $state(false);
  let lightsOpen = $state(false);

  const doing = $derived(doingOf(scene));

  /** The state a light's control carries, on the opener and in the dialog. */
  function lit(id: LightControl['id']): 'on' | 'off' {
    return scene.lights[lightFor(id)] ? 'on' : 'off';
  }

  const lightsName = $derived(
    `Lights: ${LIGHT_CONTROLS.map((light) => `${light.label.toLowerCase()} ${lit(light.id)}`).join(', ')}`
  );
</script>

<div class="bar">
  <button
    type="button"
    class="chip"
    aria-haspopup="dialog"
    onclick={() => {
      sendOpen = true;
    }}
  >
    <span class="visually-hidden">{describeDoing(scene)}</span>
    <GameIcon name="paw-print" />
    {#if doing.kind === 'at'}
      <GameIcon name={iconFor(doing.item)} size={16} />
    {:else if doing.kind === 'pet'}
      <GameIcon name="hand" size={16} />
    {:else if doing.kind === 'heading'}
      <Icon name="arrow-right" size={16} />
      <GameIcon name={iconFor(doing.item)} size={16} />
    {/if}
  </button>
  <button
    type="button"
    class="chip"
    aria-haspopup="dialog"
    onclick={() => {
      lightsOpen = true;
    }}
  >
    <span class="visually-hidden">{lightsName}</span>
    {#each LIGHT_CONTROLS as light (light.id)}
      <span class="light" aria-hidden="true">
        <GameIcon name={light.icon} size={16} />
        <span class="state">{lit(light.id)}</span>
      </span>
    {/each}
  </button>
  <Button
    onclick={() => {
      onselect('biscuit');
    }}
  >
    <GameIcon name="hand" />
    Pet
  </Button>
  {@render children?.()}
</div>

{#if sendOpen}
  <SendDialog
    items={SEND_CONTROLS}
    at={scene.at}
    {onselect}
    onclose={() => {
      sendOpen = false;
    }}
  />
{/if}
{#if lightsOpen}
  <LightsDialog
    items={LIGHT_CONTROLS}
    lights={scene.lights}
    {onselect}
    onclose={() => {
      lightsOpen = false;
    }}
  />
{/if}

<style>
  .bar {
    display: flex;
    gap: var(--s-2);
    align-items: stretch;
  }

  .bar > :global(*) {
    flex: 1 1 auto;
    min-inline-size: 44px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s-1);
    padding: 0 var(--s-2);
    border: var(--rule-w) solid var(--key-untried-rule);
    border-radius: var(--radius-card);
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: var(--fs-micro);
    cursor: pointer;
  }

  .chip:hover {
    background: var(--surface-hover);
  }

  .light {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  /* The word, not a fade: opacity would spend the contrast the button owes. */
  .state {
    font-weight: 400;
    line-height: 1;
  }
</style>
