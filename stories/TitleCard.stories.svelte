<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from 'storybook/test';

  import { GAME_NAME } from '../src/lib/brand';
  import TitleCard from '../src/lib/components/TitleCard.svelte';
  import { expectNothingScrollsSideways, FRAME_WIDTH, NARROWEST_PARAMETERS } from './narrowest';

  const OVERVIEW = [
    'The loading card and the photo card, in the platform’s own chrome: the themed ground',
    'and ink, the lockup the header carries, one line in the display face, plain',
    'third-person copy (PRD.md). DOM over the canvas, still, and hidden when there is',
    'nothing to say. The PNG’s photo frame keeps the overlay register; this card does not.',
    '',
    'No Cabin guarantee governs the card (`cabin.allium` excludes it). What holds is the',
    'platform’s: every token is one it declares, so the card follows theme and high',
    'contrast and each pair it paints is measured by the platform, and the copy is in a',
    'polite live region. The page, not the card, holds it up for at least a second.',
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
    await expect(canvas.getByText(`biscuit games / ${GAME_NAME}`)).toBeVisible();
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
