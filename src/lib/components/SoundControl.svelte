<script lang="ts">
  import { Notice, Switch } from '@steven-cutting/biscuit-games';

  /**
   * The ambient sound switch: off whenever the room opens.
   *
   * `cabin.allium`'s SoundNeverStartsUnasked. Turning it on is the only thing
   * that starts sound, and the start is awaited inside the change handler so
   * the page's `AudioContext` begins inside the gesture (CONVENTIONS.md §6.2,
   * §12). If it cannot start, the switch stays off and a `Notice` says so.
   *
   * `pending` keeps the track on while the start is awaited: the platform's
   * `Switch` shows the prop, and only a prop that moves resets the track it
   * flipped on the click. On success the page sets `on` before `pending`
   * clears, so the track never dips; on failure `checked` goes true then
   * false, and the switch reads off again.
   */
  let {
    on,
    onenable,
    ondisable
  }: { on: boolean; onenable: () => Promise<void>; ondisable: () => void } = $props();

  let pending = $state(false);
  let failed = $state(false);
  let failures = $state(0);

  async function changed(checked: boolean): Promise<void> {
    if (!checked) {
      failed = false;
      ondisable();
      return;
    }
    pending = true;
    failed = false;
    try {
      await onenable();
    } catch {
      failed = true;
      failures += 1;
    } finally {
      pending = false;
    }
  }
</script>

<Switch
  label="Ambient sound"
  description="The fire, the weather outside, and what she is doing"
  checked={on || pending}
  onchange={(checked) => {
    void changed(checked);
  }}
/>
<Notice message={failed ? 'Sound could not start.' : null} sequence={failures} />
