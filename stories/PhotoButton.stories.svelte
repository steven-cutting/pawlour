<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, within } from 'storybook/test';

  import PhotoButton from '../src/lib/components/PhotoButton.svelte';
  import {
    expectComfortableTargets,
    expectNothingScrollsSideways,
    FRAME_WIDTH,
    NARROWEST_PARAMETERS,
    SHELL_GUTTER
  } from './narrowest';

  const OVERVIEW = [
    'Photo mode’s one control (PRD.md): a plain PNG of the room, saved. The page captures',
    'and composes; this is the platform `Button` with the word and the camera beside it.',
    '',
    'H `operation.allium` — EveryControlIsAComfortableTarget and ATouchIsAcknowledged are',
    'the platform `Button`’s; the narrow story measures the first.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/PhotoButton',
    component: PhotoButton,
    tags: ['autodocs'],
    parameters: { docs: { description: { component: OVERVIEW } } },
    args: { oncapture: fn(async () => {}), busy: false }
  });
</script>

<Story
  name="Ready"
  play={async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Photo' }));
    await expect(args.oncapture).toHaveBeenCalled();
  }}
/>

<Story
  name="Busy"
  args={{ busy: true }}
  play={async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Photo' })).toBeDisabled();
  }}
/>

<Story
  name="At the narrowest supported width"
  parameters={NARROWEST_PARAMETERS}
  play={async ({ canvasElement }) => {
    await expectNothingScrollsSideways(canvasElement);
    await expectComfortableTargets(canvasElement);
  }}
>
  {#snippet template(args)}
    <div data-frame style="inline-size: {FRAME_WIDTH}; padding-inline: {SHELL_GUTTER}">
      <PhotoButton {...args} />
    </div>
  {/snippet}
</Story>
