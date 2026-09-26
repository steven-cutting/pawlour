<script lang="ts">
  import { ICONS } from '$lib/icons';
  import type { GameIconName } from '$lib/icons';

  /**
   * One of the game's own icons, always decorative.
   *
   * The platform's `Icon` with this game's map: `aria-hidden` unconditionally,
   * because the control it sits in carries the name and an icon that named
   * itself would say everything twice (AppearanceNeverCarriesMeaningAlone,
   * from the glyph's side). `currentColor` makes it the ink of its control.
   */
  let { name, size = 20 }: { name: GameIconName; size?: number } = $props();
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- repo-owned static SVG from src/lib/icons, never user input -->
<span class="icon" style:--icon-size="{size}px" aria-hidden="true">{@html ICONS[name]}</span>

<style>
  .icon {
    display: inline-flex;
  }

  .icon :global(svg) {
    display: block;
    inline-size: var(--icon-size);
    block-size: var(--icon-size);
  }
</style>
