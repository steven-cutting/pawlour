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

<SegmentedControl label="Time of day" options={OPTIONS} {value} onchange={chosen} />
