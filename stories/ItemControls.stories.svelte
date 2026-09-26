<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn, userEvent, within } from 'storybook/test';

  import ItemControls from '../src/lib/components/ItemControls.svelte';
  import { ITEM_CONTROLS } from '../src/lib/data/controls';
  import {
    expectComfortableTargets,
    expectNothingScrollsSideways,
    FRAME_WIDTH,
    NARROWEST_PARAMETERS,
    SHELL_GUTTER
  } from './narrowest';

  const OVERVIEW = [
    'The row of things she can be sent to, and her.',
    '',
    '`docs/specs/cabin.allium` — Cabin.@guarantee EveryItemIsAControl: each thing, each of',
    'the two lights, and she herself, as a named control outside the canvas, so a keyboard',
    'reaches the room the way a thumb does. Where she is carries `aria-current` and the',
    'word “she is here”, never the fill alone (AppearanceNeverCarriesMeaningAlone); her own',
    'button never carries it.',
    '',
    'DirectManipulation.@invariant EveryControlIsAComfortableTarget: three per row at the',
    'narrowest width, each a platform `Button` measured at 44px both ways.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/ItemControls',
    component: ItemControls,
    tags: ['autodocs'],
    parameters: { docs: { description: { component: OVERVIEW } } },
    args: { items: ITEM_CONTROLS, active: 'floor', onselect: fn() }
  });
</script>

<Story
  name="On the floor"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button')).toHaveLength(ITEM_CONTROLS.length);
    await expect(canvas.queryAllByRole('button', { current: true })).toHaveLength(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Pet' }));
    await expect(args.onselect).toHaveBeenCalledWith('biscuit');
  }}
/>

<Story
  name="She is at the bed"
  args={{ active: 'bed' }}
  play={async ({ canvasElement }) => {
    const bed = within(canvasElement).getByRole('button', { name: 'Bed, she is here' });
    await expect(bed).toHaveAttribute('aria-current', 'true');
  }}
/>

<Story
  name="At the narrowest supported width"
  args={{ active: 'chair' }}
  parameters={NARROWEST_PARAMETERS}
  play={async ({ canvasElement }) => {
    // DirectManipulation.@invariant EveryControlIsAComfortableTarget
    await expectNothingScrollsSideways(canvasElement);
    await expectComfortableTargets(canvasElement);
  }}
>
  {#snippet template(args)}
    <div data-frame style="inline-size: {FRAME_WIDTH}; padding-inline: {SHELL_GUTTER}">
      <ItemControls {...args} />
    </div>
  {/snippet}
</Story>
