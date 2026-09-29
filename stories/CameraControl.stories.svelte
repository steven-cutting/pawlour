<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, within } from 'storybook/test';

  import CameraControl from '../src/lib/components/CameraControl.svelte';
  import {
    expectComfortableTargets,
    expectNothingScrollsSideways,
    FRAME_WIDTH,
    NARROWEST_PARAMETERS,
    SHELL_GUTTER
  } from './narrowest';

  const OVERVIEW = [
    'Which fixed preset the room is seen from. Auto, the default, cuts to the preset whose',
    'part of the room she walks into; a preset pins the picture until Auto hands it back',
    '(`cabin.allium` TheCameraFollowsHerUntilPinned). A diorama cut between positions, never',
    'panned (CONVENTIONS.md §1 decision 6).',
    '',
    'H `operation.allium` — FullyKeyboardOperable and EveryControlIsAComfortableTarget,',
    'answered by the platform `SegmentedControl`: one tab stop, arrows within, each segment',
    'a whole target.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/CameraControl',
    component: CameraControl,
    tags: ['autodocs'],
    parameters: { docs: { description: { component: OVERVIEW } } },
    args: { value: 'auto', onchange: fn() }
  });
</script>

<Story
  name="Following her"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Auto' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Bowls' }));
    await expect(args.onchange).toHaveBeenCalledWith('bowls');
  }}
/>

<Story
  name="Pinned on the hearth"
  args={{ value: 'hearth' }}
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Hearth' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Auto' }));
    await expect(args.onchange).toHaveBeenCalledWith('auto');
  }}
/>

<Story
  name="Pinned on the chair"
  args={{ value: 'chair' }}
  play={async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radio', { name: 'Chair' })).toBeChecked();
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
      <CameraControl {...args} />
    </div>
  {/snippet}
</Story>
