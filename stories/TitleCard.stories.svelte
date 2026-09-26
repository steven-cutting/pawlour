<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';

  import TitleCard from '../src/lib/components/TitleCard.svelte';
  import { expectNothingScrollsSideways, FRAME_WIDTH, NARROWEST_PARAMETERS } from './narrowest';

  const OVERVIEW = [
    'The loading card and the photo card, in the overlay register (CONVENTIONS.md §5.3):',
    'flat scarlet, black and white panels split by a hard diagonal, the word in the display',
    'face, plain third-person copy (PRD.md). DOM over the canvas, hidden when there is',
    'nothing to say.',
    '',
    'No Cabin guarantee governs the card (`cabin.allium` excludes it). What holds is the',
    'platform’s: the tokens are measured against the legibility floors in all four',
    'combinations by `tests/overlay-contrast.test.ts`, the copy is in a polite live region,',
    'and the sweep runs on `--dur-3`, so MotionOffIsAStillDiorama costs nothing here.',
    '',
    'The card is fixed to the viewport, so every story here is shown in its own frame.'
  ].join('\n');

  const { Story } = defineMeta({
    title: 'Cabin/TitleCard',
    component: TitleCard,
    tags: ['autodocs'],
    parameters: {
      docs: { description: { component: OVERVIEW }, story: { inline: false } },
      layout: 'fullscreen'
    },
    args: { mode: 'loading', progress: 0.4, phase: 'evening' }
  });
</script>

<Story
  name="Loading the room"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('PAWLOUR')).toBeVisible();
    await expect(canvas.getByRole('progressbar', { name: 'Loading the room' })).toHaveAttribute(
      'aria-valuenow',
      '40'
    );
  }}
/>

<Story
  name="Saved, with a caption"
  args={{ mode: 'photo', progress: 1, phase: 'night', caption: 'Biscuit has stopped watching.' }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Saved')).toBeVisible();
    await expect(canvas.getByText('Biscuit has stopped watching.')).toBeVisible();
  }}
/>

<Story name="Saved, by morning" args={{ mode: 'photo', progress: 1, phase: 'morning' }} />

<Story
  name="At the narrowest supported width"
  parameters={NARROWEST_PARAMETERS}
  play={async ({ canvasElement }) => {
    await expectNothingScrollsSideways(canvasElement);
  }}
>
  {#snippet template(args)}
    <div data-frame style="inline-size: {FRAME_WIDTH}">
      <TitleCard {...args} />
    </div>
  {/snippet}
</Story>
