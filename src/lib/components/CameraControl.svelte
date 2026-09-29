<script lang="ts">
  import { SegmentedControl } from '@steven-cutting/biscuit-games';

  import { CAMERAS } from '$lib/domain/zones';
  import type { Camera } from '$lib/domain/zones';

  /**
   * Which fixed preset the room is seen from: Auto, or one the player pins.
   *
   * `cabin.allium`'s TheCameraFollowsHerUntilPinned. Auto cuts to the preset
   * whose part of the room she walks into; a preset is a pin that persists
   * (the page stores it) until Auto is chosen again. CONVENTIONS.md §1
   * decision 6: a diorama cut between positions, never panned.
   */
  let { value, onchange }: { value: Camera | 'auto'; onchange: (value: Camera | 'auto') => void } =
    $props();

  /** Every preset needs its label: a new one in `zones.ts` fails the type check until it has one. */
  const LABELS: Readonly<Record<Camera, string>> = {
    hearth: 'Hearth',
    window: 'Window',
    chair: 'Chair',
    bowls: 'Bowls'
  };
  const OPTIONS: readonly { value: Camera | 'auto'; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    ...CAMERAS.map((camera) => ({ value: camera, label: LABELS[camera] }))
  ];

  function chosen(next: string): void {
    const option = OPTIONS.find((each) => each.value === next);
    if (option) onchange(option.value);
  }
</script>

<div class="five">
  <SegmentedControl label="Camera" options={OPTIONS} {value} onchange={chosen} />
</div>

<style>
  /*
   * Five segments at the platform's padding overflow the dialog's body at
   * 320px, as TimeControl's four did, and at TimeControl's narrower padding
   * Bowls was still clipped by three pixels. Half that again keeps the five on
   * one row, and the platform's 44px floor on a segment holds the short words
   * up (the SettingsDialog story measures both). The platform's control is
   * written for two or three choices; the fit is H01's hand-back to the hub.
   */
  .five :global(.segment) {
    padding-inline: var(--s-2);
  }
</style>
