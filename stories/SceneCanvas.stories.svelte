<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, within } from 'storybook/test';
  import SceneCanvas from '../src/routes/scene/SceneCanvas.svelte';
  import { initialState } from '../src/lib/domain/director';
  import type { SceneState } from '../src/lib/domain/director';
  import { createFakeFrames } from '../src/lib/ports/frame';
  import clips from '../src/lib/assets/biscuit.clips.json';
  import idle from '../src/lib/assets/stills/idle.morning.webp';
  import sleeping from '../src/lib/assets/stills/sleep.chair.night.webp';

  const state = initialState('morning', 'clear', false);
  const { Story } = defineMeta({
    title: 'Cabin/SceneCanvas',
    component: SceneCanvas,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component:
            'Cabin: MotionOffIsAStillDiorama and AContextLossLeavesAStill. The fallback has a caption-derived accessible name and stays usable at 320px. These fixtures explicitly disable WebGL and inject fake frames; real context loss and recovery are exercised in the scene review route.'
        }
      }
    },
    args: {
      state,
      animations: false,
      webgl: false,
      frames: createFakeFrames(),
      assets: {
        biscuit: '',
        cabin: '',
        clips,
        still: (state: SceneState) => (state.activity === 'sleep' ? sleeping : idle)
      },
      onProgress: fn(),
      onReady: fn(),
      onTap: fn(),
      onContextLost: fn()
    }
  });
</script>

<Story
  name="Still without WebGL"
  play={async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('img', { name: 'Biscuit in the cabin' })
    ).toBeVisible();
  }}
/>

<Story
  name="Captioned night still"
  args={{
    state: {
      ...state,
      phase: 'night',
      at: 'chair',
      activity: 'sleep',
      caption: { text: 'The chair has been claimed.', sequence: 1 }
    }
  }}
  play={async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('img', { name: 'The chair has been claimed.' })
    ).toBeVisible();
  }}
/>

<Story
  name="At the narrowest supported width"
  play={async ({ canvasElement }) => {
    const image = within(canvasElement).getByRole('img', { name: 'Biscuit in the cabin' });
    await expect(image.getBoundingClientRect().width).toBeLessThanOrEqual(320);
  }}
>
  {#snippet template(args)}
    <div style="width: 320px; height: 568px"><SceneCanvas {...args} /></div>
  {/snippet}
</Story>
