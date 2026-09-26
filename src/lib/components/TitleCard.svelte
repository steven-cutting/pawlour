<script lang="ts">
  import type { Phase } from '$lib/domain/phases';
  import './overlay.css';

  /**
   * The loading card and the photo card, in the overlay register.
   *
   * CONVENTIONS.md §5.3: flat scarlet, black and white panels split by a hard
   * diagonal, the word in the display face, no gradient, no rotated letters.
   * DOM over the canvas rather than drawn on it. The copy is plain and in the
   * third person (PRD.md), inside a polite live region so a reader hears the
   * room arrive and the photo save. Hidden, it is nothing at all, so the
   * page's tree carries no empty overlay.
   *
   * The sweep runs on `--dur-3`, which the platform holds at 0ms unless
   * animations are on, so MotionOffIsAStillDiorama costs nothing here.
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
    <div class="scarlet">
      <p class="word">PAWLOUR</p>
    </div>
    <div class="black">
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
    grid-template-rows: 1fr 1fr;
    font-family: var(--font-display);
    /* The ground under the diagonal: the scarlet's cut corner shows black, never the page. */
    background: var(--overlay-black);
    animation: sweep var(--dur-3) var(--ease);
  }

  .scarlet,
  .black {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--s-5);
    padding: var(--s-9) var(--shell-pad);
  }

  .scarlet {
    color: var(--overlay-ink-on-scarlet);
    background: var(--overlay-scarlet);
    clip-path: polygon(0 0, 100% 0, 100% 70%, 0 100%);
    padding-block-end: var(--s-13);
  }

  .black {
    color: var(--overlay-ink-on-black);
    background: var(--overlay-black);
    margin-block-start: calc(-1 * var(--s-11));
    padding-block-start: var(--s-13);
  }

  .word {
    margin: 0;
    font-size: var(--fs-display-1);
    font-weight: 700;
    letter-spacing: var(--track-display);
    line-height: 1;
  }

  .copy {
    margin: 0;
    font-size: var(--fs-title-1);
    font-weight: 600;
  }

  .caption {
    margin: 0;
    font-family: var(--font-ui);
    font-size: var(--fs-body);
  }

  .rule {
    block-size: var(--s-3);
    background: var(--overlay-white);
    clip-path: polygon(0 0, 100% 0, calc(100% - var(--s-3)) 100%, 0 100%);
  }

  .done {
    block-size: 100%;
    background: var(--overlay-scarlet);
  }

  @keyframes sweep {
    from {
      clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
    }

    to {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
  }
</style>
