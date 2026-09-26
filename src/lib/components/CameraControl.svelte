<script lang="ts">
  import { SegmentedControl } from '@steven-cutting/biscuit-games';

  import type { Camera } from '$lib/domain/director';

  /**
   * Which of the three fixed presets the room is seen from.
   *
   * CONVENTIONS.md §1 decision 6: a diorama cut between three positions,
   * never panned. In v1 this control is the only route to them.
   */
  let { value, onchange }: { value: Camera; onchange: (camera: Camera) => void } = $props();

  const OPTIONS: readonly { value: Camera; label: string }[] = [
    { value: 'hearth', label: 'Hearth' },
    { value: 'window', label: 'Window' },
    { value: 'chair', label: 'Chair' }
  ];

  function chosen(next: string): void {
    const option = OPTIONS.find((each) => each.value === next);
    if (option) onchange(option.value);
  }
</script>

<SegmentedControl label="Camera" options={OPTIONS} {value} onchange={chosen} />
