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
    'Which of the three fixed presets the room is seen from: a diorama cut between',
    'positions, never panned (CONVENTIONS.md §1 decision 6). In v1 this is the only route.',
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
    args: { value: 'hearth', onchange: fn() }
  });
</script>

<Story
  name="From the hearth"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Hearth' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Window' }));
    await expect(args.onchange).toHaveBeenCalledWith('window');
  }}
/>

<Story
  name="From the chair"
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
