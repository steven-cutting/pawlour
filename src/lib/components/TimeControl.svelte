<script lang="ts">
  import { SegmentedControl } from '@steven-cutting/biscuit-games';

  import type { Phase } from '$lib/domain/phases';

  /**
   * The phase of the day: the clock's, or one the player holds it at.
   *
   * `cabin.allium`'s TimeFollowsTheClockUntilOverridden. Auto is the clock; a
   * phase is an override that persists (the page stores it). The platform's
   * `SegmentedControl` is native radios in a fieldset: one tab stop, arrows
   * within, the legend as the group's name.
   */
  let { value, onchange }: { value: Phase | 'auto'; onchange: (value: Phase | 'auto') => void } =
    $props();

  const OPTIONS: readonly { value: Phase | 'auto'; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'morning', label: 'Morning' },
    { value: 'evening', label: 'Evening' },
    { value: 'night', label: 'Night' }
  ];

  function chosen(next: string): void {
    const option = OPTIONS.find((each) => each.value === next);
    if (option) onchange(option.value);
  }
</script>

<div class="four">
  <SegmentedControl label="Time of day" options={OPTIONS} {value} onchange={chosen} />
</div>

<style>
  /*
   * Four segments at the platform's padding run to 293px, wider than the
   * dialog's body at 320px, so Night was cut off. Narrower padding keeps the
   * four on one row at the narrowest width with every segment still past
   * 44px (the story measures it). The platform's control is written for two
   * or three choices; a four-choice fit is a hand-back to the hub.
   */
  .four :global(.segment) {
    padding-inline: var(--s-4);
  }
</style>
