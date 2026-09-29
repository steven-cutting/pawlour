<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import type { ComponentProps } from 'svelte';
  import { expect, fn, within } from 'storybook/test';
  import SceneCanvas from '../src/routes/scene/SceneCanvas.svelte';
  import { NARROWEST_SUPPORTED_WIDTH } from '../src/lib/config';
  import { initialState } from '../src/lib/domain/director';
  import type { SceneState } from '../src/lib/domain/director';
  import { createFakeFrames } from '../src/lib/ports/frame';
  import { createFakeRandom } from '../src/lib/ports/random';
  import clips from '../src/lib/assets/biscuit.clips.json';
  import idle from '../src/lib/assets/stills/idle.morning.webp';
  import sleeping from '../src/lib/assets/stills/sleep.chair.night.webp';

  // The component fills whatever box the page gives it and its still is
  // absolutely positioned, so it has no size of its own. Storybook's centred
  // layout shrink-wraps the story, and 100% of a shrink-wrapped block is 0.
  // Every story therefore frames it: the ticket's reference phone, and the
  // narrowest width the specification supports.
  const FRAME_WIDTH = 390;
  const FRAME_HEIGHT = 844;
  const NARROW_HEIGHT = 568;

  type Args = ComponentProps<typeof SceneCanvas>;

  const state = initialState('morning', 'clear', false);
  const { Story } = defineMeta({
    title: 'Cabin/SceneCanvas',
    component: SceneCanvas,
    tags: ['autodocs'],
    render: template,
    parameters: {
      docs: {
        description: {
          component:
            'Cabin: MotionOffIsAStillDiorama and AContextLossLeavesAStill. The fallback has a caption-derived accessible name and stays usable at 320px. These fixtures explicitly disable WebGL and inject fake frames; real context loss and recovery are exercised in the scene review route. The frames stand in for the page, which sizes the canvas in the app.'
        }
      }
    },
    args: {
      state,
      animations: false,
      webgl: false,
      frames: createFakeFrames(),
      random: createFakeRandom(),
      assets: {
        biscuit: '',
        cabin: '',
        fire: '',
        clips,
        still: (state: SceneState) => (state.activity === 'sleep' ? sleeping : idle)
      },
      onProgress: fn(),
      onReady: fn(),
      onTap: fn(),
      onArrived: fn(),
      onReached: fn(),
      onContextLost: fn(),
      onError: fn()
    }
  });

  // The frame is what makes the width assertion evidence: a still found by
  // role but laid out at 0px would pass `toBeVisible` and show nothing.
  async function expectStill(root: HTMLElement, name: string, width: number): Promise<void> {
    const image = within(root).getByRole('img', { name });
    await expect(image).toBeVisible();
    await expect(image.getBoundingClientRect().width).toBe(width);
  }
</script>

{#snippet template(args: Args)}
  <div data-frame style="width: {FRAME_WIDTH}px; height: {FRAME_HEIGHT}px">
    <SceneCanvas {...args} />
  </div>
{/snippet}

<Story
  name="Still without WebGL"
  play={async ({ canvasElement }) => {
    await expectStill(canvasElement, 'Biscuit in the cabin', FRAME_WIDTH);
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
    await expectStill(canvasElement, 'The chair has been claimed.', FRAME_WIDTH);
  }}
/>

<Story
  name="At the narrowest supported width"
  play={async ({ canvasElement }) => {
    await expectStill(canvasElement, 'Biscuit in the cabin', NARROWEST_SUPPORTED_WIDTH);
  }}
>
  {#snippet template(args)}
    <div data-frame style="width: {NARROWEST_SUPPORTED_WIDTH}px; height: {NARROW_HEIGHT}px">
      <SceneCanvas {...args} />
    </div>
  {/snippet}
</Story>
