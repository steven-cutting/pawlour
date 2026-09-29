<script lang="ts">
  import { Modal, SettingsRow } from '@steven-cutting/biscuit-games';

  import type { Camera } from '$lib/domain/director';
  import type { Phase } from '$lib/domain/phases';
  import CameraControl from './CameraControl.svelte';
  import SoundControl from './SoundControl.svelte';
  import TimeControl from './TimeControl.svelte';

  /**
   * The settings: time, sound and camera, in the platform `Modal`.
   *
   * The Dialog guarantees (H `operation.allium`) are the `Modal`'s: focus
   * enters, Tab is held inside, Escape and the Close button close it, focus
   * returns to the opener when it unmounts. The `Modal` has no `open` of its
   * own, so this mounts it or not; every prop below is a slice of the page's
   * state or one of its callbacks.
   */
  let {
    open,
    onclose,
    time,
    ontime,
    sound,
    onenable,
    ondisable,
    camera,
    oncamera
  }: {
    open: boolean;
    onclose: () => void;
    time: Phase | 'auto';
    ontime: (value: Phase | 'auto') => void;
    sound: boolean;
    onenable: () => Promise<void>;
    ondisable: () => void;
    camera: Camera | 'auto';
    oncamera: (camera: Camera | 'auto') => void;
  } = $props();
</script>

{#if open}
  <Modal title="Settings" {onclose}>
    <SettingsRow>
      <TimeControl value={time} onchange={ontime} />
    </SettingsRow>
    <SettingsRow>
      <div class="sound">
        <SoundControl on={sound} {onenable} {ondisable} />
      </div>
    </SettingsRow>
    <SettingsRow>
      <CameraControl value={camera} onchange={oncamera} />
    </SettingsRow>
  </Modal>
{/if}

<style>
  .sound {
    inline-size: 100%;
  }
</style>
