<script lang="ts">
  import { Notice } from '@steven-cutting/biscuit-games';

  /**
   * The narrator's sentence, shown and announced in the same words.
   *
   * `cabin.allium`'s ACaptionIsShownAndAnnounced. The platform's `Notice` is a
   * visible sentence with `role="status"`: one live region that stays mounted
   * and whose contents come and go, so the same words are seen and heard once.
   * `sequence` is the director's count of captions shown; advancing it
   * replaces the nodes, which is what makes a repeated sentence announce again
   * (it does not repeat one, §6.3, but the mechanism costs nothing).
   */
  let { caption }: { caption?: { text: string; sequence: number } } = $props();
</script>

<Notice message={caption?.text ?? null} sequence={caption?.sequence ?? 0} />
