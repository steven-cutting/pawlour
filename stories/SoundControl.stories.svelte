<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

  import SoundControl from '../src/lib/components/SoundControl.svelte';
  import {
    expectComfortableTargets,
    expectNothingScrollsSideways,
    FRAME_WIDTH,
    NARROWEST_PARAMETERS,
    SHELL_GUTTER
  } from './narrowest';

  const OVERVIEW = [
    'The ambient sound switch.',
    '',
    '`docs/specs/cabin.allium` — Cabin.@guarantee SoundNeverStartsUnasked: off whenever the',
    'room opens, and turning it on is the only thing that starts sound. The start is awaited',
    'inside the change handler, which is the gesture an `AudioContext` needs; when it cannot',
    'start, the switch stays off and a `Notice` says so in words.',
    '',
    'The platform `Switch` carries its state three ways (the knob, the word, `checked`),',
    'which is AppearanceNeverCarriesMeaningAlone; the whole label is the 44px target.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/SoundControl',
    component: SoundControl,
    tags: ['autodocs'],
    parameters: { docs: { description: { component: OVERVIEW } } },
    args: { on: false, onenable: fn(async () => {}), ondisable: fn() }
  });
</script>

<Story
  name="Off"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('switch', { name: 'Ambient sound' })).not.toBeChecked();
    await userEvent.click(canvas.getByRole('switch', { name: 'Ambient sound' }));
    await expect(args.onenable).toHaveBeenCalled();
  }}
/>

<Story
  name="On"
  args={{ on: true }}
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('switch', { name: 'Ambient sound' })).toBeChecked();
    await userEvent.click(canvas.getByRole('switch', { name: 'Ambient sound' }));
    await expect(args.ondisable).toHaveBeenCalled();
  }}
/>

<Story
  name="Could not start"
  args={{ onenable: fn(() => Promise.reject(new Error('The context did not start'))) }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('switch', { name: 'Ambient sound' }));
    await waitFor(async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('Sound could not start.');
    });
    await expect(canvas.getByRole('switch', { name: 'Ambient sound' })).not.toBeChecked();
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
      <SoundControl {...args} />
    </div>
  {/snippet}
</Story>
