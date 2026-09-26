<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, within } from 'storybook/test';

  import TimeControl from '../src/lib/components/TimeControl.svelte';
  import {
    expectComfortableTargets,
    expectNothingScrollsSideways,
    FRAME_WIDTH,
    NARROWEST_PARAMETERS,
    SHELL_GUTTER
  } from './narrowest';

  const OVERVIEW = [
    'The phase of the day: the clock’s, or one the player holds it at.',
    '',
    '`docs/specs/cabin.allium` — Cabin.@guarantee TimeFollowsTheClockUntilOverridden: the',
    'phase is the device’s hour until the player chooses one, and Auto hands it back. A',
    'platform `SegmentedControl`: native radios in a fieldset, one tab stop, arrows within',
    '(FullyKeyboardOperable), the legend as the group’s name.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/TimeControl',
    component: TimeControl,
    tags: ['autodocs'],
    parameters: { docs: { description: { component: OVERVIEW } } },
    args: { value: 'auto', onchange: fn() }
  });
</script>

<Story
  name="Following the clock"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Auto' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Night' }));
    await expect(args.onchange).toHaveBeenCalledWith('night');
  }}
/>

<Story
  name="Held at evening"
  args={{ value: 'evening' }}
  play={async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radio', { name: 'Evening' })).toBeChecked();
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
      <TimeControl {...args} />
    </div>
  {/snippet}
</Story>
