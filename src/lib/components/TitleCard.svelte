<script lang="ts">
  import type { Phase } from '$lib/domain/phases';
  import Lockup from './Lockup.svelte';

  /**
   * The loading card and the photo card, in the platform's own chrome.
   *
   * The page it covers is the platform's, so the card is too: the themed
   * ground and ink, the lockup the header carries, the display face for the
   * one line it says. Every token is the platform's, so the card follows the
   * theme and high contrast, and each pair it paints is one the platform
   * measures in all four combinations. The PNG's photo frame keeps the
   * overlay register (`overlay.css`); this card does not.
   *
   * DOM over the canvas, and still: nothing sweeps or fades. The copy is plain
   * and in the third person (PRD.md), inside a polite live region so a reader
   * hears the room arrive and the photo save. Hidden, it is nothing at all, so
   * the page's tree carries no empty overlay. How long it stays is the page's.
   */
  let {
    mode,
    progress,
    caption,
    phase
  }: {
    mode: 'loading' | 'photo' | 'hidden';
    progress: number;
    caption?: string;
    phase: Phase;
  } = $props();

  const percent = $derived(Math.round(Math.min(1, Math.max(0, progress)) * 100));
  const copy = $derived(mode === 'photo' ? 'Saved' : 'Loading the room');
</script>

{#if mode !== 'hidden'}
  <div class="card" data-phase={phase}>
    <div class="column">
      <Lockup />
      <p class="copy" aria-live="polite">{copy}</p>
      {#if mode === 'loading'}
        <div
          class="rule"
          role="progressbar"
          aria-label={copy}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percent}
        >
          <div class="done" style:inline-size="{percent}%"></div>
        </div>
      {:else if caption !== undefined}
        <p class="caption">{caption}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .card {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: grid;
    align-content: center;
    justify-items: center;
    padding: var(--s-9) var(--shell-pad);
    color: var(--text);
    background: var(--background);
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: var(--s-6);
    inline-size: 100%;
    max-inline-size: var(--shell-max);
  }

  .copy {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--fs-display-2);
    font-weight: 700;
    letter-spacing: var(--track-display);
    line-height: 1.1;
  }

  .caption {
    margin: 0;
    color: var(--text-2);
    font-family: var(--font-ui);
    font-size: var(--fs-body);
  }

  .rule {
    block-size: var(--s-2);
    background: var(--rule-strong);
  }

  .done {
    block-size: 100%;
    background: var(--text);
  }
</style>
