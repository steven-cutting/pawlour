<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';

  import Caption from '../src/lib/components/Caption.svelte';
  import {
    expectNothingScrollsSideways,
    FRAME_WIDTH,
    NARROWEST_PARAMETERS,
    SHELL_GUTTER
  } from './narrowest';

  const OVERVIEW = [
    'The narrator’s sentence under the room.',
    '',
    '`docs/specs/cabin.allium` — Cabin.@guarantee ACaptionIsShownAndAnnounced: shown in',
    'words and announced in the same words, once an activity has settled. One platform',
    '`Notice`, a visible sentence with `role="status"` that stays mounted while silent, so',
    'the words are seen and heard once and never twice.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/Caption',
    component: Caption,
    tags: ['autodocs'],
    parameters: { docs: { description: { component: OVERVIEW } } }
  });
</script>

<Story
  name="Silent"
  args={{}}
  play={async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('');
  }}
/>

<Story
  name="Captioned"
  args={{ caption: { text: 'Biscuit has gone to bed.', sequence: 1 } }}
  play={async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent(
      'Biscuit has gone to bed.'
    );
  }}
/>

<Story
  name="At the narrowest supported width"
  args={{ caption: { text: 'Biscuit is drinking. It is taking a while.', sequence: 2 } }}
  parameters={NARROWEST_PARAMETERS}
  play={async ({ canvasElement }) => {
    await expectNothingScrollsSideways(canvasElement);
  }}
>
  {#snippet template(args)}
    <div data-frame style="inline-size: {FRAME_WIDTH}; padding-inline: {SHELL_GUTTER}">
      <Caption {...args} />
    </div>
  {/snippet}
</Story>
