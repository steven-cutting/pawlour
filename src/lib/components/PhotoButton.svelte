<script lang="ts">
  import { Button } from '@steven-cutting/biscuit-games';

  import GameIcon from './GameIcon.svelte';

  /**
   * Photo mode's one control: a plain PNG of the room, saved.
   *
   * The page does the capturing (it holds the canvas and the ports); this is
   * the platform `Button` with the word and the camera beside it, unavailable
   * while a capture is being composed so a second tap cannot start another.
   */
  let { oncapture, busy }: { oncapture: () => Promise<void>; busy: boolean } = $props();
</script>

<Button
  disabled={busy}
  onclick={() => {
    void oncapture();
  }}
>
  <GameIcon name="camera" />
  Photo
</Button>
